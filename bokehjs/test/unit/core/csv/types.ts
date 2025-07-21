import {expect} from "assertions"

import {stringify} from "@bokehjs/core/csv"

describe("core/csv", () => {

  describe("cast defaults", () => {

    it("should map date to ISO string", () => {
      const datetime = new Date()
      const data = stringify([[datetime]])
      expect(data).to.be.equal(datetime.toISOString() + "\n")
    })

    it("should map true boolean value to 'true'", () => {
      const data = stringify([[true]])
      expect(data).to.be.equal("true\n")
    })

    it("should map object to its json representation", () => {
      const data = stringify([[{ a: 1 }]])
      expect(data).to.be.equal('"{""a"":1}"\n')
    })
  })
})
