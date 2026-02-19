import type {Transform} from "./base"
import {BaseGLGlyph} from "./base"
import {Float32Buffer, NormalizedUint8Buffer, Uint8Buffer, expand_to_per_vertex} from "./buffer"
import type {ReglWrapper} from "./regl_wrap"
import type {GlyphView} from "../glyph"
import type {PatchesView} from "../patches"
import type {AccumulateProps, LineGlyphProps, LineDashGlyphProps} from "./types"
import type {Elements, Texture2D} from "regl"
import type * as p from "core/properties"
import type {HatchPattern} from "core/property_mixins"
import {resolve_line_dash} from "core/visuals/line"
import {split_rings, classify_rings, build_line_from_ring, generate_skirt_geometry, POLYGON_AA_WIDTH} from "core/util/polygon"
import type {SkirtGeometry, RingLineData} from "core/util/polygon"
import earcut from "earcut"

type PolygonData = {
  // Per-polygon line data: each polygon has an array of ring outlines
  line_rings: RingLineData[][]
  // Per-polygon fill vertex counts (for expanding visual buffers to per-vertex)
  fill_nvertices: number[]
  // Per-polygon element ranges for indexed fill rendering.
  // Offsets and counts are in element index units (not bytes).
  fill_element_offsets: number[]
  fill_element_counts: number[]
}

export class PatchesGL extends BaseGLGlyph {
  // Fill buffers
  _positions?: Float32Buffer
  _edge_distance?: Float32Buffer
  _elements: Elements | null = null
  _total_element_count: number = 0

  // Per-vertex visual buffers for polygon fill (divisor 0)
  private _pv_fill_color = new NormalizedUint8Buffer(this.regl_wrapper, 4)
  private _pv_hatch_patterns = new Uint8Buffer(this.regl_wrapper)
  private _pv_hatch_scales = new Float32Buffer(this.regl_wrapper)
  private _pv_hatch_weights = new Float32Buffer(this.regl_wrapper)
  private _pv_hatch_rgba = new NormalizedUint8Buffer(this.regl_wrapper, 4)

  // Source visual buffers (scalar or per-polygon, from _set_visuals)
  private _fill_color = new NormalizedUint8Buffer(this.regl_wrapper, 4)
  private _have_hatch: boolean = false
  private readonly _hatch_patterns = new Uint8Buffer(this.regl_wrapper)
  private readonly _hatch_scales = new Float32Buffer(this.regl_wrapper)
  private readonly _hatch_weights = new Float32Buffer(this.regl_wrapper)
  private readonly _hatch_rgba = new NormalizedUint8Buffer(this.regl_wrapper, 4)

  // Stroke buffers
  private _line_points_buf?: Float32Buffer
  private _line_show_buf?: Uint8Buffer
  private _length_so_far_buf?: Float32Buffer
  private readonly _linewidth = new Float32Buffer(this.regl_wrapper)
  private readonly _line_color = new NormalizedUint8Buffer(this.regl_wrapper, 4)
  private readonly _line_cap = new Uint8Buffer(this.regl_wrapper)
  private readonly _line_join = new Uint8Buffer(this.regl_wrapper)

  // Dash state
  private _is_dashed = false
  private _dash_tex: (Texture2D | null)[] = []
  private _dash_tex_info?: Float32Buffer
  private _dash_scale?: Float32Buffer
  private _dash_offset?: Float32Buffer

  // Per-polygon scalar draw buffers for stroke rendering.
  // Since geometry is re-uploaded per ring (line_offset = 0), per-polygon
  // vector visual properties are extracted into these scalar buffers.
  private _draw_lw?: Float32Buffer
  private _draw_lc?: NormalizedUint8Buffer
  private _draw_lcap?: Uint8Buffer
  private _draw_ljoin?: Uint8Buffer
  private _draw_dti?: Float32Buffer
  private _draw_ds?: Float32Buffer
  private _draw_do?: Float32Buffer

  _poly_data?: PolygonData

  private _pv_dirty = true

  constructor(regl_wrapper: ReglWrapper, override readonly glyph: PatchesView) {
    super(regl_wrapper, glyph)
  }

