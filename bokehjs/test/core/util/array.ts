import {expect} from "chai"
import * as array from "core/util/array"

describe("core/util/array module", () => {

  it("copy should return a new copy", () => {
    const a = [0, 1, 2]
    const b = array.copy(a)
    expect(b).to.deep.equal([0, 1, 2])
    a[0] = 10
    expect(a).to.deep.equal([10, 1, 2])
    expect(b).to.deep.equal([0, 1, 2])
  })

  it("concat should append all arrays", () => {
    const a = [0, 1, 2]
    const b = [1, 5, 2]
    const c: number[] = []
    const d = [10, 20]
    expect(array.concat([a, b, c, d])).to.deep.equal([0, 1, 2, 1, 5, 2, 10, 20])
  })

  it("contains should return true or false", () => {
    const a = [0, 1, 2]
    expect(array.contains(a, 0)).to.equal(true)
    expect(array.contains(a, 1)).to.equal(true)
    expect(array.contains(a, 5)).to.equal(false)
    expect(array.contains(a, null)).to.equal(false)
    expect(array.contains(a, undefined)).to.equal(false)
  })

  it("nth should return the correct index", () => {
    const a = [0, 1, 2]
    expect(array.nth(a, 0)).to.equal(0)
    expect(array.nth(a, 1)).to.equal(1)
    expect(array.nth(a, 5)).to.equal(undefined)
  })

  it("zip should zip two equal length arrays", () => {
    const a = [0, 1, 2]
    const b = [1, 5, 2]
    expect(array.zip(a, b)).to.deep.equal([[0, 1], [1, 5], [2, 2]])
  })

  it("zip should use shorter length for unequal arrays", () => {
    const a = [0, 1, 2]
    const b = [1, 5, 2, 10]
    expect(array.zip(a, b)).to.deep.equal([[0, 1], [1, 5], [2, 2]])
  })

  it("range should mimic python range", () => {
    expect(array.range(5)).to.deep.equal([0, 1, 2, 3, 4])
    expect(array.range(0, 5)).to.deep.equal([0, 1, 2, 3, 4])
    expect(array.range(1, 5)).to.deep.equal([1, 2, 3, 4])
    expect(array.range(1, 5, 2)).to.deep.equal([1, 3])
    expect(array.range(5, 0, -1)).to.deep.equal([5, 4, 3, 2, 1])
    expect(array.range(5, 0, -2)).to.deep.equal([5, 3, 1])
  })

  it("range should work with fractional step", () => {
    expect(array.range(0, 2, 0.5)).to.deep.equal([0, 0.5, 1, 1.5])
  })

  it("unzip should use generate two arrays in a list", () => {
    const a = [0, 1, 2]
    const b = [1, 5, 2]
    expect(array.unzip([[0, 1], [1, 5], [2, 2]])).to.deep.equal([a, b])
  })

  it("uniq should return only the uniq values of an array", () => {
    expect(array.uniq([0, 1, 2])).to.deep.equal([0, 1, 2])
    expect(array.uniq([0, 1, 2, 1, 2])).to.deep.equal([0, 1, 2])
    expect(array.uniq([0, 1, 2, 1, 2, null])).to.deep.equal([0, 1, 2, null])
    expect(array.uniq([0, 1, 2, 1, 2, null, null])).to.deep.equal([0, 1, 2, null])
    expect(array.uniq([0, 1, 2, 1, 2, undefined])).to.deep.equal([0, 1, 2, undefined])
  })

  it("intersection should return array of values in first array found in all others", () => {
    const a = [0, 1, 2]
    const b = [1, 5, 2]
    expect(array.intersection(a, b)).to.deep.equal([1, 2])
    expect(array.intersection(a, [])).to.deep.equal([])
    expect(array.intersection(a, [10, 20])).to.deep.equal([])
    expect(array.intersection(a, b, [2])).to.deep.equal([2])
  })

  it("union should return array of unique values from all arrays", () => {
    const a = [0, 1, 2]
    const b = [1, 5, 2]
    expect(array.union(a, b)).to.deep.equal([0, 1, 2, 5])
  })

  it("difference should return array of values from the first array not in all others ", () => {
    const a = [0, 1, 2]
    const b = [1, 5, 2]
    expect(array.difference(a, b)).to.deep.equal([0])
    expect(array.difference(a, [])).to.deep.equal([0, 1, 2])
    expect(array.difference(a, [10, 20])).to.deep.equal([0, 1, 2])
    expect(array.difference(a, b, [2])).to.deep.equal([0])
    expect(array.difference(a, b, [0])).to.deep.equal([])
  })
})
