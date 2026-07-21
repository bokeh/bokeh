import {expect} from "#framework/assertions"

import {install_webgl2_regl_extensions} from "@bokehjs/models/glyphs/webgl/webgl2_extensions"

describe("install_webgl2_regl_extensions", () => {
  it("should expose WebGL2 core APIs through regl's WebGL1 extension contracts", () => {
    const calls: string[] = []
    const gl = {
      MIN: 32775,
      MAX: 32776,
      VERTEX_ARRAY_BINDING: 3,
      getExtension: (name: string) => name == "native" ? {native: true} : null,
      vertexAttribDivisor: () => calls.push("divisor"),
      drawArraysInstanced: () => calls.push("arrays"),
      drawElementsInstanced: () => calls.push("elements"),
      createVertexArray: () => calls.push("create"),
      deleteVertexArray: () => calls.push("delete"),
      isVertexArray: () => true,
      bindVertexArray: () => calls.push("bind"),
    } as unknown as WebGL2RenderingContext

    install_webgl2_regl_extensions(gl)

    expect(gl.getExtension("native")).to.be.equal({native: true})
    expect(gl.getExtension("EXT_blend_minmax")).to.be.equal({MIN_EXT: 32775, MAX_EXT: 32776})
    expect(gl.getExtension("OES_element_index_uint")).to.be.equal({})

    const instancing = gl.getExtension("ANGLE_instanced_arrays")!
    instancing.vertexAttribDivisorANGLE(0, 1)
    instancing.drawArraysInstancedANGLE(0, 0, 0, 0)
    instancing.drawElementsInstancedANGLE(0, 0, 0, 0, 0)

    const vaos = gl.getExtension("OES_vertex_array_object")!
    vaos.createVertexArrayOES()
    vaos.bindVertexArrayOES(null)
    expect(calls).to.be.equal(["divisor", "arrays", "elements", "create", "bind"])
  })
})
