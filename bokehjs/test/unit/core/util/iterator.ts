import {expect} from "assertions"

import {enumerate, join, combinations, subsets} from "@bokehjs/core/util/iterator"

describe("core/util/iterator module", () => {
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
