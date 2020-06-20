import {TypedArray} from "core/util/ndarray"
import {unreachable} from "core/util/assert"

export abstract class WebGLObject {
  constructor(readonly gl: WebGLRenderingContext) {}
}

export class Program extends WebGLObject {

  UTYPEMAP: {[key: string]: string} = {
    float: "uniform1fv",
    vec2: "uniform2fv",
    vec3: "uniform3fv",
    vec4: "uniform4fv",
    int: "uniform1iv",
    ivec2: "uniform2iv",
    ivec3: "uniform3iv",
    ivec4: "uniform4iv",
    bool: "uniform1iv",
    bvec2: "uniform2iv",
    bvec3: "uniform3iv",
    bvec4: "uniform4iv",
    mat2: "uniformMatrix2fv",
    mat3: "uniformMatrix3fv",
    mat4: "uniformMatrix4fv",
    sampler1D: "uniform1i",
    sampler2D: "uniform1i",
    sampler3D: "uniform1i",
  }

  ATYPEMAP: {[key: string]: string} = {
    float: "vertexAttrib1f",
    vec2: "vertexAttrib2f",
    vec3: "vertexAttrib3f",
    vec4: "vertexAttrib4f",
  }

  ATYPEINFO: {[key: string]: [number, number]} = {
    float: [1, 5126],
    vec2: [2, 5126],
    vec3: [3, 5126],
    vec4: [4, 5126],
  }

  readonly handle: WebGLProgram

  protected _linked = false
  protected _validated = false
  protected _unset_variables: Set<string> = new Set()
  protected _known_invalid: Set<string> = new Set()
  protected _locations: Map<string, number> = new Map()

  readonly _samplers: Map<string, [number, WebGLTexture, number]> = new Map()
  readonly _attributes: Map<string, [WebGLBuffer | null, number, string, unknown[]]> = new Map()

  constructor(gl: WebGLRenderingContext) {
    super(gl)
    this.handle = this.gl.createProgram()!
  }

  delete(): void {
    this.gl.deleteProgram(this.handle)
  }

  activate(): void {
    this.gl.useProgram(this.handle)
  }

  deactivate(): void {
    this.gl.useProgram(0)
  }

  set_shaders(vert: string, frag: string): void {
    // Set GLSL code for the vertex and fragment shader.
    //
    // This function takes care of setting the shading code and
    // compiling+linking it into a working program object that is ready
    // to use.
    //
    // Parameters
    // ----------
    // vert : str
    //     GLSL code for the vertex shader.
    // frag : str
    //     GLSL code for the fragment shader.
    const gl = this.gl
    this._linked = false
    const vert_handle = gl.createShader(gl.VERTEX_SHADER)!
    const frag_handle = gl.createShader(gl.FRAGMENT_SHADER)!
    const tmp: [string, WebGLShader, string][] = [
      [vert, vert_handle, "vertex"],
      [frag, frag_handle, "fragment"],
    ]
    for (const [code, handle, type] of tmp) {
      gl.shaderSource(handle, code)
      gl.compileShader(handle)
      const status = gl.getShaderParameter(handle, gl.COMPILE_STATUS)
      if (!status) {
        const errors = gl.getShaderInfoLog(handle)
        throw new Error(`errors in ${type} shader:\n${errors}`)
      }
    }
    gl.attachShader(this.handle, vert_handle)
    gl.attachShader(this.handle, frag_handle)
    gl.linkProgram(this.handle)
    if (!gl.getProgramParameter(this.handle, gl.LINK_STATUS)) {
      const logs = gl.getProgramInfoLog(this.handle)
      throw new Error(`Program link error:\n${logs}`)
    }
    this._unset_variables = this._get_active_attributes_and_uniforms()
    gl.detachShader(this.handle, vert_handle)
    gl.detachShader(this.handle, frag_handle)
    gl.deleteShader(vert_handle)
    gl.deleteShader(frag_handle)
    this._known_invalid.clear()
    this._linked = true
  }

