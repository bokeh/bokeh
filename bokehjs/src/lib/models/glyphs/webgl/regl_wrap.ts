import createRegl from "regl"
import {Regl, DrawConfig, BoundingBox, Buffer, BufferOptions, Elements} from "regl"
import * as t from "./types"
import {DashCache, DashReturn} from "./dash_cache"
import line_vertex_shader from "./regl_line.vert"
import line_fragment_shader from "./regl_line.frag"
import marker_vertex_shader from "./markers.vert"
import marker_fragment_shader from "./markers.frag"
import {MarkerType} from "core/enums"
import rect_vertex_shader from "./rect.vert"
import rect_fragment_shader from "./rect.frag"

// All access to regl is performed via the get_regl() function that returns a
// ReglWrapper object.  This ensures that regl is correctly initialised before
// it is used, and is only initialised once.

let regl_wrapper: ReglWrapper | null = null

export function get_regl(gl: WebGLRenderingContext): ReglWrapper {
  if (regl_wrapper == null)
    regl_wrapper = new ReglWrapper(gl)
  return regl_wrapper
}

type ReglRenderFunction = ({}) => void

export class ReglWrapper {
  private _regl: Regl
  private _regl_available: boolean
  private _dash_cache?: DashCache

  // Drawing functions.
  private _solid_line?: ReglRenderFunction
  private _dashed_line?: ReglRenderFunction
  private _marker_map?: Map<MarkerType, ReglRenderFunction>
  private _rect_no_hatch?: ReglRenderFunction
  private _rect_hatch?: ReglRenderFunction

  // Static Buffers/Elements
  private _line_geometry: Buffer
  private _line_triangles: Elements