  // Issues one fill draw call per selected polygon and one stroke draw call
  // per ring per selected polygon. This matches the MultiLineGL pattern and
  // is necessary for correct selection/hover rendering, but may become a
  // bottleneck for plots with very many polygons.
  draw(indices: number[], main_glyph: GlyphView, transform: Transform): void {
    const main_patches = main_glyph as PatchesView
    const main_gl = main_patches.glglyph!

    if (this.visuals_changed) {
      this._set_visuals()
      this.visuals_changed = false
      this._pv_dirty = true
    }

    const data_changed_or_mapped = main_gl.data_changed || main_gl.data_mapped
    if (data_changed_or_mapped) {
      main_gl._set_data()
      main_gl.data_changed = false
      main_gl.data_mapped = false
      this._pv_dirty = true
    }

    if (main_gl._poly_data == null) {
      return
    }

    const {width, height} = transform
    const canvas_size: [number, number] = [width, height]
    const poly_data = main_gl._poly_data

    // Expand visual buffers to per-vertex when visuals or data changed
    if (this._pv_dirty && poly_data.fill_nvertices.length > 0) {
      const vertex_counts = poly_data.fill_nvertices
      expand_to_per_vertex(this._fill_color, this._pv_fill_color, vertex_counts, 4)
      if (this._have_hatch) {
        expand_to_per_vertex(this._hatch_patterns, this._pv_hatch_patterns, vertex_counts, 1)
        expand_to_per_vertex(this._hatch_scales, this._pv_hatch_scales, vertex_counts, 1)
        expand_to_per_vertex(this._hatch_weights, this._pv_hatch_weights, vertex_counts, 1)
        expand_to_per_vertex(this._hatch_rgba, this._pv_hatch_rgba, vertex_counts, 4)
      }
      this._pv_dirty = false
    }

    // Fill pass - draw each polygon separately to respect selection indices
    const fill_visuals = this.glyph.visuals.fill
    if (fill_visuals.doit && main_gl._elements != null && main_gl._total_element_count > 0) {
      for (const i of indices) {
        if (i >= poly_data.fill_element_counts.length) {
          continue
        }
        const count = poly_data.fill_element_counts[i]
        if (count == 0) {
          continue
        }
        const offset = poly_data.fill_element_offsets[i]

        if (this._have_hatch) {
          this.regl_wrapper.polygon_hatch()({
            scissor: this.regl_wrapper.scissor,
            viewport: this.regl_wrapper.viewport,
            canvas_size,
            positions: main_gl._positions!,
            fill_color: this._pv_fill_color,
            edge_distance: main_gl._edge_distance!,
            elements: main_gl._elements,
            count,
            offset,
            antialias: POLYGON_AA_WIDTH / transform.pixel_ratio,
            hatch_pattern: this._pv_hatch_patterns,
            hatch_scale: this._pv_hatch_scales,
            hatch_weight: this._pv_hatch_weights,
            hatch_color: this._pv_hatch_rgba,
          })
        } else {
          this.regl_wrapper.polygon()({
            scissor: this.regl_wrapper.scissor,
            viewport: this.regl_wrapper.viewport,
            canvas_size,
            positions: main_gl._positions!,
            fill_color: this._pv_fill_color,
            edge_distance: main_gl._edge_distance!,
            elements: main_gl._elements,
            count,
            offset,
            antialias: POLYGON_AA_WIDTH / transform.pixel_ratio,
          })
        }
      }
    }

    // Stroke pass - draw each ring outline separately.
    // Geometry (points, show, length_so_far) is re-uploaded per ring, so
    // point_offset and line_offset are always 0. Per-polygon vector visual
    // properties are extracted into scalar draw buffers for each polygon.
    const line_visuals = this.glyph.visuals.line
    if (line_visuals.doit) {
      for (const i of indices) {
        if (i >= poly_data.line_rings.length) {
          continue
        }

        // Extract per-polygon visual values into scalar buffers
        const linewidth = this._linewidth.extract_at(i, 1, this._draw_lw ??= new Float32Buffer(this.regl_wrapper))
        const line_color = this._line_color.extract_at(i, 4, this._draw_lc ??= new NormalizedUint8Buffer(this.regl_wrapper, 4))
        const line_cap = this._line_cap.extract_at(i, 1, this._draw_lcap ??= new Uint8Buffer(this.regl_wrapper))
        const line_join = this._line_join.extract_at(i, 1, this._draw_ljoin ??= new Uint8Buffer(this.regl_wrapper))

        let dash_tex_info: Float32Buffer | undefined
        let dash_scale: Float32Buffer | undefined
        let dash_offset: Float32Buffer | undefined
        const dash_i = Math.min(i, this._dash_tex.length - 1)
        if (this._is_dashed && this._dash_tex[dash_i] != null) {
          dash_tex_info = this._dash_tex_info!.extract_at(i, 4, this._draw_dti ??= new Float32Buffer(this.regl_wrapper, 4))
          dash_scale = this._dash_scale!.extract_at(i, 1, this._draw_ds ??= new Float32Buffer(this.regl_wrapper))
          dash_offset = this._dash_offset!.extract_at(i, 1, this._draw_do ??= new Float32Buffer(this.regl_wrapper))
        }

        const rings = poly_data.line_rings[i]

        for (const ring of rings) {
          if (ring.nline < 2) {
            continue
          }

          const nsegments = ring.nline - 1

          const [framebuffer, tex] = this.regl_wrapper.framebuffer_and_texture
          this.regl_wrapper.clear_framebuffer(framebuffer)

          // Upload this ring's line data
          if (this._line_points_buf == null) {
            this._line_points_buf = new Float32Buffer(this.regl_wrapper)
          }
          const pts_array = this._line_points_buf.get_sized_array(ring.points.length)
          pts_array.set(ring.points)
          this._line_points_buf.update()

          if (this._line_show_buf == null) {
            this._line_show_buf = new Uint8Buffer(this.regl_wrapper)
          }
          const shw_array = this._line_show_buf.get_sized_array(ring.show.length)
          shw_array.set(ring.show)
          this._line_show_buf.update()

          const solid_props: LineGlyphProps = {
            scissor: this.regl_wrapper.scissor,
            viewport: this.regl_wrapper.viewport,
            canvas_size,
            antialias: 1.5 / transform.pixel_ratio,
            miter_limit: 10.0,
            points: this._line_points_buf,
            show: this._line_show_buf,
            nsegments,
            linewidth,
            line_color,
            line_cap,
            line_join,
            framebuffer,
            point_offset: 0,
            line_offset: 0,
          }

          if (this._is_dashed && dash_tex_info != null) {
            // Upload length_so_far for this ring
            if (this._length_so_far_buf == null) {
              this._length_so_far_buf = new Float32Buffer(this.regl_wrapper)
            }
            const lsf_array = this._length_so_far_buf.get_sized_array(ring.length_so_far.length)
            lsf_array.set(ring.length_so_far)
            this._length_so_far_buf.update()

            const dashed_props: LineDashGlyphProps = {
              ...solid_props,
              length_so_far: this._length_so_far_buf,
              dash_tex: this._dash_tex[dash_i]!,
              dash_tex_info,
              dash_scale: dash_scale!,
              dash_offset: dash_offset!,
            }
            this.regl_wrapper.dashed_line()(dashed_props)
          } else {
            this.regl_wrapper.solid_line()(solid_props)
          }

          const accumulate_props: AccumulateProps = {
            scissor: this.regl_wrapper.scissor,
            viewport: this.regl_wrapper.viewport,
            framebuffer_tex: tex,
          }
          this.regl_wrapper.accumulate()(accumulate_props)
        }
      }
    }
  }

