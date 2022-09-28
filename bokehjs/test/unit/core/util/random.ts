import {expect} from "assertions"
import {Random} from "@bokehjs/core/util/random"

describe("core/util/random module", () => {

  describe("should support Random class", () => {

    it("which should implement integer() method", () => {
      const r = new Random(1)
      expect(r.integer()).to.be.equal(48271)
    })

    it("which should implement float() method", () => {
      const r = new Random(1)
      expect(r.float()).to.be.similar(0.00002247747035927835)
    })

    it("which should implement floats(n) method", () => {
      const r = new Random(1)
      expect(r.floats(5)).to.be.similar([
        0.00002247747035927835,
        0.0850324487174232,
        0.6013526051317831,
        0.8916112770248309,
        0.9679557019546216,
      ])
    })

    it("which should implement choices(n, #k) method", () => {
      const r = new Random(1)
      expect(r.choices(5, ["a", "b", "c"])).to.be.equal(["b", "a", "a", "b", "b"])
    })

    it("which should implement normal(mu, sigma, n) method", () => {
      const r = new Random(1)
      expect(r.normals(0.5, 0.7, 5)).to.be.equal(new Float64Array([
        3.2873170562402954,
        2.149181843948364,
        1.048491869094823,
        0.05552389012360631,
        0.5660909167051453,
      ]))
    })
  })
})