  _get_active_attributes_and_uniforms(): Set<string> {
    // Retrieve active attributes and uniforms to be able to check that
    // all uniforms/attributes are set by the user.
    const gl = this.gl
    this._locations.clear()
    const regex = new RegExp("(\\w+)\\s*(\\[(\\d+)\\])\\s*")
    const cu = gl.getProgramParameter(this.handle, gl.ACTIVE_UNIFORMS)
    const ca = gl.getProgramParameter(this.handle, gl.ACTIVE_ATTRIBUTES)
    const attributes: [string, unknown][] = []
    const uniforms: [string, unknown][] = []
    const stub5_seq = [
      [attributes, ca, gl.getActiveAttrib, gl.getAttribLocation],
      [uniforms, cu, gl.getActiveUniform, gl.getUniformLocation],
    ]
    for (const [container, count, getActive, getLocation] of stub5_seq) {
      for (let i = 0; i < count; i += 1) {
        const info = getActive.call(gl, this.handle, i)
        const name = info.name
        const m = name.match(regex)
        if (m != null) {
          const name = m[1]
          for (let j = 0; j < info.size; j += 1) {
            container.push([`${name}[${j}]`, info.type])
          }
        } else {
          container.push([name, info.type])
        }
        this._locations.set(name, getLocation.call(gl, this.handle, name))
      }
    }
    const attrs_and_uniforms = new Set<string>()
    for (const [name] of attributes) {
      attrs_and_uniforms.add(name)
    }
    for (const [name] of uniforms) {
      attrs_and_uniforms.add(name)
    }
    return attrs_and_uniforms
  }

  set_texture(name: string, value: Texture2D): void {
    // Set a texture sampler.
    //
    // A texture is a 2 dimensional grid of colors/intensities that
    // can be applied to a face (or used for other means by providing
    // a regular grid of data).
    //
    // Parameters
    // ----------
    // name : str
    //     The name by which the texture is known in the GLSL code.
    // value : Texture2D
    //     The gloo Texture2D object to bind.
    if (!this._linked) {
      throw new Error("Cannot set uniform when program has no code")
    }
    const handle = this._locations.get(name) ?? -1
    if (handle < 0) {
      if (!this._known_invalid.has(name)) {
        this._known_invalid.add(name)
        console.log(`"Variable ${name} is not an active texture`)
      }
      return
    }
    if (this._unset_variables.has(name)) {
      this._unset_variables.delete(name)
    }
    this.activate()
    if (true) {
      let unit = this._samplers.size
      if (this._samplers.has(name)) {
        unit = this._samplers.get(name)![2]
      }
      this._samplers.set(name, [value._target, value.handle, unit])
      this.gl.uniform1i(handle, unit)
    }
  }

  set_uniform(name: string, type_: string, value: number[]): void {
    // Set a uniform value.
    //
    // A uniform is a value that is global to both the vertex and
    // fragment shader.
    //
    // Parameters
    // ----------
    // name : str
    //     The name by which the uniform is known in the GLSL code.
    // type_ : str
    //     The type of the uniform, e.g. 'float', 'vec2', etc.
    // value : list of scalars
    //     The value for the uniform. Should be a list even for type float.
    if (!this._linked) {
      throw new Error("Cannot set uniform when program has no code")
    }
    const handle = this._locations.get(name) ?? -1
    if (handle < 0) {
      if (!this._known_invalid.has(name)) {
        this._known_invalid.add(name)
        console.log(`Variable ${name} is not an active uniform`)
      }
      return
    }
    if (this._unset_variables.has(name)) {
      this._unset_variables.delete(name)
    }
    let count = 1
    if (!type_.startsWith("mat")) {
      const a_type = type_ == "int" || type_ == "bool" ? "float" : type_.replace(/^ib/, "")
      count = Math.floor(value.length / (this.ATYPEINFO[a_type][0]))
    }
    if (count > 1) {
      for (let j = 0; j < count; j += 1) {
        if (this._unset_variables.has(`${name}[${j}]`)) {
          const name_ = `${name}[${j}]`
          if (this._unset_variables.has(name_)) {
            this._unset_variables.delete(name_)
          }
        }
      }
    }
    const funcname = this.UTYPEMAP[type_]
    this.activate()
    if (type_.startsWith("mat")) {
      (this.gl as any)[funcname](handle, false, value)
    } else {
      (this.gl as any)[funcname](handle, value)
    }
  }

