import {expect} from "assertions"

import sinon from "sinon"

import {OpenURL} from "@bokehjs/models/callbacks/open_url"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("OpenURL", () => {
  describe("default creation", () => {
    const cb = new OpenURL()

    it("should have default url", () => {
      expect(cb.url).to.be.equal("http://")
    })
  })
  describe("URL escaping", () => {
    it("should properly escape urls with slashes", () => {
      const source = new ColumnDataSource({data: {foo: ["bar"]}})
      source.selected.indices = [0]
      const cb = new OpenURL({url: "http://@foo.com"})
      const raise_spy = sinon.spy(cb, "raise")
      cb.execute(undefined, {source})
      expect(raise_spy.calledOnce).to.be.true
      expect(raise_spy.args[0]).to.be.equal(["http://bar.com"])
    })
  })
})
