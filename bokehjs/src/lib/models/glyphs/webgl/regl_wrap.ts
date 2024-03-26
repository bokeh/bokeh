import createRegl from "regl"
import type {Regl, DrawConfig, BoundingBox, Buffer, BufferOptions, Elements} from "regl"
import type {Attributes, MaybeDynamicAttributes, DefaultContext, Framebuffer2D, Texture2D, Texture2DOptions} from "regl"
import type * as t from "./types"
import type {GLMarkerType} from "./types"
import type {DashReturn} from "./dash_cache"
import {DashCache} from "./dash_cache"
import accumulate_vertex_shader from "./accumulate.vert"
import accumulate_fragment_shader from "./accumulate.frag"
import image_vertex_shader from "./image.vert"
import image_fragment_shader from "./image.frag"
import line_vertex_shader from "./regl_line.vert"
import line_fragment_shader from "./regl_line.frag"
import marker_vertex_shader from "./marker.vert"
import marker_fragment_shader from "./marker.frag"

// All access to regl is performed via the get_regl() function that returns a
// ReglWrapper object.  This ensures that regl is correctly initialised before
// it is used, and is only initialised once.

let regl_wrapper: ReglWrapper | null = null

export function get_regl(gl: WebGLRenderingContext): ReglWrapper {
  if (regl_wrapper == null) {
    regl_wrapper = new ReglWrapper(gl)
  }
  return regl_wrapper
}

type ReglRenderFunction<T = {}> = (props: T) => void

export class ReglWrapper {
  private _regl: Regl
  private _regl_available: boolean
  private _dash_cache?: DashCache

  // Drawing functions.
  private _accumulate?: ReglRenderFunction
  private _image?: ReglRenderFunction
  private _solid_line?: ReglRenderFunction
  private _dashed_line?: ReglRenderFunction
  private _marker_no_hatch_map: Map<GLMarkerType, ReglRenderFunction<t.MarkerGlyphProps>> = new Map()
  private _marker_hatch_map: Map<GLMarkerType, ReglRenderFunction<t.MarkerHatchGlyphProps>> = new Map()

  // Static Buffers/Elements
  private _line_geometry: Buffer
  private _line_triangles: Elements
  private _rect_geometry: Buffer
  private _rect_triangles: Elements

  // WebGL state variables.
  private _scissor: BoundingBox
  private _viewport: BoundingBox

  // WebGL framebuffer used to accumulate glyph rendering before single blit to Canvas.
  private _framebuffer?: Framebuffer2D
  private _framebuffer_texture?: Texture2D

  constructor(gl: WebGLRenderingContext) {
    try {
      this._regl = createRegl({
        gl,
        extensions: [
          "ANGLE_instanced_arrays",
          "EXT_blend_minmax",
        ],
      })
      this._regl_available = true

      // Initialise static Buffers/Elements.
      this._line_geometry = this._regl.buffer({
        usage: "static",
        type: "float",
        data: [[-2, 0], [-1, -1], [1, -1], [1,  1], [-1, 1]],
      })

      this._line_triangles = this._regl.elements({
        usage: "static",
        primitive: "triangle fan",
        data: [0, 1, 2, 3, 4],
      })

      this._rect_geometry = this._regl.buffer({
        usage: "static",
        type: "float",
        data: [[-1, -1], [1, -1], [1,  1], [-1, 1]],
      })

      this._rect_triangles = this._regl.elements({
        usage: "static",
        primitive: "triangle fan",
        data: [0, 1, 2, 3],
      })
    } catch (err) {
      this._regl_available = false
    }
  }

  // Create and return ReGL Buffer.
  buffer(options: BufferOptions): Buffer {
    return this._regl.buffer(options)
  }

  clear(width: number, height: number): void {
    this._viewport = {x: 0, y: 0, width, height}
    this._regl.clear({color: [0, 0, 0, 0]})
  }

  clear_framebuffer(framebuffer: Framebuffer2D): void {
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
      this._framebuffer_texture = _regl.texture(size)
    } else {
      // Resize texture, no-op if no change.
      this._framebuffer_texture(size)
    }

