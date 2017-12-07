import {expect} from "chai"

import {Selector} from "core/selector"
import * as hittest from "core/hittest"

const empty_selection = hittest.create_hit_test_result()

const some_1d_selection = hittest.create_1d_hit_test_result([[0, 1], [1, 2]])
const other_1d_selection = hittest.create_1d_hit_test_result([[4, 1], [5, 2]])

const some_2d_selection = hittest.create_hit_test_result()
some_2d_selection._2d.indices = {2: [0, 1]}
const other_2d_selection = hittest.create_hit_test_result()
other_2d_selection._2d.indices = {2: [2, 3]}

describe("Selector", () => {

  it("should be constructable", () => {
    const s = new Selector()
    expect(s.indices).to.deep.equal(empty_selection)
  })

  it("should be updatable", () => {
    const s = new Selector()
    s.update(some_1d_selection, true, false)
    expect(s.indices).not.to.deep.equal(empty_selection)
  })

  it("should be updatable with append=false", () => {
    const s = new Selector()
    s.update(some_1d_selection, true, false)
    s.update(other_1d_selection, true, false)
    expect(s.indices._1d.indices).to.be.deep.equal([4, 5])
  })

  it("should be updatable with append=true", () => {
    const s = new Selector()
    s.update(some_1d_selection, true, true)
    s.update(other_1d_selection, true, true)
    expect(s.indices._1d.indices).to.be.deep.equal([0, 1, 4, 5])
  })

  it("should update 2d selections with append=false", () => {
    const s = new Selector()
    s.update(some_2d_selection, true, false)
    s.update(other_2d_selection, true, false)
    expect(s.indices._2d.indices).to.be.deep.equal({2: [2, 3]})
  })

  it("should merge 2d selections with append=true", () => {
    const s = new Selector()
    s.update(some_2d_selection, true, true)
    s.update(other_2d_selection, true, true)
    expect(s.indices._2d.indices).to.be.deep.equal({2: [0, 1, 2, 3]})
  })

  it("should be clearable", () => {
    const s = new Selector()
    s.update(some_1d_selection, true, false)
    s.clear()
    expect(s.indices).to.deep.equal(empty_selection)
  })
})