  _set_data(): void {
    const {sxs, sys} = this.glyph
    const npoly = this.glyph.data_size

    // Pass 1: triangulate each polygon, generate skirt geometry, and tally total sizes.
    // Each polygon's rings are classified into groups (outer + holes vs disjoint parts),
    // and each group is triangulated independently.
    type GroupResult = {
      geom: SkirtGeometry
      rings: number[][]
    }
    type PolyResult = {
      groups: GroupResult[]
      all_rings: number[][]  // all original rings for line rendering
    }
    const per_poly: (PolyResult | null)[] = new Array(npoly)
    const fill_nvertices = new Array<number>(npoly)
    const fill_element_offsets = new Array<number>(npoly)
    const fill_element_counts = new Array<number>(npoly)
    const line_rings: RingLineData[][] = new Array(npoly)

    let total_coords = 0
    let total_elements = 0

    for (let i = 0; i < npoly; i++) {
      const sx = sxs.get(i)
      const sy = sys.get(i)
      const rings = split_rings(sx, sy)

      line_rings[i] = []

      if (rings.length > 0) {
        const groups = classify_rings(rings)
        const group_results: GroupResult[] = []

        let poly_nvertices = 0
        let poly_elements = 0

        for (const group of groups) {
          const {flat_coords, rings: group_rings} = group
          const hole_indices: number[] = []
          let offset = 0
          for (let r = 0; r < group_rings.length; r++) {
            if (r > 0) {
              hole_indices.push(offset)
            }
            offset += group_rings[r].length / 2
          }

          const tri_indices = earcut(flat_coords, hole_indices.length > 0 ? hole_indices : undefined, 2)
          const geom = generate_skirt_geometry(flat_coords, group_rings, tri_indices, POLYGON_AA_WIDTH)

          group_results.push({geom, rings: group_rings})
          poly_nvertices += geom.nvertices
          poly_elements += geom.indices.length
        }

        per_poly[i] = {groups: group_results, all_rings: rings}
        fill_nvertices[i] = poly_nvertices
        fill_element_offsets[i] = total_elements
        fill_element_counts[i] = poly_elements
        total_coords += poly_nvertices * 2
        total_elements += poly_elements
      } else {
        per_poly[i] = null
        fill_nvertices[i] = 0
        fill_element_offsets[i] = total_elements
        fill_element_counts[i] = 0
      }
    }

    // Pass 2: copy per-polygon results directly into destination buffers.
    const total_vertices = total_coords / 2
    if (this._positions == null) {
      this._positions = new Float32Buffer(this.regl_wrapper, 2)
    }
    const pos_array = this._positions.get_sized_array(total_coords)

    if (this._edge_distance == null) {
      this._edge_distance = new Float32Buffer(this.regl_wrapper)
    }
    const ed_array = this._edge_distance.get_sized_array(total_vertices)

    const elem_array = new Uint32Array(total_elements)
    let pos_offset = 0
    let ed_offset = 0
    let elem_offset = 0
    let vertex_offset = 0

    for (let i = 0; i < npoly; i++) {
      const result = per_poly[i]
      if (result == null) {
        continue
      }

      const {groups, all_rings} = result

      for (const {geom} of groups) {
        pos_array.set(geom.positions, pos_offset)
        pos_offset += geom.positions.length

        ed_array.set(geom.edge_distance, ed_offset)
        ed_offset += geom.edge_distance.length

        // Offset indices by vertex_offset for merged buffer
        for (let j = 0; j < geom.indices.length; j++) {
          elem_array[elem_offset + j] = geom.indices[j] + vertex_offset
        }
        elem_offset += geom.indices.length
        vertex_offset += geom.nvertices
      }

      // Build line data for all rings (outer boundary + holes + disjoint)
      const ring_line_data: RingLineData[] = []
      for (const ring of all_rings) {
        const data = build_line_from_ring(ring)
        if (data.nline > 0) {
          ring_line_data.push(data)
        }
      }
      line_rings[i] = ring_line_data
    }

    this._poly_data = {
      line_rings,
      fill_nvertices,
      fill_element_offsets,
      fill_element_counts,
    }

    this._positions.update()
    this._edge_distance.update()

    // Upload merged element buffer
    this._total_element_count = total_elements
    if (this._elements != null) {
      this._elements.destroy()
    }
    if (total_elements > 0) {
      this._elements = this.regl_wrapper.elements({
        usage: "static",
        primitive: "triangles",
        data: elem_array,
        type: "uint32",
      })
    } else {
      this._elements = null
    }
  }

