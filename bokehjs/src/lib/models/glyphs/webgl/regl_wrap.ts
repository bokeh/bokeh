import createRegl from "regl"
import type {Regl, DrawConfig, BoundingBox, Buffer, BufferOptions, Elements, ElementsOptions} from "regl"
import type {AttributeConfig, Attributes, MaybeDynamicAttributes, DefaultContext, Framebuffer2D, Texture2D, Texture2DOptions, VertexArrayObject} from "regl"
import type * as t from "./types"
import type {GLMarkerType} from "./types"
import type {DashReturn} from "./dash_cache"
import {DashCache} from "./dash_cache"
import accumulate_vertex_source from "./accumulate.vert"
import accumulate_fragment_source from "./accumulate.frag"
import image_vertex_source from "./image.vert"
import image_fragment_source from "./image.frag"
import text_vertex_source from "./text.vert"
import text_fragment_source from "./text.frag"
import line_vertex_source from "./regl_line.vert"
import line_fragment_source from "./regl_line.frag"
import marker_vertex_source from "./marker.vert"
import marker_fragment_source from "./marker.frag"
import polygon_vertex_source from "./polygon.vert"
import polygon_fragment_source from "./polygon.frag"
import type {BatchDraw} from "./command_batcher"
import {ReglCommandBatcher} from "./command_batcher"
import {GPUResourceOwner} from "./resource_owner"
import {assemble_shader} from "./shader_modules"
import {UniformBuffer} from "./uniform_buffer"
import {install_webgl2_regl_extensions} from "./webgl2_extensions"

const accumulate_vertex_shader = assemble_shader(accumulate_vertex_source)
const accumulate_fragment_shader = assemble_shader(accumulate_fragment_source)
const image_vertex_shader = assemble_shader(image_vertex_source)
const image_fragment_shader = assemble_shader(image_fragment_source)
const text_vertex_shader = assemble_shader(text_vertex_source)
const text_fragment_shader = assemble_shader(text_fragment_source)
const line_vertex_shader = assemble_shader(line_vertex_source)
const line_fragment_shader = assemble_shader(line_fragment_source)
const marker_vertex_shader = assemble_shader(marker_vertex_source)
const marker_fragment_shader = assemble_shader(marker_fragment_source)
const polygon_vertex_shader = assemble_shader(polygon_vertex_source)
const polygon_fragment_shader = assemble_shader(polygon_fragment_source)

// All access to regl is performed via the get_regl() function that returns a
// ReglWrapper object.  This ensures that regl is correctly initialised before
// it is used, and is only initialised once.

let regl_wrapper: ReglWrapper | null = null

export type BokehWebGLRenderingContext = WebGLRenderingContext | WebGL2RenderingContext

export function get_regl(gl: BokehWebGLRenderingContext): ReglWrapper {
  if (regl_wrapper == null) {
    regl_wrapper = new ReglWrapper(gl)
  }
  return regl_wrapper
}

type RawReglRenderFunction<T = object> = BatchDraw<T>
type ReglRenderFunction<T = object> = (props: T) => void

export class ReglWrapper {
  private _regl: Regl
  private _regl_available: boolean
  private _dash_cache?: DashCache
  private readonly _batcher = new ReglCommandBatcher()
  private readonly _resources = new GPUResourceOwner()
  private readonly _gl2: WebGL2RenderingContext | null

  // Drawing functions.
  private _accumulate?: ReglRenderFunction<t.AccumulateProps>
  private _image?: ReglRenderFunction<t.ImageProps>
  private _text?: ReglRenderFunction<t.TextProps>
  private readonly _solid_line_map = new Map<boolean, ReglRenderFunction<t.LineGlyphProps>>()
  private _dashed_line?: ReglRenderFunction<t.LineDashGlyphProps>
  private _polygon?: ReglRenderFunction<t.PolygonGlyphProps>
  private _polygon_hatch?: ReglRenderFunction<t.PolygonHatchGlyphProps>
  private _marker_no_hatch_map: Map<string, ReglRenderFunction<t.MarkerGlyphProps>> = new Map()
  private _marker_hatch_map: Map<string, ReglRenderFunction<t.MarkerHatchGlyphProps>> = new Map()

  // Static Buffers/Elements
  private _line_geometry: Buffer
  private _line_triangles: Elements
  private _rect_geometry: Buffer
  private _rect_triangles: Elements
  private _marker_geometry: Buffer
  private _rect_vao?: VertexArrayObject

