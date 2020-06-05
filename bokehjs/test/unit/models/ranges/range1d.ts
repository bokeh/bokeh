import {expect} from "assertions"

import {Range1d} from "@bokehjs/models/ranges/range1d"

describe("range1d module", () => {

  describe("default creation", () => {
    const r = new Range1d()

    it("should have start = 0", () => {
      expect(r.start).to.be.equal(0)
    })

    it("should have end = 1", () => {
      expect(r.end).to.be.equal(1)
    })

    it("should have min = 0", () => {
      expect(r.min).to.be.equal(0)
    })

    it("should have max = 1", () => {
      expect(r.max).to.be.equal(1)
    })
  })

  describe("update start, less than end", () => {
    const r = new Range1d()
    r.start = -1

    it("should have min = -1", () => {
      expect(r.min).to.be.equal(-1)
    })

    it("should have max = 1", () => {
      expect(r.max).to.be.equal(1)
    })
  })

  describe("update start, greater than end", () => {
    const r = new Range1d()
    r.start = 2

    it("should have min = 1", () => {
      expect(r.min).to.be.equal(1)
    })

    it("should have max = 2", () => {
      expect(r.max).to.be.equal(2)
    })
  })

  describe("update end, greater than start", () => {
    const r = new Range1d()
    r.end = 2

    it("should have min = 0", () => {
      expect(r.min).to.be.equal(0)
    })

    it("should have max = 2", () => {
      expect(r.max).to.be.equal(2)
    })
  })

  describe("update end, less than start", () => {
    const r = new Range1d()
    r.end = -1.1

    it("should have min = -1.1", () => {
      expect(r.min).to.be.equal(-1.1)
    })

    it("should have max = 0", () => {
      expect(r.max).to.be.equal(0)
    })
  })

  describe("update both, positive", () => {
    const r = new Range1d()
    r.end = 1.1
    r.start = 2.1

    it("should have min = 1.1", () => {
      expect(r.min).to.be.equal(1.1)
    })

    it("should have max = 2.1", () => {
      expect(r.max).to.be.equal(2.1)
    })
  })

  describe("update both, negative", () => {
    const r = new Range1d()
    r.end = -1.1
    r.start = -2.1

    it("should have min = -2.1", () => {
      expect(r.min).to.be.equal(-2.1)
    })

    it("should have max = -1.1", () => {
      expect(r.max).to.be.equal(-1.1)
    })
  })

  it("should not be reversed", () => {
    const r = new Range1d({start: 10, end: 20})
    expect(r.is_reversed).to.be.false
  })

  it("should be reversed", () => {
    const r = new Range1d({start: 20, end: 10})
    expect(r.is_reversed).to.be.true
  })

  describe("reset", () => {

    it("should reset to initial values", () => {
      const r = new Range1d({start: 10, end: 20})
      r.end = -1.1
      r.start = -2.1
      r.reset()
      expect(r.start).to.be.equal(10)
      expect(r.end).to.be.equal(20)
    })

    it("should reset to explicit reset values", () => {
      const r = new Range1d({start: 10, end: 20, reset_start: 1, reset_end: 21})
      r.end = -1.1
      r.start = -2.1
      r.reset()
      expect(r.start).to.be.equal(1)
      expect(r.end).to.be.equal(21)
    })

    it("should reset to overridden reset values", () => {
      const r = new Range1d({start: 10, end: 20})
      r.end = -1.1
      r.start = -2.1
      r.reset_start = -2.2
      r.reset_end = -1.2
      r.reset()
      expect(r.start).to.be.equal(-2.2)
      expect(r.end).to.be.equal(-1.2)
    })
  })

  describe("changing model attribute", () => {

  })
})
