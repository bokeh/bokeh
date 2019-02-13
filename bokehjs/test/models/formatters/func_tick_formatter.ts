import {expect} from "chai"

import {FuncTickFormatter} from "models/formatters/func_tick_formatter"
import {Range1d} from "models/ranges/range1d"

describe("func_tick_formatter module", () => {

  describe("FuncTickFormatter._make_func method", () => {
    const formatter = new FuncTickFormatter({code: "return 10", use_strict: true})

    it("should return a Function", () => {
      expect(formatter._make_func()).to.be.an.instanceof(Function)
    })

    it("should have code property as function body", () => {
      const func = new Function("tick", "index", "ticks", "require", "exports", "'use strict';\nreturn 10")
      expect(formatter._make_func().toString()).to.be.equal(func.toString())
    })

    it("should have values as function args", () => {
      const rng = new Range1d()
      formatter.args = {foo: rng.ref()}
      const func = new Function("tick", "index", "ticks", "foo", "require", "exports", "'use strict';\nreturn 10")
      expect(formatter._make_func().toString()).to.be.equal(func.toString())
    })
  })

  describe("doFormat method", () => {
    it("should format numerical ticks appropriately", () => {
      const formatter = new FuncTickFormatter({code: "return tick * 10", use_strict: true})
      const labels = formatter.doFormat([-10, -0.1, 0, 0.1, 10], {loc: 0})
      expect(labels).to.deep.equal([-100, -1.0, 0, 1, 100])
    })

    /* XXX: this won't compile, because doFormat doesn't accept strings
    it("should format categorical ticks appropriately", () => {
      const formatter = new FuncTickFormatter({code: "return tick + '_lat'", use_strict: true})
      const labels = formatter.doFormat(["a", "b", "c", "d", "e"], {loc: 0})
      expect(labels).to.deep.equal(["a_lat", "b_lat", "c_lat", "d_lat", "e_lat"])
    })
    */

    it("should support imports using require", () => {
      const formatter = new FuncTickFormatter({
        code: "let {max} = require('../../core/util/array'); return max([1, 2, 3])",
        use_strict: true,
      })
      const labels = formatter.doFormat([0, 0, 0], {loc: 0})
      expect(labels).to.be.deep.equal([3,3,3])
    })

    it("should handle args appropriately", () => {
      const rng = new Range1d({start: 5, end: 10})
      const formatter = new FuncTickFormatter({
        code: "return foo.start + foo.end + tick",
        args: {foo: rng},
        use_strict: true,
      })
      const labels = formatter.doFormat([-10, -0.1, 0, 0.1, 10], {loc: 0})
      expect(labels).to.deep.equal([5, 14.9, 15, 15.1, 25])
    })

    it("should handle array of ticks", () => {
      const formatter = new FuncTickFormatter({
        code: "this.k = this.k || (ticks.length > 3 ? 10 : 100); return tick * this.k",
        use_strict: true,
      })
      const labels0 = formatter.doFormat([-10, -0.1, 0, 0.1, 10], {loc: 0})
      expect(labels0).to.deep.equal([-100, -1.0, 0, 1, 100])
      const labels1 = formatter.doFormat([-0.1, 0, 0.1], {loc: 0})
      expect(labels1).to.deep.equal([-10, 0, 10])
    })
  })
})