  // WebGL state variables.
  private _scissor: BoundingBox
  private _viewport: BoundingBox

  // WebGL framebuffer used to accumulate glyph rendering before single blit to Canvas.
  private _framebuffer?: Framebuffer2D
  private _framebuffer_texture?: Texture2D

  constructor(gl: BokehWebGLRenderingContext) {
    this._gl2 = typeof WebGL2RenderingContext != "undefined" && gl instanceof WebGL2RenderingContext ? gl : null
    try {
      if (this._gl2 != null) {
        install_webgl2_regl_extensions(this._gl2)
      }
      this._regl = createRegl({
        gl,
        extensions: [
          "ANGLE_instanced_arrays", "EXT_blend_minmax", "OES_element_index_uint",
        ],
        optionalExtensions: ["OES_vertex_array_object"],
      })
      this._regl_available = true

      // Initialise static Buffers/Elements.
      this._line_geometry = this._resources.own(this._regl.buffer({
        usage: "static",
        type: "float",
        data: [[-2, 0], [-1, -1], [1, -1], [1,  1], [-1, 1]],
      }))

      this._line_triangles = this._resources.own(this._regl.elements({
        usage: "static",
        primitive: "triangle fan",
        data: [0, 1, 2, 3, 4],
      }))

      this._rect_geometry = this._resources.own(this._regl.buffer({
        usage: "static",
        type: "float",
        data: [[-1, -1], [1, -1], [1,  1], [-1, 1]],
      }))

      this._rect_triangles = this._resources.own(this._regl.elements({
        usage: "static",
        primitive: "triangle fan",
        data: [0, 1, 2, 3],
      }))

      this._marker_geometry = this._resources.own(this._regl.buffer({
        usage: "static",
        type: "float",
        data: [[-0.5, -0.5], [-0.5, 0.5], [0.5, 0.5], [0.5, -0.5]],
      }))

      if (this._gl2 != null || this._regl.hasExtension("oes_vertex_array_object")) {
        this._rect_vao = this._resources.own(this._regl.vao([{buffer: this._rect_geometry, size: 2}]))
      }
    } catch {
      this._resources.destroy()
      this._regl_available = false
    }
  }

  get is_webgl2(): boolean {
    return this._gl2 != null
  }

  get supports_vertex_arrays(): boolean {
    return this._rect_vao != null
  }

  uniform_buffer(byte_length: number, binding: number): UniformBuffer | null {
    return this._gl2 != null ? this._resources.own(new UniformBuffer(this._gl2, byte_length, binding)) : null
  }

  private _batch<Props extends object>(label: string, draw: RawReglRenderFunction<Props>): ReglRenderFunction<Props> {
    const key = Symbol()
    return (props) => {
      const resources = Object.values(props).filter((value): value is object =>
        value != null && (typeof value == "object" || typeof value == "function"),
      )
      this._batcher.submit(key, draw, props, label, resources)
    }
  }

  flush(): void {
    this._batcher.flush()
  }

  /** Complete queued GPU work before another canvas reads the WebGL canvas.
   * In particular, WebKit can otherwise copy an incomplete frame when a
   * WebGL canvas is used as the source of Canvas2D.drawImage(). */
  finish(): void {
    this.flush()
    this._regl._gl.finish()
  }

  /** Flush only when a pending command references a resource about to be
   * mutated. Mutating an unrelated renderer's resource is safe and keeps
   * adjacent compatible commands batchable. */
  flush_resource(resource: object): void {
    if (this._batcher.references(resource)) {
      this._batcher.flush()
    }
  }

  get batch_stats(): {submitted: number, draw_calls: number} {
    return this._batcher.stats
  }

  get diagnostics(): {
    webgl2: boolean
    vertex_arrays: boolean
    resources: number
    pending: {commands: number, label?: string}
    batch: {submitted: number, draw_calls: number}
  } {
    return {
      webgl2: this.is_webgl2,
      vertex_arrays: this.supports_vertex_arrays,
      resources: this._resources.size,
      pending: this._batcher.pending,
      batch: this._batcher.stats,
    }
  }

  reset_batch_stats(): void {
    this._batcher.reset_stats()
  }

  // Create and return ReGL Buffer.
  buffer(options: BufferOptions): Buffer {
    return this._regl.buffer(options)
  }

  // Create and return ReGL Elements.
  elements(options: ElementsOptions): Elements {
    return this._regl.elements(options)
  }

  clear(width: number, height: number): void {
    this.flush()
    this._viewport = {x: 0, y: 0, width, height}
    this._regl.clear({color: [0, 0, 0, 0]})
  }

