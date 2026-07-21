/** Adapt WebGL2 core features to the WebGL1 extension interfaces expected by
 * regl. This can be removed when regl natively understands WebGL2 contexts. */
export function install_webgl2_regl_extensions(gl: WebGL2RenderingContext): void {
  const native_get_extension = gl.getExtension.bind(gl)

  const extensions: {[name: string]: object} = {
    angle_instanced_arrays: {
      vertexAttribDivisorANGLE: gl.vertexAttribDivisor.bind(gl),
      drawArraysInstancedANGLE: gl.drawArraysInstanced.bind(gl),
      drawElementsInstancedANGLE: gl.drawElementsInstanced.bind(gl),
    },
    ext_blend_minmax: {
      MIN_EXT: gl.MIN,
      MAX_EXT: gl.MAX,
    },
    oes_element_index_uint: {},
    oes_vertex_array_object: {
      VERTEX_ARRAY_BINDING_OES: gl.VERTEX_ARRAY_BINDING,
      createVertexArrayOES: gl.createVertexArray.bind(gl),
      deleteVertexArrayOES: gl.deleteVertexArray.bind(gl),
      isVertexArrayOES: gl.isVertexArray.bind(gl),
      bindVertexArrayOES: gl.bindVertexArray.bind(gl),
    },
  }

  Object.defineProperty(gl, "getExtension", {
    configurable: true,
    value(name: string): object | null {
      return native_get_extension(name) ?? extensions[name.toLowerCase()] ?? null
    },
  })
}