  // WebGL state variables.
  private _scissor: BoundingBox
  private _viewport: BoundingBox

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
        data: [[-2, 0], [-1, -1], [1, -1], [2, 0], [1, 1], [-1,  1]],
      })

      this._line_triangles = this._regl.elements({
        usage: "static",
        primitive: "triangles",
        data: [[0, 1, 5], [1, 2, 5], [5, 2, 4], [2, 3, 4]],
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

  get has_webgl(): boolean {
    return this._regl_available
  }

  get scissor(): BoundingBox {
    return this._scissor
  }

  set_scissor(x: number, y: number, width: number, height: number): void {
    this._scissor = {x, y, width, height}
  }

  get viewport(): BoundingBox {
    return this._viewport
  }

  public dashed_line(): ReglRenderFunction {
    if (this._dashed_line == null)
      this._dashed_line = regl_dashed_line(this._regl, this._line_geometry, this._line_triangles)
    return this._dashed_line
  }

  public get_dash(line_dash: number[]): DashReturn {
    if (this._dash_cache == null)
      this._dash_cache = new DashCache(this._regl)
    return this._dash_cache.get(line_dash)
  }

  public marker(marker_type: MarkerType): ReglRenderFunction {
    if (this._marker_map == null)
      this._marker_map = new Map<MarkerType, ReglRenderFunction>()

    let func = this._marker_map.get(marker_type)
    if (func == null) {
      func = regl_marker(this._regl, marker_type)
      this._marker_map.set(marker_type, func)
    }
    return func
  }

  public rect_no_hatch(): ReglRenderFunction {
    if (this._rect_no_hatch == null)
      this._rect_no_hatch = regl_rect_no_hatch(this._regl)
    return this._rect_no_hatch
  }

  public rect_hatch(): ReglRenderFunction {
    if (this._rect_hatch == null)
      this._rect_hatch = regl_rect_hatch(this._regl)
    return this._rect_hatch
  }

  public solid_line(): ReglRenderFunction {
    if (this._solid_line == null)
      this._solid_line = regl_solid_line(this._regl, this._line_geometry, this._line_triangles)
    return this._solid_line
  }
}

// Regl rendering functions are here as some will be reused, e.g. lines may also
// be used around polygons or for bezier curves.

// Mesh for line rendering (solid and dashed).
//
//   1       5-----4
//          /|\    |\
//         / | \   | \
// y 0    0  |  \  |  3
//         \ |   \ | /
//          \|    \|/
//  -1       1-----2
//
//       -2  -1    1  2
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
        return props.points.to_attribute_config()
      },
      a_point_start(_, props) {
        return props.points.to_attribute_config(Float32Array.BYTES_PER_ELEMENT*2)
      },
      a_point_end(_, props) {
        return props.points.to_attribute_config(Float32Array.BYTES_PER_ELEMENT*4)
      },
      a_point_next(_, props) {
        return props.points.to_attribute_config(Float32Array.BYTES_PER_ELEMENT*6)
      },
    },

    uniforms: {
      u_canvas_size: regl.prop<Props, "canvas_size">("canvas_size"),
      u_pixel_ratio: regl.prop<Props, "pixel_ratio">("pixel_ratio"),
      u_antialias: regl.prop<Props, "antialias">("antialias"),
      u_line_color: regl.prop<Props, "line_color">("line_color"),
      u_linewidth: regl.prop<Props, "linewidth">("linewidth"),
      u_miter_limit: regl.prop<Props, "miter_limit">("miter_limit"),
      u_line_join: regl.prop<Props, "line_join">("line_join"),
      u_line_cap: regl.prop<Props, "line_cap">("line_cap"),
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
    vert: `#define DASHED\n\n${line_vertex_shader}`,
    frag: `#define DASHED\n\n${line_fragment_shader}`,

    attributes: {
      a_position: {
        buffer: line_geometry,
        divisor: 0,
      },
      a_point_prev(_, props) {
        return props.points.to_attribute_config()
      },
      a_point_start(_, props) {
        return props.points.to_attribute_config(Float32Array.BYTES_PER_ELEMENT*2)
      },
      a_point_end(_, props) {
        return props.points.to_attribute_config(Float32Array.BYTES_PER_ELEMENT*4)
      },
      a_point_next(_, props) {
        return props.points.to_attribute_config(Float32Array.BYTES_PER_ELEMENT*6)
      },
      a_length_so_far(_, props) {
        return props.length_so_far.to_attribute_config()
      },
    },

    uniforms: {
      u_canvas_size: regl.prop<Props, "canvas_size">("canvas_size"),
      u_pixel_ratio: regl.prop<Props, "pixel_ratio">("pixel_ratio"),
      u_antialias: regl.prop<Props, "antialias">("antialias"),
      u_line_color: regl.prop<Props, "line_color">("line_color"),
      u_linewidth: regl.prop<Props, "linewidth">("linewidth"),
      u_miter_limit: regl.prop<Props, "miter_limit">("miter_limit"),
      u_line_join: regl.prop<Props, "line_join">("line_join"),
      u_line_cap: regl.prop<Props, "line_cap">("line_cap"),
      u_dash_tex: regl.prop<Props, "dash_tex">("dash_tex"),
      u_dash_tex_info: regl.prop<Props, "dash_tex_info">("dash_tex_info"),
      u_dash_scale: regl.prop<Props, "dash_scale">("dash_scale"),
      u_dash_offset: regl.prop<Props, "dash_offset">("dash_offset"),
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
    scissor: {
      enable: true,
      box: regl.prop<Props, "scissor">("scissor"),
    },
    viewport: regl.prop<Props, "viewport">("viewport"),
  }

  return regl<Uniforms, Attributes, Props>(config)
}

