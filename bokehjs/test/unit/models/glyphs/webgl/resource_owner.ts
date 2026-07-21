import {expect} from "#framework/assertions"

import {GPUResourceOwner} from "@bokehjs/models/glyphs/webgl/resource_owner"

describe("GPUResourceOwner", () => {
  it("should destroy owned resources exactly once", () => {
    const owner = new GPUResourceOwner()
    let destroyed = 0
    const resource = {destroy() { destroyed++ }}
    expect(owner.own(resource)).to.be.equal(resource)
    owner.own(resource)
    owner.destroy()
    owner.destroy()
    expect(destroyed).to.be.equal(1)
  })

  it("should release and replace resources deterministically", () => {
    const owner = new GPUResourceOwner()
    let first_destroyed = 0
    let second_destroyed = 0
    const first = owner.own({destroy() { first_destroyed++ }})
    const second = owner.replace(first, {destroy() { second_destroyed++ }})
    expect(first_destroyed).to.be.equal(1)
    expect(owner.size).to.be.equal(1)
    owner.release(second)
    expect(second_destroyed).to.be.equal(1)
    expect(owner.size).to.be.equal(0)
  })
})