  clear_framebuffer(framebuffer: Framebuffer2D): void {
    this.flush()
    this._regl.clear({color: [0, 0, 0, 0], framebuffer})
  }

  get framebuffer_and_texture(): [Framebuffer2D, Texture2D] {
    const {_regl} = this
    const {_gl} = _regl
    const size = {
      height: _gl.drawingBufferHeight,
      width: _gl.drawingBufferWidth,
    }

    if (this._framebuffer_texture == null) {
      this._framebuffer_texture = this._resources.own(_regl.texture(size))
    } else {
      // Resize texture, no-op if no change.
      this._framebuffer_texture(size)
    }

    if (this._framebuffer == null) {
      this._framebuffer = this._resources.own(_regl.framebuffer({
        // Auto-sizes to size of texture.
        color: this._framebuffer_texture,
        depth: false,
        stencil: false,
      }))
    }

    return [this._framebuffer, this._framebuffer_texture]
  }

  get has_webgl(): boolean {
    return this._regl_available
  }

  get scissor(): BoundingBox {
    return this._scissor
  }

  set_scissor(x: number, y: number, width: number, height: number): void {
    this._scissor = {x, y, width, height}
  }

  /** Return a device-pixel scissor tightly enclosing screen-space points,
   * intersected with the plot frame. Screen y coordinates increase downward,
   * whereas WebGL scissor coordinates increase upward. */
  scissor_for_points(points: ArrayLike<number>, padding: number, pixel_ratio: number): BoundingBox {
    let x0 = Infinity
    let y0 = Infinity
    let x1 = -Infinity
    let y1 = -Infinity
    for (let i = 0; i + 1 < points.length; i += 2) {
      const x = points[i]
      const y = points[i + 1]
      if (isFinite(x + y)) {
        x0 = Math.min(x0, x)
        y0 = Math.min(y0, y)
        x1 = Math.max(x1, x)
        y1 = Math.max(y1, y)
      }
    }
    if (!isFinite(x0 + y0 + x1 + y1)) {
      return {...this._scissor, width: 0, height: 0}
    }

    const left = Math.floor((x0 - padding)*pixel_ratio)
    const right = Math.ceil((x1 + padding)*pixel_ratio)
    const viewport_height = this._viewport.height ?? 0
    const {x: clip_x = 0, y: clip_y = 0, width: clip_width = 0, height: clip_height = 0} = this._scissor
    const bottom = Math.floor(viewport_height - (y1 + padding)*pixel_ratio)
    const top = Math.ceil(viewport_height - (y0 - padding)*pixel_ratio)
    const sx0 = Math.max(clip_x, left)
    const sy0 = Math.max(clip_y, bottom)
    const sx1 = Math.min(clip_x + clip_width, right)
    const sy1 = Math.min(clip_y + clip_height, top)
    return {x: sx0, y: sy0, width: Math.max(0, sx1 - sx0), height: Math.max(0, sy1 - sy0)}
  }

  texture(options: Texture2DOptions): Texture2D {
    return this._regl.texture(options)
  }

  get max_texture_size(): number {
    return this._regl.limits.maxTextureSize
  }

  get viewport(): BoundingBox {
    return this._viewport
  }

  public accumulate(): ReglRenderFunction<t.AccumulateProps> {
    if (this._accumulate == null) {
      const draw = regl_accumulate(this._regl, this._rect_geometry, this._rect_triangles, this._rect_vao)
      // Accumulation is a framebuffer transition, not a reorderable glyph
      // draw. Flush preceding geometry and execute it immediately.
      this._accumulate = (props) => {
        this.flush()
        draw(props)
      }
    }
    return this._accumulate
  }

  public dashed_line(): ReglRenderFunction<t.LineDashGlyphProps> {
    if (this._dashed_line == null) {
      this._dashed_line = this._batch("dashed-line", regl_dashed_line(this._regl, this._line_geometry, this._line_triangles))
    }
    return this._dashed_line
  }

  public get_dash(line_dash: number[]): DashReturn {
    if (this._dash_cache == null) {
      this._dash_cache = this._resources.own(new DashCache(this._regl))
    }
    return this._dash_cache.get(line_dash)
  }

  public image(): ReglRenderFunction<t.ImageProps> {
    if (this._image == null) {
      this._image = this._batch("image", regl_image(this._regl, this._rect_geometry, this._rect_triangles))
    }
    return this._image
  }

