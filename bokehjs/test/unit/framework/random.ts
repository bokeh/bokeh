import {expect} from "#framework/assertions"
import {SeededRandom} from "#framework/random"

describe("SeededRandom", () => {
  it("should reproduce the same sequence from the same seed", () => {
    const left = new SeededRandom(0x5eed)
    const right = new SeededRandom(0x5eed)
    expect(left.values(16)).to.be.equal(right.values(16))
  })

  it("should generate bounded integers", () => {
    const random = new SeededRandom(2026)
    const values = Array.from({length: 100}, () => random.int(7))
    expect(values.every((value) => value >= 0 && value < 7)).to.be.true
    expect(new Set(values).size).to.be.above(1)
  })
})
