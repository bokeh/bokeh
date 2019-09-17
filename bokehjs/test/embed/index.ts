import { expect } from "chai"

import * as embed from "@bokehjs/embed"

describe('embed', () => {
  it("should have an empty 'kernels' dict on the embed module", () => {
    expect(embed.kernels).to.be.not.undefined
    expect(embed.kernels).to.be.empty.and.an('object')
  })
})