  public text(): ReglRenderFunction<t.TextProps> {
    if (this._text == null) {
      this._text = this._batch("text", regl_text(this._regl, this._rect_geometry))
    }
    return this._text
  }

  public polygon(): ReglRenderFunction<t.PolygonGlyphProps> {
    if (this._polygon == null) {
      this._polygon = this._batch("polygon", regl_polygon(this._regl))
    }
    return this._polygon
  }

  public polygon_hatch(): ReglRenderFunction<t.PolygonHatchGlyphProps> {
    if (this._polygon_hatch == null) {
      this._polygon_hatch = this._batch("hatched-polygon", regl_polygon_hatch(this._regl))
    }
    return this._polygon_hatch
  }

  public marker_no_hatch(marker_type: GLMarkerType, data_mapped: boolean = false): ReglRenderFunction<t.MarkerGlyphProps> {
    const key = `${marker_type}:${data_mapped}`
    let func = this._marker_no_hatch_map.get(key)
    if (func == null) {
      func = this._batch(`marker:${key}`, regl_marker(this._regl, this._marker_geometry, marker_type, data_mapped))
      this._marker_no_hatch_map.set(key, func)
    }
    return func
  }

  public marker_hatch(marker_type: GLMarkerType, data_mapped: boolean = false): ReglRenderFunction<t.MarkerHatchGlyphProps> {
    const key = `${marker_type}:${data_mapped}`
    let func = this._marker_hatch_map.get(key)
    if (func == null) {
      func = this._batch(`hatched-marker:${key}`, regl_marker_hatch(this._regl, this._marker_geometry, marker_type, data_mapped))
      this._marker_hatch_map.set(key, func)
    }
    return func
  }

  public solid_line(data_mapped: boolean = false): ReglRenderFunction<t.LineGlyphProps> {
    let func = this._solid_line_map.get(data_mapped)
    if (func == null) {
      func = this._batch(`solid-line:${data_mapped}`, regl_solid_line(
        this._regl, this._line_geometry, this._line_triangles, data_mapped,
      ))
      this._solid_line_map.set(data_mapped, func)
    }
    return func
  }

  destroy(): void {
    this.flush()
    this._resources.destroy()
    this._regl.destroy()
  }
}

function regl_accumulate(
  regl: Regl, geometry: Buffer, triangles: Elements, vao?: VertexArrayObject,
): RawReglRenderFunction<t.AccumulateProps> {
  type Props = t.AccumulateProps
  type Uniforms = t.AccumulateUniforms
  type Attributes = t.AccumulateAttributes

  const vertex_state = vao != null ? {
    vao,
    attributes: {a_position: 0 as unknown as AttributeConfig},
  } : {
    attributes: {
      a_position: {
        buffer: geometry,
        divisor: 0,
      },
    },
  }
  const config: DrawConfig<Uniforms, Attributes, Props> = {
    vert: accumulate_vertex_shader,
    frag: accumulate_fragment_shader,
    ...vertex_state,

    uniforms: {
      u_framebuffer_tex: regl.prop<Props, "framebuffer_tex">("framebuffer_tex"),
    },

    elements: triangles,

    blend: {
      enable: true,
      func: {
        srcRGB:   "one",
        srcAlpha: "one",
        dstRGB:   "one minus src alpha",
        dstAlpha: "one minus src alpha",
      },
    },
    depth: {enable: false},
    scissor: {
      enable: true,
      box: regl.prop<Props, "scissor">("scissor"),
    },
    viewport: regl.prop<Props, "viewport">("viewport"),
  }

  return regl<Uniforms, Attributes, Props>(config) as RawReglRenderFunction<Props>
}

// Regl rendering functions are here as some will be reused, e.g. lines may also
// be used around polygons or for bezier curves.

function regl_image(regl: Regl, geometry: Buffer, triangles: Elements): RawReglRenderFunction<t.ImageProps> {
  type Props = t.ImageProps
  type Uniforms = t.ImageUniforms
  type Attributes = t.ImageAttributes

  const config: DrawConfig<Uniforms, Attributes, Props> = {
    vert: image_vertex_shader,
    frag: image_fragment_shader,

    attributes: {
      a_position: {
        buffer: geometry,
        divisor: 0,
      },
      a_bounds(_, props) {
        return props.bounds.to_attribute_config()
      },
    },

    uniforms: {
      u_canvas_size: regl.prop<Props, "canvas_size">("canvas_size"),
      u_tex: regl.prop<Props, "tex">("tex"),
      u_global_alpha: regl.prop<Props, "global_alpha">("global_alpha"),
      u_angle: regl.prop<Props, "angle">("angle"),
    },

    elements: triangles,

    blend: {
      enable: true,
      func: {
        srcRGB:   "one",
        srcAlpha: "one",
        dstRGB:   "one minus src alpha",
        dstAlpha: "one minus src alpha",
      },
    },
    depth: {enable: false},
    scissor: {
      enable: true,
      box: regl.prop<Props, "scissor">("scissor"),
    },
    viewport: regl.prop<Props, "viewport">("viewport"),
  }

  return regl<Uniforms, Attributes, Props>(config) as RawReglRenderFunction<Props>
}

