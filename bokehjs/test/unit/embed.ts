import {expect} from "assertions"

import * as embed from "@bokehjs/embed"

describe('embed', () => {
  it("should have an empty 'kernels' dict on the embed module", () => {
    expect(embed.kernels).to.be.equal({})
  })
})
