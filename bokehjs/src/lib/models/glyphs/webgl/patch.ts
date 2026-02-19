import type {Transform} from "./base"
import {BaseGLGlyph} from "./base"
import {Float32Buffer, NormalizedUint8Buffer, Uint8Buffer, expand_to_per_vertex} from "./buffer"
import type {ReglWrapper} from "./regl_wrap"
import type {GlyphView} from "../glyph"
import type {PatchView} from "../patch"
import type {AccumulateProps, LineGlyphProps, LineDashGlyphProps} from "./types"
import type {Elements, Texture2D} from "regl"
import type * as p from "core/properties"
import type {HatchPattern} from "core/property_mixins"
import {resolve_line_dash} from "core/visuals/line"
import {split_rings, classify_rings, build_line_from_ring, generate_skirt_geometry, POLYGON_AA_WIDTH} from "core/util/polygon"
import type {SkirtGeometry, RingLineData} from "core/util/polygon"
import earcut from "earcut"

export class PatchGL extends BaseGLGlyph {
  // Fill buffers
  private _positions?: Float32Buffer
  private _edge_distance?: Float32Buffer
  _elements: Elements | null = null

  // Per-vertex visual buffers for polygon fill (divisor 0)
  private _pv_fill_color = new NormalizedUint8Buffer(this.regl_wrapper, 4)
  private _pv_hatch_patterns = new Uint8Buffer(this.regl_wrapper)
  private _pv_hatch_scales = new Float32Buffer(this.regl_wrapper)
  private _pv_hatch_weights = new Float32Buffer(this.regl_wrapper)
  private _pv_hatch_rgba = new NormalizedUint8Buffer(this.regl_wrapper, 4)

  // Source visual buffers (scalar, from _set_visuals)
  private _fill_color = new NormalizedUint8Buffer(this.regl_wrapper, 4)
  private _have_hatch: boolean = false
  private readonly _hatch_patterns = new Uint8Buffer(this.regl_wrapper)
  private readonly _hatch_scales = new Float32Buffer(this.regl_wrapper)
  private readonly _hatch_weights = new Float32Buffer(this.regl_wrapper)
  private readonly _hatch_rgba = new NormalizedUint8Buffer(this.regl_wrapper, 4)

  // Stroke upload buffers (reuse line infrastructure)
  private _line_points_buf?: Float32Buffer
  private _line_show_buf?: Uint8Buffer
  private readonly _linewidth = new Float32Buffer(this.regl_wrapper)
  private readonly _line_color = new NormalizedUint8Buffer(this.regl_wrapper, 4)
  private readonly _line_cap = new Uint8Buffer(this.regl_wrapper)
  private readonly _line_join = new Uint8Buffer(this.regl_wrapper)

  // Dash state
  private _is_dashed = false
  private _length_so_far_buf?: Float32Buffer
  private _dash_tex: (Texture2D | null)[] = []
  private _dash_tex_info?: Float32Buffer
  private _dash_scale?: Float32Buffer
  private _dash_offset?: Float32Buffer

  _triangle_count: number = 0
  _nvertices: number = 0
  _ring_data: RingLineData[] = []

  private _pv_dirty = true

  constructor(regl_wrapper: ReglWrapper, override readonly glyph: PatchView) {
    super(regl_wrapper, glyph)
  }