function regl_text(regl: Regl, geometry: Buffer): RawReglRenderFunction<t.TextProps> {
  type Props = t.TextProps
  type Uniforms = t.TextUniforms
  type Attributes = t.TextAttributes

  const config: DrawConfig<Uniforms, Attributes, Props> = {
    vert: text_vertex_shader,
    frag: text_fragment_shader,

    attributes: {
      a_position: {
        buffer: geometry,
        divisor: 0,
      },
      a_bounds(_, props) {
        return props.bounds.to_attribute_config(0, props.ntexts)
      },
      a_uv(_, props) {
        return props.uv.to_attribute_config(0, props.ntexts)
      },
      a_origin(_, props) {
        return props.origin.to_attribute_config(0, props.ntexts)
      },
      a_angle(_, props) {
        return props.angle.to_attribute_config(0, props.ntexts)
      },
      a_show(_, props) {
        return props.show.to_attribute_config(0, props.ntexts)
      },
    },

    uniforms: {
      u_canvas_size: regl.prop<Props, "canvas_size">("canvas_size"),
      u_tex: regl.prop<Props, "tex">("tex"),
    },

    count: 4,
    primitive: "triangle fan",
    instances: regl.prop<Props, "ntexts">("ntexts"),

    blend: {
      enable: true,
      func: {
        srcRGB:   "one",
        srcAlpha: "one",
        dstRGB:   "one minus src alpha",
        dstAlpha: "one minus src alpha",
      },
    },
    depth: {enable: false},
    scissor: {
      enable: true,
      box: regl.prop<Props, "scissor">("scissor"),
    },
    viewport: regl.prop<Props, "viewport">("viewport"),
  }

  return regl<Uniforms, Attributes, Props>(config) as RawReglRenderFunction<Props>
}

// Mesh for line rendering (solid and dashed).
//
//   1       4-----3
//          /      |
//         /       |
// y 0    0        |
//         \       |
//          \      |
//  -1       1-----2
//
//       -2  -1    1
//              x
function regl_solid_line(
  regl: Regl, line_geometry: Buffer, line_triangles: Elements, data_mapped: boolean,
): RawReglRenderFunction<t.LineGlyphProps> {
  type Props = t.LineGlyphProps
  type Uniforms = t.LineGlyphUniforms
  type Attributes = t.LineGlyphAttributes

  const config: DrawConfig<Uniforms, Attributes, Props> = {
    vert: `${data_mapped ? "#define DATA_MAPPING\n" : ""}${line_vertex_shader}`,
    frag: line_fragment_shader,

    attributes: {
      a_position: {
        buffer: line_geometry,
        divisor: 0,
      },
      a_point_prev(_, props) {
        return props.points.to_attribute_config(props.point_offset)
      },
      a_point_start(_, props) {
        return props.points.to_attribute_config(props.point_offset + 2)
      },
      a_point_end(_, props) {
        return props.points.to_attribute_config(props.point_offset + 4)
      },
      a_point_next(_, props) {
        return props.points.to_attribute_config(props.point_offset + 6)
      },
      a_show_prev(_, props) {
        return props.show.to_attribute_config(props.point_offset/2 - props.line_offset)
      },
      a_show_curr(_, props) {
        return props.show.to_attribute_config(props.point_offset/2 - props.line_offset + 1)
      },
      a_show_next(_, props) {
        return props.show.to_attribute_config(props.point_offset/2 - props.line_offset + 2)
      },
      a_linewidth(_, props) {
        return props.linewidth.to_attribute_config_nested(props.line_offset, props.nsegments + 3)
      },
      a_line_color(_, props) {
        return props.line_color.to_attribute_config_nested(props.line_offset, props.nsegments + 3)
      },
      a_line_cap(_, props) {
        return props.line_cap.to_attribute_config_nested(props.line_offset, props.nsegments + 3)
      },
      a_line_join(_, props) {
        return props.line_join.to_attribute_config_nested(props.line_offset, props.nsegments + 3)
      },
    },

    uniforms: {
      u_canvas_size: regl.prop<Props, "canvas_size">("canvas_size"),
      u_antialias: regl.prop<Props, "antialias">("antialias"),
      u_miter_limit: regl.prop<Props, "miter_limit">("miter_limit"),
      ...(data_mapped ? {
        u_data_offset: (_ctx, props) => props.data_mapping!.offset,
        u_data_factor: (_ctx, props) => props.data_mapping!.factor,
        u_data_target: (_ctx, props) => props.data_mapping!.target,
      } : {}),
    },

    elements: line_triangles,
    instances: regl.prop<Props, "nsegments">("nsegments"),

    blend: {
      enable: true,
      equation: "max",
      func: {
        srcRGB: 1,
        srcAlpha: 1,
        dstRGB: 1,
        dstAlpha: 1,
      },
    },
    depth: {enable: false},
    framebuffer: regl.prop<Props, "framebuffer">("framebuffer"),
    scissor: {
      enable: true,
      box: regl.prop<Props, "scissor">("scissor"),
    },
    viewport: regl.prop<Props, "viewport">("viewport"),
  }

  return regl<Uniforms, Attributes, Props>(config) as RawReglRenderFunction<Props>
}

