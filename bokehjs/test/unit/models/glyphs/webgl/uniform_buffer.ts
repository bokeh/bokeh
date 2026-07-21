import {expect} from "#framework/assertions"

import {UniformBuffer} from "@bokehjs/models/glyphs/webgl/uniform_buffer"

describe("UniformBuffer", () => {
  it("should allocate, bind, update, and destroy WebGL2 uniform storage", () => {
    const calls: string[] = []
    const handle = {} as WebGLBuffer
    const gl = {
      UNIFORM_BUFFER: 1,
      DYNAMIC_DRAW: 2,
      createBuffer: () => handle,
      bindBuffer: (_target: number, buffer: WebGLBuffer | null) => calls.push(`bind:${buffer == null ? "null" : "buffer"}`),
      bufferData: (_target: number, size: number) => calls.push(`allocate:${size}`),
      bindBufferBase: (_target: number, binding: number) => calls.push(`base:${binding}`),
      bufferSubData: (_target: number, offset: number, data: Float32Array) => calls.push(`update:${offset}:${data.length}`),
      deleteBuffer: () => calls.push("destroy"),
    } as unknown as WebGL2RenderingContext

    const buffer = new UniformBuffer(gl, 32, 3)
    buffer.update(new Float32Array([1, 2]), 8)
    buffer.destroy()
    buffer.destroy()

    expect(calls.includes("allocate:32")).to.be.true
    expect(calls.includes("base:3")).to.be.true
    expect(calls.includes("update:8:2")).to.be.true
    expect(calls.filter((call) => call == "destroy").length).to.be.equal(1)
  })

  it("should reject out-of-bounds updates", () => {
    const handle = {} as WebGLBuffer
    const gl = {
      UNIFORM_BUFFER: 1,
      DYNAMIC_DRAW: 2,
      createBuffer: () => handle,
      bindBuffer() {},
      bufferData() {},
      bindBufferBase() {},
      bufferSubData() {},
      deleteBuffer() {},
    } as unknown as WebGL2RenderingContext
    const buffer = new UniformBuffer(gl, 8, 0)
    expect(() => buffer.update(new Float32Array([1, 2, 3]))).to.throw()
  })
})
