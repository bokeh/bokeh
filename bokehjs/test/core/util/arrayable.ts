import {expect} from "chai"
import * as arrayable from "core/util/arrayable"

describe("core/util/arrayable module", () => {

  it("support splice() function with Array type", () => {
    const arr0 = [101, 102, 103, 104]
    const ret0 = arrayable.splice(arr0, 2, 0, 201)
    expect(ret0).to.be.deep.equal([101, 102, 201, 103, 104])

    const arr1 = [101, 102, 103, 104, 105]
    const ret1 = arrayable.splice(arr1, 3, 1)
    expect(ret1).to.be.deep.equal([101, 102, 103, 105])

    const arr2 = [101, 102, 103, 104]
    const ret2 = arrayable.splice(arr2, 2, 1, 201)
    expect(ret2).to.be.deep.equal([101, 102, 201, 104])

    const arr3 = [101, 102, 103, 104]
    const ret3 = arrayable.splice(arr3, 0, 2, 201, 202, 203)
    expect(ret3).to.be.deep.equal([201, 202, 203, 103, 104])

    const arr4 = [101, 102, 103, 104, 105]
    const ret4 = arrayable.splice(arr4, arr4.length - 3, 2)
    expect(ret4).to.be.deep.equal([101, 102, 105])

    const arr5 = [101, 102, 103, 104]
    const ret5 = arrayable.splice(arr5, -2, 1)
    expect(ret5).to.be.deep.equal([101, 102, 104])

    const arr6 = [101, 102, 103, 104]
    const ret6 = arrayable.splice(arr6, 2)
    expect(ret6).to.be.deep.equal([101, 102])
  })

  it("support splice() function with Float64Array type", () => {
    const arr0 = Float64Array.of(101, 102, 103, 104)
    const ret0 = arrayable.splice(arr0, 2, 0, 201)
    expect(ret0).to.be.instanceof(Float64Array)
    expect(ret0).to.be.deep.equal(Float64Array.of(101, 102, 201, 103, 104))

    const arr1 = Float64Array.of(101, 102, 103, 104, 105)
    const ret1 = arrayable.splice(arr1, 3, 1)
    expect(ret1).to.be.instanceof(Float64Array)
    expect(ret1).to.be.deep.equal(Float64Array.of(101, 102, 103, 105))

    const arr2 = Float64Array.of(101, 102, 103, 104)
    const ret2 = arrayable.splice(arr2, 2, 1, 201)
    expect(ret2).to.be.instanceof(Float64Array)
    expect(ret2).to.be.deep.equal(Float64Array.of(101, 102, 201, 104))

    const arr3 = Float64Array.of(101, 102, 103, 104)
    const ret3 = arrayable.splice(arr3, 0, 2, 201, 202, 203)
    expect(ret3).to.be.instanceof(Float64Array)
    expect(ret3).to.be.deep.equal(Float64Array.of(201, 202, 203, 103, 104))

    const arr4 = Float64Array.of(101, 102, 103, 104, 105)
    const ret4 = arrayable.splice(arr4, arr4.length - 3, 2)
    expect(ret4).to.be.instanceof(Float64Array)
    expect(ret4).to.be.deep.equal(Float64Array.of(101, 102, 105))

    const arr5 = Float64Array.of(101, 102, 103, 104)
    const ret5 = arrayable.splice(arr5, -2, 1)
    expect(ret5).to.be.instanceof(Float64Array)
    expect(ret5).to.be.deep.equal(Float64Array.of(101, 102, 104))

    const arr6 = Float64Array.of(101, 102, 103, 104)
    const ret6 = arrayable.splice(arr6, 2)
    expect(ret6).to.be.instanceof(Float64Array)
    expect(ret6).to.be.deep.equal(Float64Array.of(101, 102))
  })
})