function regl_dashed_line(regl: Regl, line_geometry: Buffer, line_triangles: Elements): RawReglRenderFunction<t.LineDashGlyphProps> {
  type Props = t.LineDashGlyphProps
  type Uniforms = t.LineDashGlyphUniforms
  type Attributes = t.LineDashGlyphAttributes

  const config: DrawConfig<Uniforms, Attributes, Props> = {
    vert: `\
#define DASHED
${line_vertex_shader}
`,
    frag: `\
#define DASHED
${line_fragment_shader}
`,

    attributes: {
      a_position: {
        buffer: line_geometry,
        divisor: 0,
      },
      a_point_prev(_, props) {
        return props.points.to_attribute_config(props.point_offset)
      },
      a_point_start(_, props) {
        return props.points.to_attribute_config(props.point_offset + 2)
      },
      a_point_end(_, props) {
        return props.points.to_attribute_config(props.point_offset + 4)
      },
      a_point_next(_, props) {
        return props.points.to_attribute_config(props.point_offset + 6)
      },
      a_show_prev(_, props) {
        return props.show.to_attribute_config(props.point_offset/2 - props.line_offset)
      },
      a_show_curr(_, props) {
        return props.show.to_attribute_config(props.point_offset/2 - props.line_offset + 1)
      },
      a_show_next(_, props) {
        return props.show.to_attribute_config(props.point_offset/2 - props.line_offset + 2)
      },
      a_linewidth(_, props) {
        return props.linewidth.to_attribute_config_nested(props.line_offset, props.nsegments + 3)
      },
      a_line_color(_, props) {
        return props.line_color.to_attribute_config_nested(props.line_offset, props.nsegments + 3)
      },
      a_line_cap(_, props) {
        return props.line_cap.to_attribute_config_nested(props.line_offset, props.nsegments + 3)
      },
      a_line_join(_, props) {
        return props.line_join.to_attribute_config_nested(props.line_offset, props.nsegments + 3)
      },
      a_length_so_far(_, props) {
        return props.length_so_far.to_attribute_config(props.point_offset/2 - 3*props.line_offset)
      },
      a_dash_tex_info(_, props) {
        return props.dash_tex_info.to_attribute_config_nested(props.line_offset, props.nsegments + 3)
      },
      a_dash_scale(_, props) {
        return props.dash_scale.to_attribute_config_nested(props.line_offset, props.nsegments + 3)
      },
      a_dash_offset(_, props) {
        return props.dash_offset.to_attribute_config_nested(props.line_offset, props.nsegments + 3)
      },
    },

    uniforms: {
      u_canvas_size: regl.prop<Props, "canvas_size">("canvas_size"),
      u_antialias: regl.prop<Props, "antialias">("antialias"),
      u_miter_limit: regl.prop<Props, "miter_limit">("miter_limit"),
      u_dash_tex: regl.prop<Props, "dash_tex">("dash_tex"),
    },

    elements: line_triangles,
    instances: regl.prop<Props, "nsegments">("nsegments"),

    blend: {
      enable: true,
      equation: "max",
      func: {
        srcRGB: 1,
        srcAlpha: 1,
        dstRGB: 1,
        dstAlpha: 1,
      },
    },
    depth: {enable: false},
    framebuffer: regl.prop<Props, "framebuffer">("framebuffer"),
    scissor: {
      enable: true,
      box: regl.prop<Props, "scissor">("scissor"),
    },
    viewport: regl.prop<Props, "viewport">("viewport"),
  }

  return regl<Uniforms, Attributes, Props>(config) as RawReglRenderFunction<Props>
}