    if (this._framebuffer == null) {
      this._framebuffer = _regl.framebuffer({
        // Auto-sizes to size of texture.
        color: this._framebuffer_texture,
        depth: false,
        stencil: false,
      })
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

  texture(options: Texture2DOptions): Texture2D {
    return this._regl.texture(options)
  }

  get viewport(): BoundingBox {
    return this._viewport
  }

  public accumulate(): ReglRenderFunction {
    if (this._accumulate == null) {
      this._accumulate = regl_accumulate(this._regl, this._rect_geometry, this._rect_triangles)
    }
    return this._accumulate
  }

  public dashed_line(): ReglRenderFunction {
    if (this._dashed_line == null) {
      this._dashed_line = regl_dashed_line(this._regl, this._line_geometry, this._line_triangles)
    }
    return this._dashed_line
  }

  public get_dash(line_dash: number[]): DashReturn {
    if (this._dash_cache == null) {
      this._dash_cache = new DashCache(this._regl)
    }
    return this._dash_cache.get(line_dash)
  }

  public image(): ReglRenderFunction {
    if (this._image == null) {
      this._image = regl_image(this._regl, this._rect_geometry, this._rect_triangles)
    }
    return this._image
  }

  public marker_no_hatch(marker_type: GLMarkerType): ReglRenderFunction<t.MarkerGlyphProps> {
    let func = this._marker_no_hatch_map.get(marker_type)
    if (func == null) {
      func = regl_marker(this._regl, marker_type)
      this._marker_no_hatch_map.set(marker_type, func)
    }
    return func
  }

  public marker_hatch(marker_type: GLMarkerType): ReglRenderFunction<t.MarkerHatchGlyphProps> {
    let func = this._marker_hatch_map.get(marker_type)
    if (func == null) {
      func = regl_marker_hatch(this._regl, marker_type)
      this._marker_hatch_map.set(marker_type, func)
    }
    return func
  }

  public solid_line(): ReglRenderFunction {
    if (this._solid_line == null) {
      this._solid_line = regl_solid_line(this._regl, this._line_geometry, this._line_triangles)
    }
    return this._solid_line
  }
}

function regl_accumulate(regl: Regl, geometry: Buffer, triangles: Elements): ReglRenderFunction {
  type Props = t.AccumulateProps
  type Uniforms = t.AccumulateUniforms
  type Attributes = t.AccumulateAttributes

  const config: DrawConfig<Uniforms, Attributes, Props> = {
    vert: accumulate_vertex_shader,
    frag: accumulate_fragment_shader,

    attributes: {
      a_position: {
        buffer: geometry,
        divisor: 0,
      },
    },

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

  return regl<Uniforms, Attributes, Props>(config)
}

// Regl rendering functions are here as some will be reused, e.g. lines may also
// be used around polygons or for bezier curves.

function regl_image(regl: Regl, geometry: Buffer, triangles: Elements): ReglRenderFunction {
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

  return regl<Uniforms, Attributes, Props>(config)
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
function regl_solid_line(regl: Regl, line_geometry: Buffer, line_triangles: Elements): ReglRenderFunction {
  type Props = t.LineGlyphProps
  type Uniforms = t.LineGlyphUniforms
  type Attributes = t.LineGlyphAttributes

  const config: DrawConfig<Uniforms, Attributes, Props> = {
    vert: line_vertex_shader,
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

  return regl<Uniforms, Attributes, Props>(config)
}

function regl_dashed_line(regl: Regl, line_geometry: Buffer, line_triangles: Elements): ReglRenderFunction {
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

  return regl<Uniforms, Attributes, Props>(config)
}

function regl_marker<A extends Attributes, P extends object>(
    regl: Regl,
    marker_type: GLMarkerType,
    vert_defs: string[] = [],
    frag_defs: string[] = [],
    attributes?: MaybeDynamicAttributes<A, DefaultContext, P>,
): ReglRenderFunction {

  type Props = t.MarkerGlyphProps
  type Uniforms = t.MarkerGlyphUniforms
  type Attributes = t.MarkerGlyphAttributes

  const vert_prefix = vert_defs.map((def) => `#define ${def}`).join("\n")
  const frag_prefix = frag_defs.map((def) => `#define ${def}`).join("\n")

  const config: DrawConfig<Uniforms, Attributes, Props> = {
    vert: `\
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
        buffer: regl.buffer([[-0.5, -0.5], [-0.5, 0.5], [0.5, 0.5], [0.5, -0.5]]),
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
    },

    uniforms: {
      u_canvas_size: regl.prop<Props, "canvas_size">("canvas_size"),
      u_antialias: regl.prop<Props, "antialias">("antialias"),
      u_size_hint: regl.prop<Props, "size_hint">("size_hint"),
      u_border_radius: regl.prop<Props, "border_radius">("border_radius"),
    },

    count: 4,
    primitive: "triangle fan",
    instances: regl.prop<Props, "nmarkers">("nmarkers"),

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

  return regl<Uniforms, Attributes, Props>(config)
}

function regl_marker_hatch(regl: Regl, marker_type: GLMarkerType): ReglRenderFunction {

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

  return regl_marker(regl, marker_type, ["HATCH"], ["HATCH"], hatch_attributes)
}
