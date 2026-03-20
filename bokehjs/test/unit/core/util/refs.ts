import {expect} from "#framework/assertions"

import * as refs from "@bokehjs/core/util/refs"

describe("refs module", () => {

  it("should is_ref()", () => {
    expect(refs.is_ref({id: 10})).to.be.true
    expect(refs.is_ref({id: 10, type: "some"})).to.be.false
  })

  it("should may_have_refs()", () => {
    expect(refs.may_have_refs(new Uint8Array(3))).to.be.false
    expect(refs.may_have_refs(new Float64Array(3))).to.be.false
    expect(refs.may_have_refs(new Float64Array(0))).to.be.false
    expect(refs.may_have_refs([])).to.be.true
  })
})