function regl_polygon(regl: Regl): RawReglRenderFunction<t.PolygonGlyphProps> {
  type Props = t.PolygonGlyphProps
  type Uniforms = t.PolygonGlyphUniforms
  type Attributes = t.PolygonGlyphAttributes

  const config: DrawConfig<Uniforms, Attributes, Props> = {
    vert: polygon_vertex_shader,
    frag: polygon_fragment_shader,

    attributes: {
      a_position(_, props) {
        return props.positions.to_per_vertex_config()
      },
      a_fill_color(_, props) {
        return props.fill_color.to_per_vertex_config()
      },
      a_edge_distance(_, props) {
        return props.edge_distance.to_per_vertex_config()
      },
    },

    uniforms: {
      u_canvas_size: regl.prop<Props, "canvas_size">("canvas_size"),
      u_antialias: regl.prop<Props, "antialias">("antialias"),
    },

    elements: regl.prop<Props, "elements">("elements"),
    count: regl.prop<Props, "count">("count"),
    offset: regl.prop<Props, "offset">("offset"),

    blend: {
      enable: true,
      func: {
        srcRGB:   "one",
        srcAlpha: "one",
        dstRGB:   "one minus src alpha",
        dstAlpha: "one minus src alpha",
      },
    },
    depth: {enable: false},
    scissor: {
      enable: true,
      box: regl.prop<Props, "scissor">("scissor"),
    },
    viewport: regl.prop<Props, "viewport">("viewport"),
  }

  return regl<Uniforms, Attributes, Props>(config) as RawReglRenderFunction<Props>
}

function regl_polygon_hatch(regl: Regl): RawReglRenderFunction<t.PolygonHatchGlyphProps> {
  type Props = t.PolygonHatchGlyphProps
  type Uniforms = t.PolygonHatchGlyphUniforms
  type Attributes = t.PolygonHatchGlyphAttributes

  const config: DrawConfig<Uniforms, Attributes, Props> = {
    vert: `\
#define HATCH
${polygon_vertex_shader}
`,
    frag: `\
#define HATCH
${polygon_fragment_shader}
`,

    attributes: {
      a_position(_, props) {
        return props.positions.to_per_vertex_config()
      },
      a_fill_color(_, props) {
        return props.fill_color.to_per_vertex_config()
      },
      a_edge_distance(_, props) {
        return props.edge_distance.to_per_vertex_config()
      },
      a_hatch_pattern(_, props) {
        return props.hatch_pattern.to_per_vertex_config()
      },
      a_hatch_scale(_, props) {
        return props.hatch_scale.to_per_vertex_config()
      },
      a_hatch_weight(_, props) {
        return props.hatch_weight.to_per_vertex_config()
      },
      a_hatch_color(_, props) {
        return props.hatch_color.to_per_vertex_config()
      },
    },

    uniforms: {
      u_canvas_size: regl.prop<Props, "canvas_size">("canvas_size"),
      u_antialias: regl.prop<Props, "antialias">("antialias"),
    },

    elements: regl.prop<Props, "elements">("elements"),
    count: regl.prop<Props, "count">("count"),
    offset: regl.prop<Props, "offset">("offset"),

    blend: {
      enable: true,
      func: {
        srcRGB:   "one",
        srcAlpha: "one",
        dstRGB:   "one minus src alpha",
        dstAlpha: "one minus src alpha",
      },
    },
    depth: {enable: false},
    scissor: {
      enable: true,
      box: regl.prop<Props, "scissor">("scissor"),
    },
    viewport: regl.prop<Props, "viewport">("viewport"),
  }

  return regl<Uniforms, Attributes, Props>(config) as RawReglRenderFunction<Props>
}

