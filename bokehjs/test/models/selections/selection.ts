import {expect} from "chai"

import {Selection} from "models/selections/selection"
import * as hittest from "core/hittest"

const some_1d_selection = hittest.create_hit_test_result_from_hits([[4, 1], [5, 2]])
const other_1d_selection = hittest.create_hit_test_result_from_hits([[0, 1], [1, 2]])

const some_2d_selection = hittest.create_empty_hit_test_result()
some_2d_selection.multiline_indices = {2: [2, 3]}
const other_2d_selection = hittest.create_empty_hit_test_result()
other_2d_selection.multiline_indices = {2: [0, 1]}

describe("Selection", () => {

  it("should be updatable", () => {
    const s = new Selection()
    s.update(some_1d_selection, true, false)
    expect(s.indices).to.deep.equal([4, 5])
  })

  it("should be updatable with append=false", () => {
    const s = new Selection()
    s.update(some_1d_selection, true, false)
    s.update(other_1d_selection, true, false)
    expect(s.indices).to.be.deep.equal([0, 1])
  })

  it("should be updatable with append=true", () => {
    const s = new Selection()
    s.update(some_1d_selection, true, true)
    s.update(other_1d_selection, true, true)
    expect(s.indices).to.be.deep.equal([0, 1, 4, 5])
  })

  it("should update 2d selections with append=false", () => {
    const s = new Selection()
    s.update(some_2d_selection, true, false)
    s.update(other_2d_selection, true, false)
    expect(s.multiline_indices).to.be.deep.equal({2: [0, 1]})
  })

  it("should merge 2d selections with append=true", () => {
    const s = new Selection()
    s.update(some_2d_selection, true, true)
    s.update(other_2d_selection, true, true)
    expect(s.multiline_indices).to.be.deep.equal({2: [0, 1, 2, 3]})
  })

  it("should be clearable", () => {
    const s = new Selection()
    s.update(some_1d_selection, true, false)
    s.clear()
    expect(s.indices).to.deep.equal([])
  })
})
