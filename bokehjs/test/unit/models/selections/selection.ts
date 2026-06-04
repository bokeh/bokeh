import {expect} from "assertions"

import {Selection} from "@bokehjs/models/selections/selection"
import {Patch} from "@bokehjs/models/glyphs/patch"

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

  describe("is_empty", () => {
    it("should return true for newly created selection", () => {
      const s = new Selection()
      expect(s.is_empty()).to.be.true
    })

    it("should return false when indices are set", () => {
      const s = new Selection({indices: [1, 2]})
      expect(s.is_empty()).to.be.false
    })

    it("should return false when line_indices are set", () => {
      const s = new Selection({line_indices: [0, 1]})
      expect(s.is_empty()).to.be.false
    })

    it("should return false when image_indices are set", () => {
      const s = new Selection({image_indices: [{index: 0, i: 1, j: 2, flat_index: 10}]})
      expect(s.is_empty()).to.be.false
    })

    it("should return false when selected_glyphs are set", () => {
      const s = new Selection()
      const glyph = new Patch()
      s.add_to_selected_glyphs(glyph)
      expect(s.is_empty()).to.be.false
    })

    it("should return true after clear", () => {
      const s = new Selection({indices: [1, 2]})
      const glyph = new Patch()
      s.add_to_selected_glyphs(glyph)
      s.clear()
      expect(s.is_empty()).to.be.true
    })
  })
})