  draw(_indices: number[], main_glyph: GlyphView, transform: Transform): void {
    const main_patch = main_glyph as PatchView
    const main_gl = main_patch.glglyph!

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

    if (main_gl._triangle_count == 0 && main_gl._ring_data.length == 0) {
      return
    }

    // Expand visual buffers to per-vertex when visuals or data changed
    if (this._pv_dirty && main_gl._nvertices > 0) {
      const vertex_counts = [main_gl._nvertices]
      expand_to_per_vertex(this._fill_color, this._pv_fill_color, vertex_counts, 4)
      if (this._have_hatch) {
        expand_to_per_vertex(this._hatch_patterns, this._pv_hatch_patterns, vertex_counts, 1)
        expand_to_per_vertex(this._hatch_scales, this._pv_hatch_scales, vertex_counts, 1)
        expand_to_per_vertex(this._hatch_weights, this._pv_hatch_weights, vertex_counts, 1)
        expand_to_per_vertex(this._hatch_rgba, this._pv_hatch_rgba, vertex_counts, 4)
      }
      this._pv_dirty = false
    }

    const {width, height} = transform
    const canvas_size: [number, number] = [width, height]

    // Fill pass
    if (main_gl._triangle_count > 0 && main_gl._elements != null) {
      const fill_visuals = this.glyph.visuals.fill
      if (fill_visuals.doit) {
        if (this._have_hatch) {
          this.regl_wrapper.polygon_hatch()({
            scissor: this.regl_wrapper.scissor,
            viewport: this.regl_wrapper.viewport,
            canvas_size,
            positions: main_gl._positions!,
            fill_color: this._pv_fill_color,
            edge_distance: main_gl._edge_distance!,
            elements: main_gl._elements,
            count: main_gl._triangle_count * 3,
            offset: 0,
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
            count: main_gl._triangle_count * 3,
            offset: 0,
            antialias: POLYGON_AA_WIDTH / transform.pixel_ratio,
          })
        }
      }
    }

    // Stroke pass - draw each ring outline separately
    if (main_gl._ring_data.length > 0) {
      const line_visuals = this.glyph.visuals.line
      if (line_visuals.doit) {
        for (const ring of main_gl._ring_data) {
          if (ring.nline < 2) {
            continue
          }

          const nsegments = ring.nline - 1

          const [framebuffer, tex] = this.regl_wrapper.framebuffer_and_texture
          this.regl_wrapper.clear_framebuffer(framebuffer)

          // Upload ring data
          if (this._line_points_buf == null) {
            this._line_points_buf = new Float32Buffer(this.regl_wrapper)
          }
          const pts = this._line_points_buf.get_sized_array(ring.points.length)
          pts.set(ring.points)
          this._line_points_buf.update()

          if (this._line_show_buf == null) {
            this._line_show_buf = new Uint8Buffer(this.regl_wrapper)
          }
          const shw = this._line_show_buf.get_sized_array(ring.show.length)
          shw.set(ring.show)
          this._line_show_buf.update()

          if (this._is_dashed) {
            if (this._length_so_far_buf == null) {
              this._length_so_far_buf = new Float32Buffer(this.regl_wrapper)
            }
            const lsf = this._length_so_far_buf.get_sized_array(ring.length_so_far.length)
            lsf.set(ring.length_so_far)
            this._length_so_far_buf.update()
          }

          const solid_props: LineGlyphProps = {
            scissor: this.regl_wrapper.scissor,
            viewport: this.regl_wrapper.viewport,
            canvas_size,
            antialias: 1.5 / transform.pixel_ratio,
            miter_limit: 10.0,
            points: this._line_points_buf,
            show: this._line_show_buf,
            nsegments,
            linewidth: this._linewidth,
            line_color: this._line_color,
            line_cap: this._line_cap,
            line_join: this._line_join,
            framebuffer,
            point_offset: 0,
            line_offset: 0,
          }
          if (this._is_dashed && this._dash_tex[0] != null) {
            const dashed_props: LineDashGlyphProps = {
              ...solid_props,
              length_so_far: this._length_so_far_buf!,
              dash_tex: this._dash_tex[0],
              dash_tex_info: this._dash_tex_info!,
              dash_scale: this._dash_scale!,
              dash_offset: this._dash_offset!,
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
    const {sx, sy} = this.glyph
    const rings = split_rings(sx, sy)

    if (rings.length > 0) {
      // Classify rings into groups (outer+holes vs disjoint parts)
      const groups = classify_rings(rings)

      let total_nvertices = 0
      let total_ntriangles = 0
      let total_coords = 0
      let total_elements = 0

      // Triangulate each group independently
      const group_geoms: SkirtGeometry[] = []
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

        group_geoms.push(geom)
        total_nvertices += geom.nvertices
        total_ntriangles += geom.ntriangles
        total_coords += geom.positions.length
        total_elements += geom.indices.length
      }

      this._triangle_count = total_ntriangles
      this._nvertices = total_nvertices

      // Merge all group geometries into single buffers
      if (this._positions == null) {
        this._positions = new Float32Buffer(this.regl_wrapper, 2)
      }
      const pos_array = this._positions.get_sized_array(total_coords)

      if (this._edge_distance == null) {
        this._edge_distance = new Float32Buffer(this.regl_wrapper)
      }
      const ed_array = this._edge_distance.get_sized_array(total_nvertices)

      const elem_array = new Uint32Array(total_elements)
      let pos_offset = 0
      let ed_offset = 0
      let elem_offset = 0
      let vertex_offset = 0

      for (const geom of group_geoms) {
        pos_array.set(geom.positions, pos_offset)
        pos_offset += geom.positions.length

        ed_array.set(geom.edge_distance, ed_offset)
        ed_offset += geom.edge_distance.length

        for (let j = 0; j < geom.indices.length; j++) {
          elem_array[elem_offset + j] = geom.indices[j] + vertex_offset
        }
        elem_offset += geom.indices.length
        vertex_offset += geom.nvertices
      }

      this._positions.update()
      this._edge_distance.update()

      // Create element buffer via regl
      if (this._elements != null) {
        this._elements.destroy()
      }
      this._elements = this.regl_wrapper.elements({
        usage: "static",
        primitive: "triangles",
        data: elem_array,
        type: "uint32",
      })

      // Build line data for all rings (outer boundary + holes + disjoint)
      this._ring_data = []
      for (const ring of rings) {
        const data = build_line_from_ring(ring)
        if (data.nline > 0) {
          this._ring_data.push(data)
        }
      }
    } else {
      this._triangle_count = 0
      this._nvertices = 0
      this._ring_data = []
      this._edge_distance = undefined
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

      if (this._dash_tex_info == null) {
        this._dash_tex_info = new Float32Buffer(this.regl_wrapper, 4)
      }
      const dash_tex_info = this._dash_tex_info.get_sized_array(4)

      if (this._dash_scale == null) {
        this._dash_scale = new Float32Buffer(this.regl_wrapper)
      }
      const dash_scale = this._dash_scale.get_sized_array(1)

      this._dash_tex = []
      const arr = resolve_line_dash(line_dash.get(0))
      if (arr.length > 0) {
        const [tex_info, tex, scale] = this.regl_wrapper.get_dash(arr)
        this._dash_tex.push(tex)
        for (let j = 0; j < 4; j++) {
          dash_tex_info[j] = tex_info[j]
        }
        dash_scale[0] = scale
      } else {
        this._dash_tex.push(null)
        dash_tex_info.fill(0)
        dash_scale[0] = 0
      }

      // Patch is always scalar (single glyph).
      this._dash_tex_info.update(true)
      this._dash_scale.update(true)
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