  private _set_visuals(): void {
    const fill_visuals = this.glyph.visuals.fill
    this._fill_color.set_from_color(fill_visuals.fill_color, fill_visuals.fill_alpha)

    const line_visuals = this.glyph.visuals.line
    this._line_color.set_from_color(line_visuals.line_color, line_visuals.line_alpha)
    this._linewidth.set_from_prop(line_visuals.line_width)
    this._line_cap.set_from_line_cap(line_visuals.line_cap)
    this._line_join.set_from_line_join(line_visuals.line_join)

    // Dash detection
    const {line_dash} = line_visuals
    this._is_dashed = !(line_dash.is_Scalar() && line_dash.get(0).length == 0)

    if (this._is_dashed) {
      if (this._dash_offset == null) {
        this._dash_offset = new Float32Buffer(this.regl_wrapper)
      }
      this._dash_offset.set_from_prop(line_visuals.line_dash_offset)

      const n = line_dash.length

      if (this._dash_tex_info == null) {
        this._dash_tex_info = new Float32Buffer(this.regl_wrapper, 4)
      }
      const dash_tex_info = this._dash_tex_info.get_sized_array(4*n)

      if (this._dash_scale == null) {
        this._dash_scale = new Float32Buffer(this.regl_wrapper)
      }
      const dash_scale = this._dash_scale.get_sized_array(n)

      this._dash_tex = []
      for (let i = 0; i < n; i++) {
        const arr = resolve_line_dash(line_dash.get(i))
        if (arr.length > 0) {
          const [tex_info, tex, scale] = this.regl_wrapper.get_dash(arr)
          this._dash_tex.push(tex)
          for (let j = 0; j < 4; j++) {
            dash_tex_info[4*i + j] = tex_info[j]
          }
          dash_scale[i] = scale
        } else {
          this._dash_tex.push(null)
          dash_tex_info.fill(0, 4*i, 4*(i+1))
          dash_scale[i] = 0
        }
      }

      // Mark scalar so that to_attribute_config_nested always uses offset 0,
      // consistent with line_offset: 0 in the draw call.
      const dash_is_scalar = line_dash.is_Scalar()
      this._dash_tex_info.update(dash_is_scalar)
      this._dash_scale.update(dash_is_scalar)
    }

    const hatch_visuals = this.glyph.visuals.hatch
    this._have_hatch = hatch_visuals.doit
    if (this._have_hatch) {
      this._hatch_patterns.set_from_hatch_pattern(hatch_visuals.hatch_pattern as p.Uniform<HatchPattern>)
      this._hatch_scales.set_from_prop(hatch_visuals.hatch_scale)
      this._hatch_weights.set_from_prop(hatch_visuals.hatch_weight)
      this._hatch_rgba.set_from_color(hatch_visuals.hatch_color, hatch_visuals.hatch_alpha)
    }
  }

}
