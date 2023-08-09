import * as arrayable from "@bokehjs/core/util/arrayable"
import {expect} from "assertions"

describe("core/util/arrayable module", () => {

  it("support splice() function with Array type", () => {
    const arr0 = [101, 102, 103, 104]
    const ret0 = arrayable.splice(arr0, 2, 0, 201)
    expect(ret0).to.be.equal([101, 102, 201, 103, 104])

    const arr1 = [101, 102, 103, 104, 105]
    const ret1 = arrayable.splice(arr1, 3, 1)
    expect(ret1).to.be.equal([101, 102, 103, 105])

    const arr2 = [101, 102, 103, 104]
    const ret2 = arrayable.splice(arr2, 2, 1, 201)
    expect(ret2).to.be.equal([101, 102, 201, 104])

    const arr3 = [101, 102, 103, 104]
    const ret3 = arrayable.splice(arr3, 0, 2, 201, 202, 203)
    expect(ret3).to.be.equal([201, 202, 203, 103, 104])

    const arr4 = [101, 102, 103, 104, 105]
    const ret4 = arrayable.splice(arr4, arr4.length - 3, 2)
    expect(ret4).to.be.equal([101, 102, 105])

    const arr5 = [101, 102, 103, 104]
    const ret5 = arrayable.splice(arr5, -2, 1)
    expect(ret5).to.be.equal([101, 102, 104])

    const arr6 = [101, 102, 103, 104]
    const ret6 = arrayable.splice(arr6, 2)
    expect(ret6).to.be.equal([101, 102])
  })

  it("support splice() function with Float32Array type", () => {
    const arr0 = Float32Array.of(101, 102, 103, 104)
    const ret0 = arrayable.splice(arr0, 2, 0, 201)
    expect(ret0).to.be.instanceof(Float32Array)
    expect(ret0).to.be.equal(Float32Array.of(101, 102, 201, 103, 104))

    const arr1 = Float32Array.of(101, 102, 103, 104, 105)
    const ret1 = arrayable.splice(arr1, 3, 1)
    expect(ret1).to.be.instanceof(Float32Array)
    expect(ret1).to.be.equal(Float32Array.of(101, 102, 103, 105))

    const arr2 = Float32Array.of(101, 102, 103, 104)
    const ret2 = arrayable.splice(arr2, 2, 1, 201)
    expect(ret2).to.be.instanceof(Float32Array)
    expect(ret2).to.be.equal(Float32Array.of(101, 102, 201, 104))

    const arr3 = Float32Array.of(101, 102, 103, 104)
    const ret3 = arrayable.splice(arr3, 0, 2, 201, 202, 203)
    expect(ret3).to.be.instanceof(Float32Array)
    expect(ret3).to.be.equal(Float32Array.of(201, 202, 203, 103, 104))

    const arr4 = Float32Array.of(101, 102, 103, 104, 105)
    const ret4 = arrayable.splice(arr4, arr4.length - 3, 2)
    expect(ret4).to.be.instanceof(Float32Array)
    expect(ret4).to.be.equal(Float32Array.of(101, 102, 105))

    const arr5 = Float32Array.of(101, 102, 103, 104)
    const ret5 = arrayable.splice(arr5, -2, 1)
    expect(ret5).to.be.instanceof(Float32Array)
    expect(ret5).to.be.equal(Float32Array.of(101, 102, 104))

    const arr6 = Float32Array.of(101, 102, 103, 104)
    const ret6 = arrayable.splice(arr6, 2)
    expect(ret6).to.be.instanceof(Float32Array)
    expect(ret6).to.be.equal(Float32Array.of(101, 102))
  })

  it("support head() function", () => {
    const arr0 = [1, 2, 3]

    const ret0 = arrayable.head(arr0, 0)
    expect(ret0).to.be.equal([])

    const ret1 = arrayable.head(arr0, 1)
    expect(ret1).to.be.equal([1])

    const ret2 = arrayable.head(arr0, 2)
    expect(ret2).to.be.equal([1, 2])

    const ret3 = arrayable.head(arr0, 3)
    expect(ret3).to.be.equal([1, 2, 3])

    const ret4 = arrayable.head(arr0, 4)
    expect(ret4).to.be.equal([1, 2, 3])

    const ret5 = arrayable.head(arr0, 5)
    expect(ret5).to.be.equal([1, 2, 3])
  })

  it("support filter() function", () => {
    const arr0 = [1, 2, 3, 4, 5, 6, 7]

    const ret0 = arrayable.filter(arr0, (i) => i % 2 == 0)
    expect(ret0).to.be.equal([2, 4, 6])

    const arr1 = Float32Array.from(arr0)

    const ret1 = arrayable.filter(arr1, (i) => i % 2 == 0)
    expect(ret1).to.be.equal(Float32Array.from([2, 4, 6]))
  })

  it("should support min() function", () => {
    expect(arrayable.min([])).to.be.equal(Infinity)
    expect(arrayable.min([NaN])).to.be.equal(Infinity)
    expect(arrayable.min([1, 2, 3])).to.be.equal(1)
    expect(arrayable.min([3, 2, 1])).to.be.equal(1)
    expect(arrayable.min([1, 2, NaN, 3])).to.be.equal(1)
    expect(arrayable.min([3, 2, NaN, 1])).to.be.equal(1)
  })

  it("should support max() function", () => {
    expect(arrayable.max([])).to.be.equal(-Infinity)
    expect(arrayable.max([NaN])).to.be.equal(-Infinity)
    expect(arrayable.max([1, 2, 3])).to.be.equal(3)
    expect(arrayable.max([3, 2, 1])).to.be.equal(3)
    expect(arrayable.max([1, 2, NaN, 3])).to.be.equal(3)
    expect(arrayable.max([3, 2, NaN, 1])).to.be.equal(3)
  })

  it("should support minmax() function", () => {
    expect(arrayable.minmax([])).to.be.equal([Infinity, -Infinity])
    expect(arrayable.minmax([NaN])).to.be.equal([Infinity, -Infinity])
    expect(arrayable.minmax([1, 2, 3])).to.be.equal([1, 3])
    expect(arrayable.minmax([3, 2, 1])).to.be.equal([1, 3])
    expect(arrayable.minmax([1, 2, NaN, 3])).to.be.equal([1, 3])
    expect(arrayable.minmax([3, 2, NaN, 1])).to.be.equal([1, 3])
  })

  it("should support left_edge_index() function", () => {
    expect(arrayable.left_edge_index(-100, [1, 2])).to.be.equal(-1)
    expect(arrayable.left_edge_index(0.999, [1, 2])).to.be.equal(-1)
    expect(arrayable.left_edge_index(1, [1, 2])).to.be.equal(0)
    expect(arrayable.left_edge_index(1.5, [1, 2])).to.be.equal(0)
    expect(arrayable.left_edge_index(2, [1, 2])).to.be.equal(0)
    expect(arrayable.left_edge_index(2.001, [1, 2])).to.be.equal(2)
    expect(arrayable.left_edge_index(100, [1, 2])).to.be.equal(2)

    expect(arrayable.left_edge_index(0.999, [1])).to.be.equal(-1)
    expect(arrayable.left_edge_index(1, [1])).to.be.equal(0)
    expect(arrayable.left_edge_index(1.001, [1])).to.be.equal(1)
  })

  it("should support interpolate() function", () => {
    const x = [1, 2, 4]
    const y = [-1, 0, 2]
    expect(arrayable.interpolate([], x, y)).to.be.equal([])
    expect(arrayable.interpolate([1, 2, 4], x, y)).to.be.equal([-1, 0, 2])
    expect(arrayable.interpolate([1.5, 2.5, 3, 3.5], x, y)).to.be.equal([-0.5, 0.5, 1, 1.5])
    expect(arrayable.interpolate([-100, 0.9, 4.1, 100], x, y)).to.be.equal([-1, -1, 2, 2])

    expect(arrayable.interpolate([], [1], [2])).to.be.equal([])
    expect(arrayable.interpolate([0.999, 1, 1.001], [1], [2])).to.be.equal([2, 2, 2])

    expect(arrayable.interpolate([], [], [])).to.be.equal([])
    expect(arrayable.interpolate([1], [], [])).to.be.equal([NaN])
  })

  it("should support subselect() function", () => {
    const a = [1, 2, 3, 4, 5, 6, undefined]
    const b = [1, 4, 5]
    expect(arrayable.subselect(a, b)).to.be.equal([2, 5, 6])
    const c = [0, 100]
    const d = [10, NaN]
    expect(arrayable.subselect(a, c)).to.be.equal([1, undefined])
    expect(arrayable.subselect(a, d)).to.be.equal([undefined, undefined])
  })

  it("should support insert() function", () => {
    expect(arrayable.insert([1, 2, 3], 4, 1)).to.be.equal([1, 4, 2, 3])
  })

  it("should support append() function", () => {
    expect(arrayable.append([1, 2, 3], 4)).to.be.equal([1, 2, 3, 4])
  })

  it("should support prepend() function", () => {
    expect(arrayable.prepend([1, 2, 3], 4)).to.be.equal([4, 1, 2, 3])
  })

  it("should support mul() function", () => {
    const a = [1, 2, 3]
    const b = [2, 4, 6]
    expect(arrayable.mul(a, 2)).to.be.equal(b)
  })

  it("should support map() function", () => {
    const a = [1, 2, 3]
    const b = [2, 4, 6]
    expect(arrayable.map(a, (num) => num * 2)).to.be.equal(b)
  })

  it("should support map() function with Float32Array", () => {
    const arr = Float32Array.of(1, 2, 3)
    const ret = arrayable.map(arr, (num) => num * 2)
    expect(ret).to.be.instanceof(Float32Array)
    expect(ret).to.be.equal(Float32Array.of(2, 4, 6))
  })

  it("should support sum() function", () => {
    expect(arrayable.sum([1, 2, 3, 4])).to.be.equal(10)
    expect(arrayable.sum([1, 2, 3, NaN])).to.be.equal(NaN)
  })

  it("should support some() function", () => {
    expect(arrayable.some([-1, 2, 6, 11], (num) => num % 2 === 0)).to.be.true
    expect(arrayable.some([1, 2, 3, 4], (num) => num > 5)).to.be.false
  })

  it("should support every() function", () => {
    expect(arrayable.every([1, 2, 3, 4], (num) => num > 0)).to.be.true
    expect(arrayable.every([-2, 1, 2, 3, 4], (num) => num > 0)).to.be.false
  })

  it("should support bisect_left() function", () => {
    expect(arrayable.bisect_left([], 20)).to.be.equal(0)
    expect(arrayable.bisect_left([10, 20, 30, 40], 20)).to.be.equal(1)
  })

  it("should support bisect_right() function", () => {
    expect(arrayable.bisect_right([], 20)).to.be.equal(0)
    expect(arrayable.bisect_right([10, 20, 30, 40], 20)).to.be.equal(2)
  })

  it("should support binary_search() function", () => {
    expect(arrayable.binary_search([], 20)).to.be.equal(null)
    expect(arrayable.binary_search([10, 20, 30, 40], 10)).to.be.equal(0)
    expect(arrayable.binary_search([10, 20, 30, 40], 20)).to.be.equal(1)
    expect(arrayable.binary_search([10, 20, 30, 40], 30)).to.be.equal(2)
    expect(arrayable.binary_search([10, 20, 30, 40], 40)).to.be.equal(3)
    expect(arrayable.binary_search([10, 20, 30, 40], 50)).to.be.equal(null)
  })
})
