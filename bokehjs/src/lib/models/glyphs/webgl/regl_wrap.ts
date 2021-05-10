import createRegl from "regl"
import {Regl, DrawConfig, AttributeConfig} from "regl"
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

let regl_wrapper: ReglWrapper

export function get_regl(gl: WebGLRenderingContext): ReglWrapper {
  if (regl_wrapper == null)
    regl_wrapper = new ReglWrapper(gl)
  return regl_wrapper
}

type ReglRenderFunction = ({}) => void

export class ReglWrapper {
  private _regl: Regl
  private _regl_available: boolean
  private _dash_cache: DashCache

  // Drawing functions.
  private _solid_line: ReglRenderFunction
  private _dashed_line: ReglRenderFunction
  private _marker_map: Map<MarkerType, ReglRenderFunction>
  private _rect_no_hatch: ReglRenderFunction
  private _rect_hatch: ReglRenderFunction

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
    } catch (err: unknown) {
      this._regl_available = false
    }
  }

  get has_webgl(): boolean {
    return this._regl_available
  }

  public dashed_line(): ReglRenderFunction {
    if (this._dashed_line == null)
      this._dashed_line = regl_dashed_line(this._regl)
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
      this._solid_line = regl_solid_line(this._regl)
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
const line_instance_geometry = [
  [-2.0,  0.0],  // 0
  [-1.0, -1.0],  // 1
  [ 1.0, -1.0],  // 2
  [ 2.0,  0.0],  // 3
  [ 1.0,  1.0],  // 4
  [-1.0,  1.0],  // 5
]

const line_triangle_indices = [[0, 1, 5], [1, 2, 5], [5, 2, 4], [2, 3, 4]]

function regl_solid_line(regl: Regl): ReglRenderFunction {
  type Props = t.LineGlyphProps
  type Uniforms = t.LineGlyphUniforms
  type Attributes = t.LineGlyphAttributes

  const config: DrawConfig<Uniforms, Attributes, Props> = {
    vert: line_vertex_shader,
    frag: line_fragment_shader,

    attributes: {
      a_position: {
        buffer: regl.buffer(line_instance_geometry),
        divisor: 0,
      },
      a_point_prev(_, props) {
        return {
          buffer: regl.buffer(props.points),
          divisor: 1,
        }
      },
      a_point_start(_, props) {
        return {
          buffer: regl.buffer(props.points),
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 2,
        }
      },
      a_point_end(_, props) {
        return {
          buffer: regl.buffer(props.points),
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 4,
        }
      },
      a_point_next(_, props) {
        return {
          buffer: regl.buffer(props.points),
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 6,
        }
      },
    },

    uniforms: {
      u_canvas_size: regl.prop<Props, 'canvas_size'>('canvas_size'),
      u_pixel_ratio: regl.prop<Props, 'pixel_ratio'>('pixel_ratio'),
      u_antialias: regl.prop<Props, 'antialias'>('antialias'),
      u_line_color: regl.prop<Props, 'line_color'>('line_color'),
      u_linewidth: regl.prop<Props, 'linewidth'>('linewidth'),
      u_miter_limit: regl.prop<Props, 'miter_limit'>('miter_limit'),
      u_line_join: regl.prop<Props, 'line_join'>('line_join'),
      u_line_cap: regl.prop<Props, 'line_cap'>('line_cap'),
    },

    elements: line_triangle_indices,
    count: 3*line_triangle_indices.length,
    primitive: 'triangles',
    instances: regl.prop<Props, 'nsegments'>("nsegments"),

    blend: {
      enable: true,
      equation: 'max',
      func: {
        srcRGB: 1,
        srcAlpha: 1,
        dstRGB: 1,
        dstAlpha: 1,
      },
    },
    depth: {enable: false},
  }

  return regl<Uniforms, Attributes, Props>(config)
}

function regl_dashed_line(regl: Regl): ReglRenderFunction {
  type Props = t.LineDashGlyphProps
  type Uniforms = t.LineDashGlyphUniforms
  type Attributes = t.LineDashGlyphAttributes

  const config: DrawConfig<Uniforms, Attributes, Props> = {
    vert: '#define DASHED\n\n' + line_vertex_shader,
    frag: '#define DASHED\n\n' + line_fragment_shader,

    attributes: {
      a_position: {
        buffer: regl.buffer(line_instance_geometry),
        divisor: 0,
      },
      a_point_prev(_, props) {
        return {
          buffer: regl.buffer(props.points),
          divisor: 1,
        }
      },
      a_point_start(_, props) {
        return {
          buffer: regl.buffer(props.points),
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 2,
        }
      },
      a_point_end(_, props) {
        return {
          buffer: regl.buffer(props.points),
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 4,
        }
      },
      a_point_next(_, props) {
        return {
          buffer: regl.buffer(props.points),
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 6,
        }
      },
      a_length_so_far(_, props) {
        return {
          buffer: regl.buffer(props.length_so_far),
          divisor: 1,
        }
      },
    },

    uniforms: {
      u_canvas_size: regl.prop<Props, 'canvas_size'>('canvas_size'),
      u_pixel_ratio: regl.prop<Props, 'pixel_ratio'>('pixel_ratio'),
      u_antialias: regl.prop<Props, 'antialias'>('antialias'),
      u_line_color: regl.prop<Props, 'line_color'>('line_color'),
      u_linewidth: regl.prop<Props, 'linewidth'>('linewidth'),
      u_miter_limit: regl.prop<Props, 'miter_limit'>('miter_limit'),
      u_line_join: regl.prop<Props, 'line_join'>('line_join'),
      u_line_cap: regl.prop<Props, 'line_cap'>('line_cap'),
      u_dash_tex: regl.prop<Props, 'dash_tex'>('dash_tex'),
      u_dash_tex_info: regl.prop<Props, 'dash_tex_info'>('dash_tex_info'),
      u_dash_scale: regl.prop<Props, 'dash_scale'>('dash_scale'),
      u_dash_offset: regl.prop<Props, 'dash_offset'>('dash_offset'),
    },

    elements: line_triangle_indices,
    count: 3*line_triangle_indices.length,
    primitive: 'triangles',
    instances: regl.prop<Props, 'nsegments'>("nsegments"),

    blend: {
      enable: true,
      equation: 'max',
      func: {
        srcRGB: 1,
        srcAlpha: 1,
        dstRGB: 1,
        dstAlpha: 1,
      },
    },
    depth: {enable: false},
  }

  return regl<Uniforms, Attributes, Props>(config)
}

// Return a ReGL AttributeConfig that corresponds to one value for
// each marker or the same value for all markers.  Instanced rendering supports
// the former using 'divisor = 1', but does not support the latter directly.
// We have to either repeat the attribute once for each marker, which is
// wasteful for a large number of markers, or the solution used here which is to
// repeat the value 4 times, once for each of the instanced vertices (using
// 'divisor = 0').
function one_each_or_constant(regl: Regl, prop: Float32Array | Uint8Array | number[], nitems: number, norm: boolean, nmarkers: number): AttributeConfig {
  const divisor = prop.length == nitems && nmarkers > 1 ? 0 : 1
  return {
    buffer: regl.buffer(divisor == 1 ? prop : [prop, prop, prop, prop]),
    divisor,
    normalized: norm,
  }
}

function regl_marker(regl: Regl, marker_type: MarkerType): ReglRenderFunction {
  type Props = t.MarkerGlyphProps
  type Uniforms = t.CommonUniforms
  type Attributes = t.MarkerGlyphAttributes

  const config: DrawConfig<Uniforms, Attributes, Props> = {
    vert: marker_vertex_shader,
    frag: '#define USE_' + marker_type.toUpperCase() + '\n\n' + marker_fragment_shader,

    attributes: {
      a_position: {
        buffer: regl.buffer([[-0.5, -0.5], [-0.5, 0.5], [0.5, 0.5], [0.5, -0.5]]),
        divisor: 0,
      },
      a_center(_, props) {
        return {
          buffer: regl.buffer(props.center),
          divisor: 1,
        }
      },
      a_size(_, props) {
        return one_each_or_constant(regl, props.size, 1, false, props.nmarkers)
      },
      a_angle(_, props) {
        return one_each_or_constant(regl, props.angle, 1, false, props.nmarkers)
      },
      a_linewidth(_, props) {
        return one_each_or_constant(regl, props.linewidth, 1, false, props.nmarkers)
      },
      a_line_color(_, props) {
        return one_each_or_constant(regl, props.line_color, 4, true, props.nmarkers)
      },
      a_fill_color(_, props) {
        return one_each_or_constant(regl, props.fill_color, 4, true, props.nmarkers)
      },
      a_show(_, props) {
        return {
          buffer: regl.buffer(props.show),
          normalized: true,
          divisor: 1,
        }
      },
    },

    uniforms: {
      u_canvas_size: regl.prop<Props, 'canvas_size'>('canvas_size'),
      u_pixel_ratio: regl.prop<Props, 'pixel_ratio'>('pixel_ratio'),
      u_antialias: regl.prop<Props, 'antialias'>('antialias'),
    },

    count: 4,
    primitive: 'triangle fan',
    instances: regl.prop<Props, 'nmarkers'>('nmarkers'),

    blend: {
      enable: true,
      func: {
        srcRGB:   'one',
        srcAlpha: 'one',
        dstRGB:   'one minus src alpha',
        dstAlpha: 'one minus src alpha',
      },
    },
    depth: {enable: false},
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
        return {
          buffer: regl.buffer(props.center),
          divisor: 1,
        }
      },
      a_width(_, props) {
        return one_each_or_constant(regl, props.width, 1, false, props.nmarkers)
      },
      a_height(_, props) {
        return one_each_or_constant(regl, props.height, 1, false, props.nmarkers)
      },
      a_angle(_, props) {
        return one_each_or_constant(regl, props.angle, 1, false, props.nmarkers)
      },
      a_linewidth(_, props) {
        return one_each_or_constant(regl, props.linewidth, 1, false, props.nmarkers)
      },
      a_line_color(_, props) {
        return one_each_or_constant(regl, props.line_color, 4, true, props.nmarkers)
      },
      a_fill_color(_, props) {
        return one_each_or_constant(regl, props.fill_color, 4, true, props.nmarkers)
      },
      a_line_join(_, props) {
        return one_each_or_constant(regl, props.line_join, 1, false, props.nmarkers)
      },
      a_show(_, props) {
        return {
          buffer: regl.buffer(props.show),
          normalized: true,
          divisor: 1,
        }
      },
    },

    uniforms: {
      u_canvas_size: regl.prop<Props, 'canvas_size'>('canvas_size'),
      u_pixel_ratio: regl.prop<Props, 'pixel_ratio'>('pixel_ratio'),
      u_antialias: regl.prop<Props, 'antialias'>('antialias'),
    },

    count: 4,
    primitive: 'triangle fan',
    instances: regl.prop<Props, 'nmarkers'>('nmarkers'),

    blend: {
      enable: true,
      func: {
        srcRGB:   'one',
        srcAlpha: 'one',
        dstRGB:   'one minus src alpha',
        dstAlpha: 'one minus src alpha',
      },
    },
    depth: {enable: false},
  }

  return regl<Uniforms, Attributes, Props>(config)
}

