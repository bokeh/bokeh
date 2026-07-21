import {expect} from "#framework/assertions"

import {RevisionState} from "@bokehjs/models/glyphs/webgl/revisions"

describe("RevisionState", () => {
  it("should track domains and consumers independently", () => {
    const state = new RevisionState()
    state.bump("geometry")
    expect(state.changed("geometry", "positions")).to.be.true
    expect(state.changed("visuals", "positions")).to.be.false
    state.consume("geometry", "positions")
    expect(state.changed("geometry", "positions")).to.be.false
    expect(state.changed("geometry", "topology")).to.be.true
  })

  it("should revise selection only when ordered indices change", () => {
    const state = new RevisionState()
    expect(state.sync_selection([1, 3, 5])).to.be.true
    const revision = state.revision("selection")
    expect(state.sync_selection([1, 3, 5])).to.be.false
    expect(state.revision("selection")).to.be.equal(revision)
    expect(state.sync_selection([1, 5, 3])).to.be.true
  })
})