  set_attribute(name: string, type_: string, value: VertexBuffer | number[], stride: number = 0, offset: number = 0): void {
    // Set an attribute value.
    //
    // An attribute represents per-vertex data and can only be used
    // in the vertex shader.
    //
    // Parameters
    // ----------
    // name : str
    //     The name by which the attribute is known in the GLSL code.
    // type_ : str
    //     The type of the attribute, e.g. 'float', 'vec2', etc.
    // value : VertexBuffer, array
    //     If value is a VertexBuffer, it is used (with stride and offset)
    //     for the vertex data. If value is an array, its used to set
    //     the value of all vertices (similar to a uniform).
    // stide : int, default 0
    //     The stride to "sample" the vertex data inside the buffer. Unless
    //     multiple vertex data are packed into a single buffer, this should
    //     be zero.
    // offset : int, default 0
    //     The offset to "sample" the vertex data inside the buffer. Unless
    //     multiple vertex data are packed into a single buffer, or only
    //     a part of the data must be used, this should probably be zero.
    if (!this._linked) {
      throw new Error("Cannot set attribute when program has no code")
    }
    const handle = this._locations.get(name) ?? -1
    if (handle < 0) {
      if (!this._known_invalid.has(name)) {
        this._known_invalid.add(name)
        if (value instanceof VertexBuffer && offset > 0) {
        } else {
          console.log(`Variable ${name} is not an active attribute`)
        }
      }
      return
    }
    if (this._unset_variables.has(name)) {
      this._unset_variables.delete(name)
    }
    this.activate()
    if (!(value instanceof VertexBuffer)) {
      const funcname = this.ATYPEMAP[type_]
      this._attributes.set(name, [null, handle, funcname, value])
    } else {
      const [size, gtype] = this.ATYPEINFO[type_]
      const funcname = "vertexAttribPointer"
      const args = [size, gtype, false, stride, offset]
      this._attributes.set(name, [value.handle, handle, funcname, args])
    }
  }

  _pre_draw(): void {
    this.activate()
    for (const [tex_target, tex_handle, unit] of this._samplers.values()) {
      this.gl.activeTexture(this.gl.TEXTURE0 + unit)
      this.gl.bindTexture(tex_target, tex_handle)
    }
    for (const [vbo_handle, attr_handle, funcname, args] of this._attributes.values()) {
      if (vbo_handle != null) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo_handle)
        this.gl.enableVertexAttribArray(attr_handle)
        ;(this.gl as any)[funcname].apply(this.gl, [attr_handle, ...args])
      } else {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
        this.gl.disableVertexAttribArray(attr_handle)
        ;(this.gl as any)[funcname].apply(this.gl, [attr_handle, ...args])
      }
    }
    if (!this._validated) {
      this._validated = true
      this._validate()
    }
  }

  _validate(): void {
    if (this._unset_variables.size) {
      console.log(`Program has unset variables: ${this._unset_variables}`)
    }
    this.gl.validateProgram(this.handle)
    if (!this.gl.getProgramParameter(this.handle, this.gl.VALIDATE_STATUS)) {
      console.log(this.gl.getProgramInfoLog(this.handle))
      throw new Error("Program validation error")
    }
  }

  draw(mode: GLenum, selection: IndexBuffer | [GLint, GLsizei]): void {
    // Draw the current visualization defined by the program.
    //
    // Parameters
    // ----------
    // mode : GL enum
    //     Can be POINTS, LINES, LINE_LOOP, LINE_STRIP, LINE_FAN, TRIANGLES
    // selection : 2-element tuple or IndexBuffer
    //     The selection to draw, specified either as (first, count) or an
    //     IndexBuffer object.
    if (!this._linked) {
      throw new Error("Cannot draw program if code has not been set")
    }
    if (selection instanceof IndexBuffer) {
      this._pre_draw()
      selection.activate()
      const count = selection.buffer_size / 2
      const gtype = this.gl.UNSIGNED_SHORT
      this.gl.drawElements(mode, count, gtype, 0)
      selection.deactivate()
    } else {
      const [first, count] = selection
      if (count != 0) {
        this._pre_draw()
        this.gl.drawArrays(mode, first, count)
      }
    }
  }
}

export abstract class Buffer extends WebGLObject {
  protected _target: number
  protected _usage = 35048

  readonly handle: WebGLBuffer
  buffer_size = 0

  constructor(gl: WebGLRenderingContext) {
    super(gl)
    this.handle = this.gl.createBuffer()!
  }

  delete(): void {
    this.gl.deleteBuffer(this.handle)
  }

  activate(): void {
    this.gl.bindBuffer(this._target, this.handle)
  }

  deactivate(): void {
    this.gl.bindBuffer(this._target, null)
  }

  set_size(nbytes: number): void {
    // Set the size of the buffer in bytes.
    //
    // Parameters
    // ----------
    // nbytes : int
    //     The number of bytes that the buffer needs to hold.
    if (nbytes != this.buffer_size) {
      this.activate()
      this.gl.bufferData(this._target, nbytes, this._usage)
      this.buffer_size = nbytes
    }
  }

  set_data(offset: number, data: TypedArray): void {
    // Set the buffer data.
    //
    // Parameters
    // ----------
    // offset : int
    //     The offset in bytes for the new data.
    // data : typed array
    //     The data to upload.
    this.activate()
    this.gl.bufferSubData(this._target, offset, data)
  }
}