function regl_rect_hatch(regl: Regl): ReglRenderFunction {
  type Props = t.RectHatchGlyphProps
  type Uniforms = t.CommonUniforms
  type Attributes = t.RectHatchGlyphAttributes

  const config: DrawConfig<Uniforms, Attributes, Props> = {
    vert: '#define HATCH\n\n' + rect_vertex_shader,
    frag: '#define HATCH\n\n' + rect_fragment_shader,

    attributes: {
      a_position: {
        buffer: regl.buffer([[-0.5, -0.5], [-0.5, 0.5], [0.5, 0.5], [0.5, -0.5]]),
        divisor: 0,
      },
      a_center(_, props) {
        return {
          buffer: regl.buffer(props.center),
          divisor: 1,
        }
      },
      a_width(_, props) {
        return one_each_or_constant(regl, props.width, 1, false, props.nmarkers)
      },
      a_height(_, props) {
        return one_each_or_constant(regl, props.height, 1, false, props.nmarkers)
      },
      a_angle(_, props) {
        return one_each_or_constant(regl, props.angle, 1, false, props.nmarkers)
      },
      a_linewidth(_, props) {
        return one_each_or_constant(regl, props.linewidth, 1, false, props.nmarkers)
      },
      a_line_color(_, props) {
        return one_each_or_constant(regl, props.line_color, 4, true, props.nmarkers)
      },
      a_fill_color(_, props) {
        return one_each_or_constant(regl, props.fill_color, 4, true, props.nmarkers)
      },
      a_line_join(_, props) {
        return one_each_or_constant(regl, props.line_join, 1, false, props.nmarkers)
      },
      a_show(_, props) {
        return {
          buffer: regl.buffer(props.show),
          normalized: true,
          divisor: 1,
        }
      },
      a_hatch_pattern(_, props) {
        return one_each_or_constant(regl, props.hatch_pattern, 1, false, props.nmarkers)
      },
      a_hatch_scale(_, props) {
        return one_each_or_constant(regl, props.hatch_scale, 1, false, props.nmarkers)
      },
      a_hatch_weight(_, props) {
        return one_each_or_constant(regl, props.hatch_weight, 1, false, props.nmarkers)
      },
      a_hatch_color(_, props) {
        return one_each_or_constant(regl, props.hatch_color, 4, true, props.nmarkers)
      },
    },

    uniforms: {
      u_canvas_size: regl.prop<Props, 'canvas_size'>('canvas_size'),
      u_pixel_ratio: regl.prop<Props, 'pixel_ratio'>('pixel_ratio'),
      u_antialias: regl.prop<Props, 'antialias'>('antialias'),
    },

    count: 4,
    primitive: 'triangle fan',
    instances: regl.prop<Props, 'nmarkers'>('nmarkers'),

    blend: {
      enable: true,
      func: {
        srcRGB:   'one',
        srcAlpha: 'one',
        dstRGB:   'one minus src alpha',
        dstAlpha: 'one minus src alpha',
      },
    },
    depth: {enable: false},
  }

  return regl<Uniforms, Attributes, Props>(config)
}
