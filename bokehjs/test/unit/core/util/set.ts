import {expect} from "assertions"
import {union, intersection, difference} from "@bokehjs/core/util/set"

describe("core/util/set module", () => {

  it("should implement union() function", () => {
    expect(union(new Set([1, 2, 3]))).to.be.equal(new Set([1, 2, 3]))
    expect(union(new Set([1, 2, 3]), new Set([1, 2, 3]))).to.be.equal(new Set([1, 2, 3]))
    expect(union(new Set([1, 2, 3]), new Set([1, 3, 4, 5]))).to.be.equal(new Set([1, 2, 3, 4, 5]))
  })

  it("should implement intersection() function", () => {
    expect(intersection(new Set([1, 2, 3]))).to.be.equal(new Set([1, 2, 3]))
    expect(intersection(new Set([1, 2, 3]), new Set([1, 2, 3]))).to.be.equal(new Set([1, 2, 3]))
    expect(intersection(new Set([1, 2, 3]), new Set([1, 3, 4, 5]))).to.be.equal(new Set([1, 3]))
  })

  it("should implement difference() function", () => {
    expect(difference(new Set([1, 2, 3]))).to.be.equal(new Set([1, 2, 3]))
    expect(difference(new Set([1, 2, 3]), new Set([1, 2, 3]))).to.be.equal(new Set([]))
    expect(difference(new Set([1, 2, 3]), new Set([1, 3, 4, 5]))).to.be.equal(new Set([2]))
  })
})