function regl_marker<A extends Attributes, P extends t.MarkerGlyphProps = t.MarkerGlyphProps>(
    regl: Regl,
    geometry: Buffer,
    marker_type: GLMarkerType,
    data_mapped: boolean = false,
    vert_defs: string[] = [],
    frag_defs: string[] = [],
    attributes?: MaybeDynamicAttributes<A, DefaultContext, P>,
): RawReglRenderFunction<P> {

  type Uniforms = t.MarkerGlyphUniforms
  type MarkerAttributes = t.MarkerGlyphAttributes & A

  const vert_prefix = vert_defs.map((def) => `#define ${def}`).join("\n")
  const frag_prefix = frag_defs.map((def) => `#define ${def}`).join("\n")

  const config: DrawConfig<Uniforms, MarkerAttributes, P> = {
    vert: `\
${data_mapped ? "#define DATA_MAPPING" : ""}
${vert_prefix}
#define MULTI_MARKER
#define USE_${marker_type.toUpperCase()}
${marker_vertex_shader}
`,
    frag: `\
${frag_prefix}
#define USE_${marker_type.toUpperCase()}
${marker_fragment_shader}
`,

    attributes: {
      a_position: {
        buffer: geometry,
        divisor: 0,
      },
      a_center(_, props) {
        return props.center.to_attribute_config(0, props.nmarkers)
      },
      a_width(_, props) {
        return props.width.to_attribute_config(0, props.nmarkers)
      },
      a_height(_, props) {
        return props.height.to_attribute_config(0, props.nmarkers)
      },
      a_angle(_, props) {
        return props.angle.to_attribute_config(0, props.nmarkers)
      },
      a_aux(_, props) {
        return props.aux.to_attribute_config(0, props.nmarkers)
      },
      a_linewidth(_, props) {
        return props.linewidth.to_attribute_config(0, props.nmarkers)
      },
      a_line_color(_, props) {
        return props.line_color.to_attribute_config(0, props.nmarkers)
      },
      a_fill_color(_, props) {
        return props.fill_color.to_attribute_config(0, props.nmarkers)
      },
      a_line_cap(_, props) {
        return props.line_cap.to_attribute_config(0, props.nmarkers)
      },
      a_line_join(_, props) {
        return props.line_join.to_attribute_config(0, props.nmarkers)
      },
      a_show(_, props) {
        return props.show.to_attribute_config(0, props.nmarkers)
      },
      ...attributes,
    } as MaybeDynamicAttributes<MarkerAttributes, DefaultContext, P>,

    uniforms: {
      u_canvas_size: regl.prop<P, "canvas_size">("canvas_size"),
      u_antialias: regl.prop<P, "antialias">("antialias"),
      u_size_hint: regl.prop<P, "size_hint">("size_hint"),
      u_border_radius: regl.prop<P, "border_radius">("border_radius"),
      ...(data_mapped ? {
        u_data_offset: (_ctx, props) => props.data_mapping!.offset,
        u_data_factor: (_ctx, props) => props.data_mapping!.factor,
        u_data_target: (_ctx, props) => props.data_mapping!.target,
      } : {}),
    },

    count: 4,
    primitive: "triangle fan",
    instances: regl.prop<P, "nmarkers">("nmarkers"),

    blend: {
      enable: true,
      func: {
        srcRGB:   "one",
        srcAlpha: "one",
        dstRGB:   "one minus src alpha",
        dstAlpha: "one minus src alpha",
      },
    },
    depth: {enable: false},
    scissor: {
      enable: true,
      box: regl.prop<P, "scissor">("scissor"),
    },
    viewport: regl.prop<P, "viewport">("viewport"),
  }

  return regl<Uniforms, MarkerAttributes, P>(config) as RawReglRenderFunction<P>
}

function regl_marker_hatch(
  regl: Regl, geometry: Buffer, marker_type: GLMarkerType, data_mapped: boolean,
): RawReglRenderFunction<t.MarkerHatchGlyphProps> {

  const hatch_attributes: MaybeDynamicAttributes<t.HatchAttributes, DefaultContext, t.MarkerHatchGlyphProps> = {
    a_hatch_pattern(_, props) {
      return props.hatch_pattern.to_attribute_config(0, props.nmarkers)
    },
    a_hatch_scale(_, props) {
      return props.hatch_scale.to_attribute_config(0, props.nmarkers)
    },
    a_hatch_weight(_, props) {
      return props.hatch_weight.to_attribute_config(0, props.nmarkers)
    },
    a_hatch_color(_, props) {
      return props.hatch_color.to_attribute_config(0, props.nmarkers)
    },
  }

  return regl_marker<t.HatchAttributes, t.MarkerHatchGlyphProps>(
    regl, geometry, marker_type, data_mapped, ["HATCH"], ["HATCH"], hatch_attributes,
  )
}
