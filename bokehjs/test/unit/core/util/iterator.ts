import {expect} from "assertions"

import {reverse, enumerate, join, interleave, map, flat_map, every, some, combinations, subsets} from "@bokehjs/core/util/iterator"

describe("core/util/iterator module", () => {
  it("implements reverse() function", () => {
    expect([...reverse([])]).to.be.equal([])
    expect([...reverse([10, "d", "e", 3, 17, "a"])]).to.be.equal(["a", 17, 3, "e", "d", 10])
  })

  it("implements enumerate() function", () => {
    expect([...enumerate([])]).to.be.equal([])
    expect([...enumerate(["a"])]).to.be.equal([["a", 0]])
    expect([...enumerate(["a", "b"])]).to.be.equal([["a", 0], ["b", 1]])
    expect([...enumerate(["a", "b", "c"])]).to.be.equal([["a", 0], ["b", 1], ["c", 2]])
  })

  it("implements join() function", () => {
    expect([...join([])]).to.be.equal([])
    expect([...join([[1, 2, 3], [4, 5, 6]])]).to.be.equal([1, 2, 3, 4, 5, 6])
    expect([...join([[1, 2, 3], [4, 5, 6], [7, 8, 9]])]).to.be.equal([1, 2, 3, 4, 5, 6, 7, 8, 9])

    expect([...join([], () => 0)]).to.be.equal([])
    expect([...join([[1, 2, 3], [4, 5, 6]], () => 0)]).to.be.equal([1, 2, 3, 0, 4, 5, 6])
    expect([...join([[1, 2, 3], [4, 5, 6], [7, 8, 9]], () => 0)]).to.be.equal([1, 2, 3, 0, 4, 5, 6, 0, 7, 8, 9])
  })

  it("implements interleave() function", () => {
    expect([...interleave([], () => 10)]).to.be.equal([])
    expect([...interleave([1, 2, 3], () => 10)]).to.be.equal([1, 10, 2, 10, 3])
  })

  it("implements map() function", () => {
    expect([...map([], (k) => 10*k)]).to.be.equal([])
    expect([...map([1, 2, 3], (k) => 10*k)]).to.be.equal([10, 20, 30])
  })

  it("implements flat_map() function", () => {
    const r0 = flat_map([1, 2, 3], (k) => Array(k).fill(k))
    expect([...r0]).to.be.equal([1, 2, 2, 3, 3, 3])

    const r1 = flat_map([1, 2, 3], function* (k) { yield* Array(k).fill(k) })
    expect([...r1]).to.be.equal([1, 2, 2, 3, 3, 3])
  })

  it("implements some() function", () => {
    expect(some([], (v) => v == 0)).to.be.false
    expect(some([1, 2, 3], (v) => v == 0)).to.be.false
    expect(some([1, 2, 3], (v) => v == 1)).to.be.true
    expect(some([1, 2, 3], (v) => v == 3)).to.be.true
  })

  it("implements every() function", () => {
    expect(every([], (v) => v == 0)).to.be.true
    expect(every([0, 0, 0], (v) => v == 0)).to.be.true
    expect(every([1, 0, 0], (v) => v == 0)).to.be.false
    expect(every([0, 0, 1], (v) => v == 0)).to.be.false
  })

  it("implements combinations() function", () => {
    expect([...combinations([1, 2, 3], 0)]).to.be.equal([[]])
    expect([...combinations([1, 2, 3], 1)]).to.be.equal([[1], [2], [3]])
    expect([...combinations([1, 2, 3], 2)]).to.be.equal([[1, 2], [1, 3], [2, 3]])
    expect([...combinations([1, 2, 3], 3)]).to.be.equal([[1, 2, 3]])
  })

  it("implements subsets() function", () => {
    expect([...subsets([1, 2, 3])]).to.be.equal([
      [],
      [1], [2], [3],
      [1, 2], [1, 3], [2, 3],
      [1, 2, 3],
    ])
  })
})
