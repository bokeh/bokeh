import {expect} from "assertions"

import * as refs from "@bokehjs/core/util/refs"

describe("refs module", () => {

  it("should is_ref()", () => {
    expect(refs.is_ref({id: 10})).to.be.true
    expect(refs.is_ref({id: 10, type: "some"})).to.be.false
  })
})