function regl_marker(regl: Regl, marker_type: MarkerType): ReglRenderFunction {
  type Props = t.MarkerGlyphProps
  type Uniforms = t.CommonUniforms
  type Attributes = t.MarkerGlyphAttributes

  const config: DrawConfig<Uniforms, Attributes, Props> = {
    vert: marker_vertex_shader,
    frag: `#define USE_${marker_type.toUpperCase()}\n\n${marker_fragment_shader}`,

    attributes: {
      a_position: {
        buffer: regl.buffer([[-0.5, -0.5], [-0.5, 0.5], [0.5, 0.5], [0.5, -0.5]]),
        divisor: 0,
      },
      a_center(_, props) {
        return props.center.to_attribute_config()
      },
      a_size(_, props) {
        return props.size.to_attribute_config()
      },
      a_angle(_, props) {
        return props.angle.to_attribute_config()
      },
      a_linewidth(_, props) {
        return props.linewidth.to_attribute_config()
      },
      a_line_color(_, props) {
        return props.line_color.to_attribute_config()
      },
      a_fill_color(_, props) {
        return props.fill_color.to_attribute_config()
      },
      a_show(_, props) {
        return props.show.to_attribute_config()
      },
    },

    uniforms: {
      u_canvas_size: regl.prop<Props, "canvas_size">("canvas_size"),
      u_pixel_ratio: regl.prop<Props, "pixel_ratio">("pixel_ratio"),
      u_antialias: regl.prop<Props, "antialias">("antialias"),
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

function regl_rect_no_hatch(regl: Regl): ReglRenderFunction {
  type Props = t.RectGlyphProps
  type Uniforms = t.CommonUniforms
  type Attributes = t.RectGlyphAttributes

  const config: DrawConfig<Uniforms, Attributes, Props> = {
    vert: rect_vertex_shader,
    frag: rect_fragment_shader,

    attributes: {
      a_position: {
        buffer: regl.buffer([[-0.5, -0.5], [-0.5, 0.5], [0.5, 0.5], [0.5, -0.5]]),
        divisor: 0,
      },
      a_center(_, props) {
        return props.center.to_attribute_config()
      },
      a_width(_, props) {
        return props.width.to_attribute_config()
      },
      a_height(_, props) {
        return props.height.to_attribute_config()
      },
      a_angle(_, props) {
        return props.angle.to_attribute_config()
      },
      a_linewidth(_, props) {
        return props.linewidth.to_attribute_config()
      },
      a_line_color(_, props) {
        return props.line_color.to_attribute_config()
      },
      a_fill_color(_, props) {
        return props.fill_color.to_attribute_config()
      },
      a_line_join(_, props) {
        return props.line_join.to_attribute_config()
      },
      a_show(_, props) {
        return props.show.to_attribute_config()
      },
    },

    uniforms: {
      u_canvas_size: regl.prop<Props, "canvas_size">("canvas_size"),
      u_pixel_ratio: regl.prop<Props, "pixel_ratio">("pixel_ratio"),
      u_antialias: regl.prop<Props, "antialias">("antialias"),
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

function regl_rect_hatch(regl: Regl): ReglRenderFunction {
  type Props = t.RectHatchGlyphProps
  type Uniforms = t.CommonUniforms
  type Attributes = t.RectHatchGlyphAttributes

  const config: DrawConfig<Uniforms, Attributes, Props> = {
    vert: `#define HATCH\n\n${rect_vertex_shader}`,
    frag: `#define HATCH\n\n${rect_fragment_shader}`,

    attributes: {
      a_position: {
        buffer: regl.buffer([[-0.5, -0.5], [-0.5, 0.5], [0.5, 0.5], [0.5, -0.5]]),
        divisor: 0,
      },
      a_center(_, props) {
        return props.center.to_attribute_config()
      },
      a_width(_, props) {
        return props.width.to_attribute_config()
      },
      a_height(_, props) {
        return props.height.to_attribute_config()
      },
      a_angle(_, props) {
        return props.angle.to_attribute_config()
      },
      a_linewidth(_, props) {
        return props.linewidth.to_attribute_config()
      },
      a_line_color(_, props) {
        return props.line_color.to_attribute_config()
      },
      a_fill_color(_, props) {
        return props.fill_color.to_attribute_config()
      },
      a_line_join(_, props) {
        return props.line_join.to_attribute_config()
      },
      a_show(_, props) {
        return props.show.to_attribute_config()
      },
      a_hatch_pattern(_, props) {
        return props.hatch_pattern.to_attribute_config()
      },
      a_hatch_scale(_, props) {
        return props.hatch_scale.to_attribute_config()
      },
      a_hatch_weight(_, props) {
        return props.hatch_weight.to_attribute_config()
      },
      a_hatch_color(_, props) {
        return props.hatch_color.to_attribute_config()
      },
    },

    uniforms: {
      u_canvas_size: regl.prop<Props, "canvas_size">("canvas_size"),
      u_pixel_ratio: regl.prop<Props, "pixel_ratio">("pixel_ratio"),
      u_antialias: regl.prop<Props, "antialias">("antialias"),
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
