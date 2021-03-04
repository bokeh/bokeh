import createRegl from "regl"
import {Regl} from "regl"
import {DashCache, DashReturn} from "./dash_cache"
import line_vertex_shader from "./regl_line.vert"
import line_fragment_shader from "./regl_line.frag"
import marker_vertex_shader from "./markers.vert"
import marker_fragment_shader from "./markers.frag"
import {MarkerType} from "core/enums"


// All access to regl is performed via the get_regl() function that returns a
// ReglWrapper object.  This ensures that regl is correctly initialised before
// it is used, and is only initialised once.

let regl_wrapper: ReglWrapper

export function get_regl(gl: WebGLRenderingContext): ReglWrapper {
  if (regl_wrapper === undefined)
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
  private _line_mesh: ReglRenderFunction
  private _marker_map: Map<MarkerType, ReglRenderFunction>

  constructor(gl: WebGLRenderingContext) {
    try {
      this._regl = createRegl({
        gl,
        extensions: [
          "ANGLE_instanced_arrays",
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
    if (this._dashed_line === undefined)
      this._dashed_line = regl_dashed_line(this._regl)
    return this._dashed_line
  }

  public get_dash(line_dash: number[]): DashReturn {
    if (this._dash_cache === undefined)
      this._dash_cache = new DashCache(this._regl)

    return this._dash_cache.get(line_dash)
  }

  public line_mesh(): ReglRenderFunction {
    if (this._line_mesh === undefined)
      this._line_mesh = regl_line_mesh(this._regl)
    return this._line_mesh
  }

  public marker(marker_type: MarkerType): ReglRenderFunction {
    if (this._marker_map === undefined)
      this._marker_map = new Map<MarkerType, ReglRenderFunction>()

    let func = this._marker_map.get(marker_type)
    if (func === undefined) {
      func = regl_marker(this._regl, marker_type)
      this._marker_map.set(marker_type, func)
    }
    return func
  }

  public solid_line(): ReglRenderFunction {
    if (this._solid_line === undefined)
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

// Indices for debug drawing of mesh used for lines.
const line_mesh_indices = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],  // Edges.
  [1, 5], [2, 5], [2, 4], // Diagonals.
]


function regl_solid_line(regl: any): ReglRenderFunction {
  return regl({
    vert: line_vertex_shader,
    frag: line_fragment_shader,

    attributes: {
      a_position: {
        buffer: regl.buffer(line_instance_geometry),
        divisor: 0,
      },
      a_point_prev: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 0,
      },
      a_point_start: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 2,
      },
      a_point_end: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 4,
      },
      a_point_next: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 6,
      },
    },

    uniforms: {
      u_canvas_size: regl.prop('canvas_size'),
      u_pixel_ratio: regl.prop('pixel_ratio'),
      u_color: regl.prop('color'),
      u_linewidth: regl.prop('linewidth'),
      u_antialias: regl.prop('antialias'),
      u_miter_limit: regl.prop('miter_limit'),
      u_join_type: regl.prop('join_type'),
      u_cap_type: regl.prop('cap_type'),
    },

    elements: line_triangle_indices,
    count: 3*line_triangle_indices.length,
    primitive: 'triangles',
    instances: regl.prop("nsegments"),

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
  })
}


function regl_dashed_line(regl: any): ReglRenderFunction {
  return regl({
    vert: '#define DASHED\n\n' + line_vertex_shader,
    frag: '#define DASHED\n\n' + line_fragment_shader,

    attributes: {
      a_position: {
        buffer: regl.buffer(line_instance_geometry),
        divisor: 0,
      },
      a_point_prev: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 0,
      },
      a_point_start: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 2,
      },
      a_point_end: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 4,
      },
      a_point_next: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 6,
      },
      a_length_so_far: {
        buffer: regl.prop("length_so_far"),
        divisor: 1,
      },
    },

    uniforms: {
      u_canvas_size: regl.prop('canvas_size'),
      u_pixel_ratio: regl.prop('pixel_ratio'),
      u_color: regl.prop('color'),
      u_linewidth: regl.prop('linewidth'),
      u_antialias: regl.prop('antialias'),
      u_miter_limit: regl.prop('miter_limit'),
      u_join_type: regl.prop('join_type'),
      u_cap_type: regl.prop('cap_type'),
      u_dash_tex: regl.prop('dash_tex'),
      u_dash_tex_info: regl.prop('dash_tex_info'),
      u_dash_scale: regl.prop('dash_scale'),
      u_dash_offset: regl.prop('dash_offset'),
    },

    elements: line_triangle_indices,
    count: 3*line_triangle_indices.length,
    primitive: 'triangles',
    instances: regl.prop("nsegments"),

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
  })
}


function regl_line_mesh(regl: any): ReglRenderFunction {
  return regl({
    vert: line_vertex_shader,
    frag: `
    precision mediump float;
    uniform vec4 u_color;
    void main ()
    {
        gl_FragColor = u_color;
    }`,

    attributes: {
      a_position: {
        buffer: regl.buffer(line_instance_geometry),
        divisor: 0,
      },
      a_point_prev: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 0,
      },
      a_point_start: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 2,
      },
      a_point_end: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 4,
      },
      a_point_next: {
        buffer: regl.prop("points"),
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT * 6,
      },
    },

    uniforms: {
      u_canvas_size: regl.prop('canvas_size'),
      u_pixel_ratio: regl.prop('pixel_ratio'),
      u_color: regl.prop('color'),
      u_linewidth: regl.prop('linewidth'),
      u_antialias: regl.prop('antialias'),
      u_miter_limit: regl.prop('miter_limit'),
      u_join_type: regl.prop('join_type'),
      u_cap_type: regl.prop('cap_type'),
    },

    elements: line_mesh_indices,
    count: 2*line_mesh_indices.length,
    primitive: 'lines',
    instances: regl.prop("nsegments"),

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
  })
}


// Return a dictionary for a regl attribute that is either one value per
// instance or the same value for all instances in the same regl call.
function one_each_or_constant(prop: any, nitems: number, norm: boolean): {[key: string]: any} {
  return {
    buffer: prop,
    divisor: prop.length == nitems ? 0 : 1,
    normalized: norm,
  }
}


function regl_marker(regl: any, marker_type: MarkerType): ReglRenderFunction {
  return regl({
    vert: marker_vertex_shader,
    frag: '#define USE_' + marker_type.toUpperCase() + '\n\n' + marker_fragment_shader,

    attributes: {
      a_position: {
        buffer: [0.0, 0.0],  // Instanced geometry.
        divisor: 0,
      },
      a_center: {
        buffer: regl.prop('center'),
        divisor: 1,
      },
      a_size: (_: any, props: any) => {
        return one_each_or_constant(props.size, 1, false)
      },
      a_angle: (_: any, props: any) => {
        return one_each_or_constant(props.angle, 1, false)
      },
      a_linewidth: (_: any, props: any) => {
        return one_each_or_constant(props.linewidth, 1, false)
      },
      a_fg_color: (_: any, props: any) => {
        return one_each_or_constant(props.fg_color, 4, true)
      },
      a_bg_color: (_: any, props: any) => {
        return one_each_or_constant(props.bg_color, 4, true)
      },
    },

    uniforms: {
      u_canvas_size: regl.prop('canvas_size'),
      u_pixel_ratio: regl.prop('pixel_ratio'),
      u_antialias: regl.prop('antialias'),
    },

    primitive: 'points',
    count: 1,
    instances: regl.prop('nmarkers'),

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
  })
}
