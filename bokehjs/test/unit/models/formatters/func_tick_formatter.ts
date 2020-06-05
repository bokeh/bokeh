import {expect} from "assertions"

import {FuncTickFormatter} from "@bokehjs/models/formatters/func_tick_formatter"
import {Range1d} from "@bokehjs/models/ranges/range1d"

describe("func_tick_formatter module", () => {

  describe("FuncTickFormatter._make_func method", () => {
    const formatter = new FuncTickFormatter({code: "return 10"})

    it("should return a Function", () => {
      expect(formatter._make_func()).to.be.instanceof(Function)
    })

    it("should have code property as function body", () => {
      const func = new Function("tick", "index", "ticks", "'use strict';\nreturn 10")
      expect(formatter._make_func().toString()).to.be.equal(func.toString())
    })

    it("should have values as function args", () => {
      const rng = new Range1d()
      formatter.args = {foo: rng.ref()}
      const func = new Function("tick", "index", "ticks", "foo", "'use strict';\nreturn 10")
      expect(formatter._make_func().toString()).to.be.equal(func.toString())
    })
  })

  describe("doFormat method", () => {
    it("should format numerical ticks appropriately", () => {
      const formatter = new FuncTickFormatter({code: "return tick.toFixed(2)"})
      const labels = formatter.doFormat([-10, -0.1, 0, 0.1, 10], {loc: 0})
      expect(labels).to.be.equal(["-10.00", "-0.10", "0.00", "0.10", "10.00"])
    })

    /* XXX: this won't compile, because doFormat doesn't accept strings
    it("should format categorical ticks appropriately", () => {
      const formatter = new FuncTickFormatter({code: "return tick + '_lat'"})
      const labels = formatter.doFormat(["a", "b", "c", "d", "e"], {loc: 0})
      expect(labels).to.be.equal(["a_lat", "b_lat", "c_lat", "d_lat", "e_lat"])
    })
    */

    it("should handle args appropriately", () => {
      const rng = new Range1d({start: 5, end: 10})
      const formatter = new FuncTickFormatter({
        code: "return (foo.start + foo.end + tick).toFixed(2)",
        args: {foo: rng},
      })
      const labels = formatter.doFormat([-10, -0.1, 0, 0.1, 10], {loc: 0})
      expect(labels).to.be.equal(["5.00", "14.90", "15.00", "15.10", "25.00"])
    })

    it("should handle array of ticks", () => {
      const formatter = new FuncTickFormatter({
        code: "this.k = this.k || (ticks.length > 3 ? 10 : 100); return (tick * this.k).toFixed(2)",
      })
      const labels0 = formatter.doFormat([-10, -0.1, 0, 0.1, 10], {loc: 0})
      expect(labels0).to.be.equal(["-100.00", "-1.00", "0.00", "1.00", "100.00"])
      const labels1 = formatter.doFormat([-0.1, 0, 0.1], {loc: 0})
      expect(labels1).to.be.equal(["-10.00", "0.00", "10.00"])
    })
  })
})
