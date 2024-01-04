import {expect} from "assertions"

import {Selection} from "@bokehjs/models/selections/selection"

const some_1d_selection = new Selection({indices: [4, 5]})
const other_1d_selection = new Selection({indices: [0, 1]})

const some_2d_selection = new Selection({multiline_indices: new Map([[2, [2, 3]]])})
const other_2d_selection = new Selection({multiline_indices: new Map([[2, [0, 1]]])})

describe("Selection", () => {

  it("should be updatable", () => {
    const s = new Selection()
    s.update(some_1d_selection, true, "replace")
    expect(s.indices).to.be.equal([4, 5])
  })

  it("should be updatable with 'replace' mode", () => {
    const s = new Selection()
    s.update(some_1d_selection, true, "replace")
    s.update(other_1d_selection, true, "replace")
    expect(s.indices).to.be.equal([0, 1])
  })

  it("should be updatable with 'append' mode", () => {
    const s = new Selection()
    s.update(some_1d_selection, true, "append")
    s.update(other_1d_selection, true, "append")
    expect(s.indices).to.be.equal([4, 5, 0, 1])
  })

  it("should update 2d selections with 'replace' mode", () => {
    const s = new Selection()
    s.update(some_2d_selection, true, "replace")
    s.update(other_2d_selection, true, "replace")
    expect(s.multiline_indices).to.be.equal(new Map([[2, [0, 1]]]))
  })

  it("should merge 2d selections with 'append' mode", () => {
    const s = new Selection()
    s.update(some_2d_selection, true, "append")
    s.update(other_2d_selection, true, "append")
    expect(s.multiline_indices).to.be.equal(new Map([[2, [0, 1, 2, 3]]]))
  })

  it("should be clearable", () => {
    const s = new Selection()
    s.update(some_1d_selection, true, "replace")
    s.clear()
    expect(s.indices).to.be.equal([])
  })

  it("should be invertible", () => {
    const s = new Selection()
    s.update(some_1d_selection, true, "replace")
    s.invert(10)
    expect(s.indices).to.be.equal([0, 1, 2, 3, 6, 7, 8, 9])
  })
})
