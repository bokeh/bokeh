import createRegl from "regl"
import {Regl, Texture2D} from "regl"
import {DashCache} from "./dash_cache"
import line_vertex_shader from "./regl_line.vert"
import line_fragment_shader from "./regl_line.frag"


// All access to regl is performed via the get_regl() function that returns a
// ReglWrapper object.  This ensures that regl is correctly initialised before
// it is used, and is only initialised once.

var regl_wrapper: ReglWrapper

export function get_regl(gl: WebGLRenderingContext) : ReglWrapper {
  if (regl_wrapper === undefined)
    regl_wrapper = new ReglWrapper(gl)
  return regl_wrapper
}


export class ReglWrapper {
  private _regl: Regl
  private _dash_cache: DashCache

  // Drawing functions.
  private _solid_line: ({}) => void
  private _dashed_line: ({}) => void
  private _line_mesh: ({}) => void

  constructor(gl: WebGLRenderingContext) {
    this._regl = createRegl({
      gl: gl,
      extensions: [
        "angle_instanced_arrays",
        "oes_texture_float",
        "oes_texture_float_linear",
        "webgl_color_buffer_float",
      ]
    })
    // What to do if error occurs?

    this._dash_cache = new DashCache(this._regl)
  }

  public dashed_line(): ({}) => void {
   if (this._dashed_line === undefined)
      this._dashed_line = regl_dashed_line(this._regl)
    return this._dashed_line
  }

  public get_dash(line_dash: number[]): [[number,number,number], Texture2D] {
    return this._dash_cache.get(line_dash)
  }

  public line_mesh(): ({}) => void {
    if (this._line_mesh === undefined)
      this._line_mesh = regl_line_mesh(this._regl)
    return this._line_mesh
  }

  public solid_line(): ({}) => void {
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

const line_triangle_indices = [[0,1,5], [1,2,5], [5,2,4], [2,3,4]]

// Indices for debug drawing of mesh used for lines.
const line_mesh_indices = [
  [0,1], [1,2], [2,3], [3,4], [4,5], [5,0],  // Edges.
  [1,5], [2,5], [2,4], // Diagonals.
]


function regl_solid_line(regl: any): ({}) => void {
  return regl({
    vert: line_vertex_shader,
    frag: line_fragment_shader,

    attributes: {
      a_position: {
        buffer: regl.buffer(line_instance_geometry),
        divisor: 0
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
      u_color: regl.prop('color'),
      u_projection: regl.prop('projection'),
      u_projection2: regl.prop('projection2'),
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
    depth: { enable: false },
  })
}


function regl_dashed_line(regl: any): ({}) => void {
  return regl({
    vert: '#define DASHED\n\n' + line_vertex_shader,
    frag: '#define DASHED\n\n' + line_fragment_shader,

    attributes: {
      a_position: {
        buffer: regl.buffer(line_instance_geometry),
        divisor: 0
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
      u_color: regl.prop('color'),
      u_projection: regl.prop('projection'),
      u_projection2: regl.prop('projection2'),
      u_linewidth: regl.prop('linewidth'),
      u_antialias: regl.prop('antialias'),
      u_miter_limit: regl.prop('miter_limit'),
      u_join_type: regl.prop('join_type'),
      u_cap_type: regl.prop('cap_type'),
      u_dash_tex: regl.prop('dash_tex'),
      u_dash_tex_info: regl.prop('dash_tex_info'),
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
    depth: { enable: false },
  })
}


function regl_line_mesh(regl: any): ({}) => void {
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
        divisor: 0
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
      u_color: regl.prop('color'),
      u_projection: regl.prop('projection'),
      u_projection2: regl.prop('projection2'),
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
    depth: { enable: false },
  })
}