export class VertexBuffer extends Buffer {
  _target = 34962
}

export class IndexBuffer extends Buffer {
  _target = 34963
}

export class Texture2D extends WebGLObject {
  handle: WebGLTexture
  _shape_format?: {width: number, height: number, format: number}

  _target = 3553
  _types: {[key: string]: number} = {
    Int8Array: 5120,
    Uint8Array: 5121,
    Int16Array: 5122,
    Uint16Array: 5123,
    Int32Array: 5124,
    Uint32Array: 5125,
    Float32Array: 5126,
  }

  constructor(gl: WebGLRenderingContext) {
    super(gl)
    this.handle = this.gl.createTexture()!
  }

  delete(): void {
    this.gl.deleteTexture(this.handle)
  }

  activate(): void {
    this.gl.bindTexture(this._target, this.handle)
  }

  deactivate(): void {
    this.gl.bindTexture(this._target, 0)
  }

  _get_alignment(width: number): number {
    // Determines a textures byte alignment. If the width isn't a
    // power of 2 we need to adjust the byte alignment of the image.
    // The image height is unimportant.
    //
    // www.opengl.org/wiki/Common_Mistakes#Texture_upload_and_pixel_reads
    const alignments = [4, 8, 2, 1]
    for (const alignment of alignments) {
      if (width % alignment == 0) {
        return alignment
      }
    }
    unreachable()
  }

  set_wrapping(wrap_s: number, wrap_t: number): void {
    // Set the texture wrapping mode.
    //
    // Parameters
    // ----------
    // wrap_s : GL enum
    //     The mode to wrap the x dimension. Valid values are REPEAT
    //     CLAMP_TO_EDGE MIRRORED_REPEAT
    // wrap_t : GL enum
    //     The mode to wrap the y dimension. Same options as for wrap_s.
    this.activate()
    this.gl.texParameterf(this._target, this.gl.TEXTURE_WRAP_S, wrap_s)
    this.gl.texParameterf(this._target, this.gl.TEXTURE_WRAP_T, wrap_t)
  }

  set_interpolation(min: number, mag: number): void {
    // Set the texture interpolation mode
    //
    // Parameters
    // ----------
    // min : GL enum
    //     The interpolation mode when minifying (i.e. zoomed out). Valid
    //     values are LINEAR and NEAREST.
    // max : GL enum
    //     The interpolation mode when magnifying (i.e. zoomed in). Valid
    //     values are LINEAR, NEAREST, NEAREST_MIPMAP_NEAREST,
    //     LINEAR_MIPMAP_NEAREST, NEAREST_MIPMAP_LINEAR, LINEAR_MIPMAP_LINEAR.
    this.activate()
    this.gl.texParameterf(this._target, this.gl.TEXTURE_MIN_FILTER, min)
    this.gl.texParameterf(this._target, this.gl.TEXTURE_MAG_FILTER, mag)
  }

  set_size([width, height]: [number, number], format: number): void {
    // Set the size of the 2D texture.
    //
    // Parameters
    // ----------
    // shape : tuple of ints
    //     The shape of the data to upload
    // format : GL enum
    //     The format of the texture data. Can be LUMINANCE, LUMINANCE_ALPHA,
    //     RGB, and RGBA.
    if (width != this._shape_format?.width || height != this._shape_format?.height || format != this._shape_format?.format) {
      this._shape_format = {height, width, format}
      this.activate()
      this.gl.texImage2D(this._target, 0, format, width, height, 0, format, this.gl.UNSIGNED_BYTE, null)
    }
  }

  set_data(offset: [number, number], shape: [number, number], data: TypedArray): void {
    // Set the 2D texture data.
    //
    // Parameters
    // ----------
    // offset : tuple of ints
    //     Offset in pixels for each dimension.
    // shape : tuple of ints
    //     The shape of the data to upload
    // data : typed array
    //     The actual pixel data. Can be of any type, but on the GPU the
    //     dat is stored in 8 bit precision.
    this.activate()
    const {width, height, format} = this._shape_format!
    const [x, y] = offset
    const gtype = this._types[data.constructor.name]
    if (gtype == null) {
      throw new Error("Type " + data.constructor.name + " not allowed for texture")
    }
    const alignment = this._get_alignment(shape[0])
    if (alignment != 4) {
      this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, alignment)
    }
    this.gl.texSubImage2D(this._target, 0, x, y, width, height, format, gtype, data)
    if (alignment != 4) {
      this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 4)
    }
  }
}
