import * as array from "@bokehjs/core/util/array"
import {AssertionError} from "@bokehjs/core/util/assert"
import {expect} from "assertions"

describe("core/util/array module", () => {

  it("copy should return a new copy", () => {
    const a = [0, 1, 2]
    const b = array.copy(a)
    expect(b).to.be.equal([0, 1, 2])
    a[0] = 10
    expect(a).to.be.equal([10, 1, 2])
    expect(b).to.be.equal([0, 1, 2])
  })

  it("concat should append all arrays", () => {
    const a = [0, 1, 2]
    const b = [1, 5, 2]
    const c: number[] = []
    const d = [10, 20]
    expect(array.concat([a, b, c, d])).to.be.equal([0, 1, 2, 1, 5, 2, 10, 20])
  })

  it("contains should return true or false", () => {
    const a = [0, 1, 2]
    expect(array.contains(a, 0)).to.be.true
    expect(array.contains(a, 1)).to.be.true
    expect(array.contains(a, 5)).to.be.false
    expect(array.contains(a, null)).to.be.false
    expect(array.contains(a, undefined)).to.be.false
  })

  it("nth should return the correct index", () => {
    const a = [0, 1, 2]
    expect(array.nth(a, 0)).to.be.equal(0)
    expect(array.nth(a, 1)).to.be.equal(1)
    expect(array.nth(a, 5)).to.be.undefined
  })

  it("zip should zip two equal length arrays", () => {
    const a = [0, 1, 2]
    const b = [1, 5, 2]
    expect(array.zip(a, b)).to.be.equal([[0, 1], [1, 5], [2, 2]])
  })

  it("zip should use shorter length for unequal arrays", () => {
    const a = [0, 1, 2]
    const b = [1, 5, 2, 10]
    expect(array.zip(a, b)).to.be.equal([[0, 1], [1, 5], [2, 2]])
  })

  it("range should mimic python range", () => {
    expect(array.range(5)).to.be.equal([0, 1, 2, 3, 4])
    expect(array.range(0, 5)).to.be.equal([0, 1, 2, 3, 4])
    expect(array.range(1, 5)).to.be.equal([1, 2, 3, 4])
    expect(array.range(1, 5, 2)).to.be.equal([1, 3])
    expect(array.range(5, 0, 1)).to.be.equal([5, 4, 3, 2, 1])
    expect(array.range(5, 0, 2)).to.be.equal([5, 3, 1])
  })

  it("range should work with fractional step", () => {
    expect(array.range(0, 2, 0.5)).to.be.equal([0, 0.5, 1, 1.5])
  })

  it("unzip should use generate two arrays in a list", () => {
    expect(array.unzip<unknown>([])).to.be.equal([])

    const a = [0, 1, 2]
    const b = [1, 5, 2]
    expect(array.unzip([[0, 1], [1, 5], [2, 2]])).to.be.equal([a, b])
  })

  it("uniq should return only the uniq values of an array", () => {
    expect(array.uniq([0, 1, 2])).to.be.equal([0, 1, 2])
    expect(array.uniq([0, 1, 2, 1, 2])).to.be.equal([0, 1, 2])
    expect(array.uniq([0, 1, 2, 1, 2, null])).to.be.equal([0, 1, 2, null])
    expect(array.uniq([0, 1, 2, 1, 2, null, null])).to.be.equal([0, 1, 2, null])
    expect(array.uniq([0, 1, 2, 1, 2, undefined])).to.be.equal([0, 1, 2, undefined])
  })

  it("union() should return an array of unique values from all arrays", () => {
    const a = [0, 1, 2]
    const b = [1, 5, 2]
    expect(array.union(a, b)).to.be.equal([0, 1, 2, 5])
  })

  it("intersection() should return an array of values in first array found in all others", () => {
    const a = [0, 1, 2]
    const b = [1, 5, 2]
    expect(array.intersection(a, b)).to.be.equal([1, 2])
    expect(array.intersection(a, [])).to.be.equal([])
    expect(array.intersection(a, [10, 20])).to.be.equal([])
    expect(array.intersection(a, b, [2])).to.be.equal([2])
  })

  it("difference() should return an array of values from the first array not in all others", () => {
    const a = [0, 1, 2]
    const b = [1, 5, 2]
    expect(array.difference(a, b)).to.be.equal([0])
    expect(array.difference(a, [])).to.be.equal([0, 1, 2])
    expect(array.difference(a, [10, 20])).to.be.equal([0, 1, 2])
    expect(array.difference(a, b, [2])).to.be.equal([0])
    expect(array.difference(a, b, [0])).to.be.equal([])
  })

  it("symmetric_difference() should return an array of values from either one array or the other, but not both", () => {
    const a = [0, 1, 2]
    const b = [1, 5, 2]
    expect(array.symmetric_difference(a, b)).to.be.equal([0, 5])
    expect(array.symmetric_difference(a, [])).to.be.equal([0, 1, 2])
    expect(array.symmetric_difference([], b)).to.be.equal([1, 5, 2])
  })

  it("split() should allow to split an array into chunks", () => {
    expect(array.split([], null)).to.be.equal([[]])
    expect(array.split([1], null)).to.be.equal([[1]])
    expect(array.split([null], null)).to.be.equal([[], []])
    expect(array.split([1, null], null)).to.be.equal([[1], []])
    expect(array.split([null, 2], null)).to.be.equal([[], [2]])
    expect(array.split([1, null, 2], null)).to.be.equal([[1], [2]])
    expect(array.split([0, 1, null, 2, null, 3, 4, 5], null)).to.be.equal([[0, 1], [2], [3, 4, 5]])
  })

  it("linspace should return an array of a given length between two given numbers", () => {
    expect(array.linspace(2, 3, 5)).to.be.equal([2, 2.25, 2.5, 2.75, 3])
    expect(array.linspace(2, 3).length).to.be.equal(100)
    expect(array.linspace(2, 3, 0)).to.be.equal([])
    expect(() => array.linspace(2, 3, NaN)).to.throw(RangeError)
    expect(array.linspace(NaN, NaN).length).to.be.equal(100)
  })

  it("linspace() should support num less than 2", () => {
    expect(array.linspace(0, 1, 0)).to.be.equal([])
    expect(array.linspace(0, 1, 1)).to.be.equal([0])
  })

  it("transpose should return the given array with transposed axes", () => {
    expect(array.transpose([[1, 2], [3, 4]])).to.be.equal([[1, 3], [2, 4]])
    expect(array.transpose([[1, 2, 3, 4], [5, 6, 7, 8]])).to.be.equal([[1, 5], [2, 6], [3, 7], [4, 8]])
    expect(array.transpose([[1, null, 3, undefined], [NaN]])).to.be.equal([[1, NaN], [null, undefined], [3, undefined], [undefined, undefined]])
  })

  it("remove_at should remove an item from an array at the specified index", () => {
    expect(array.remove_at([1, 2, 3, 4], 1)).to.be.equal([1, 3, 4])
    expect(array.remove_at([1, 2, 3, 4], 5)).to.be.equal([1, 2, 3, 4])
    expect(() => array.remove_at([NaN], NaN)).to.throw(AssertionError)
  })

  it("clear should remove all items from a given array", () => {
    const arr = [1, 2, 3, 4]
    array.clear(arr)
    expect(arr.length).to.be.equal(0)
  })

  it("reversed should return the given array in reversed order", () => {
    expect(array.reversed([1, 2, 3, 4])).to.be.equal([4, 3, 2, 1])
    expect(array.reversed([null, NaN, undefined, 0, 1])).to.be.equal([1, 0, undefined, NaN, null])
  })

  it("repeat should create an array of a given length with repeated values", () => {
    expect(array.repeat(4, 3)).to.be.equal([4, 4, 4])
    expect(array.repeat([1, 2], 3)).to.be.equal([[1, 2], [1, 2], [1, 2]])
    expect(() => array.repeat(4, NaN)).to.throw(RangeError)
  })

  it("argmin should return the index of the lowest value along an axis", () => {
    expect(array.argmin([1, 2, 3, 4])).to.be.equal(0)
    expect(array.argmin([4, 3, 2, 1])).to.be.equal(3)
  })

  it("argmax should return the index of the highest value along an axis", () => {
    expect(array.argmax([1, 2, 3, 4])).to.be.equal(3)
    expect(array.argmax([4, 3, 2, 1])).to.be.equal(0)
  })

  it("should support resize() function", () => {
    expect(array.resize([1, 2, 3], 0, 0)).to.be.equal([])
    expect(array.resize([1, 2, 3], 1, 0)).to.be.equal([1])
    expect(array.resize([1, 2, 3], 2, 0)).to.be.equal([1, 2])
    expect(array.resize([1, 2, 3], 3, 0)).to.be.equal([1, 2, 3])
    expect(array.resize([1, 2, 3], 4, 0)).to.be.equal([1, 2, 3, 0])
    expect(array.resize([1, 2, 3], 5, 0)).to.be.equal([1, 2, 3, 0, 0])
    expect(array.resize([1, 2, 3], 5, null)).to.be.equal([1, 2, 3, null, null])
    expect(array.resize([1, 2, 3], 5)).to.be.equal((() => {
      const array = new Array(5)
      array[0] = 1
      array[1] = 2
      array[2] = 3
      return array
    })())
  })
})
