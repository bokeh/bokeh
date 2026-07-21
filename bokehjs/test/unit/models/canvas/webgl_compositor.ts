import {expect} from "#framework/assertions"

import {WebGLCompositor} from "@bokehjs/models/canvas/webgl_compositor"

describe("WebGLCompositor", () => {
  it("should defer and flush commands in renderer order", () => {
    const compositor = new WebGLCompositor()
    const order: number[] = []
    compositor.enqueue({execute: () => order.push(1)})
    compositor.enqueue({execute: () => order.push(2)})
    expect(order).to.be.equal([])
    expect(compositor.pending).to.be.equal(2)
    expect(compositor.flush()).to.be.equal(2)
    expect(order).to.be.equal([1, 2])
    expect(compositor.pending).to.be.equal(0)
  })

  it("should leave commands enqueued during a flush for the next barrier", () => {
    const compositor = new WebGLCompositor()
    const order: number[] = []
    compositor.enqueue({execute: () => {
      order.push(1)
      compositor.enqueue({execute: () => order.push(2)})
    }})
    compositor.flush()
    expect(order).to.be.equal([1])
    expect(compositor.pending).to.be.equal(1)
    compositor.flush()
    expect(order).to.be.equal([1, 2])
  })
})
