import {expect} from "#framework/assertions"

import sinon from "sinon"

import {OpenURL} from "@bokehjs/models/callbacks/open_url"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {Float64NDArray} from "@bokehjs/core/util/ndarray"

describe("OpenURL", () => {
  let navigate_stub: sinon.SinonStub
  before_each(() => {
    navigate_stub = sinon.stub(OpenURL.prototype, "navigate")
    navigate_stub.returns(undefined)
  })

  after_each(() => {
    navigate_stub.restore()
  })

  describe("default creation", () => {
    const cb = OpenURL.create()
    it("should have default url", () => {
      expect(cb.url).to.be.equal("http://")
    })
  })

  describe("URL replacements", () => {
    it("should preserve large array values in URL placeholders", () => {
      const values = Array.from({length: 1000}, (_, i) => i)
      const source = ColumnDataSource.create({data: {values: [values]}})
      source.selected.indices = [0]
      OpenURL.create({url: "http://stuff.com/@values"}).execute(undefined, {source})
      expect(navigate_stub.args[0]).to.be.equal([`http://stuff.com/${values.join(",")}`])
    })

    it("should substitute the complete logical row from a shaped column", () => {
      const source = ColumnDataSource.create({data: {values: new Float64NDArray([0, 1, 2, 0, 2, 3], [2, 3])}})
      source.selected.indices = [1]
      const cb = OpenURL.create({url: "http://stuff.com/@values"})
      cb.execute(undefined, {source})
      expect(navigate_stub.calledOnce).to.be.true
      expect(navigate_stub.args[0]).to.be.equal(["http://stuff.com/0,2,3"])
    })

    it("should handle fieldnames with spaces", () => {
      const source = ColumnDataSource.create({data: {"foo bar": ["baz"]}})
      source.selected.indices = [0]
      const cb = OpenURL.create({url: "http://stuff.com/@{foo bar}.html"})
      cb.execute(undefined, {source})
      expect(navigate_stub.calledOnce).to.be.true
      expect(navigate_stub.args[0]).to.be.equal(["http://stuff.com/baz.html"])
    })

    it("should escape spaces", () => {
      const source = ColumnDataSource.create({data: {foo: ["bar baz/index.html"]}})
      source.selected.indices = [0]
      const cb = OpenURL.create({url: "http://stuff.com/@foo"})
      cb.execute(undefined, {source})
      expect(navigate_stub.calledOnce).to.be.true
      expect(navigate_stub.args[0]).to.be.equal(["http://stuff.com/bar%20baz/index.html"])
    })

    it("should not escape slashes", () => {
      const source = ColumnDataSource.create({data: {foo: ["bar/baz/index.html"]}})
      source.selected.indices = [0]
      const cb = OpenURL.create({url: "http://stuff.com/@foo"})
      cb.execute(undefined, {source})
      expect(navigate_stub.calledOnce).to.be.true
      expect(navigate_stub.args[0]).to.be.equal(["http://stuff.com/bar/baz/index.html"])
    })

    it("should not escape anchors", () => {
      const source = ColumnDataSource.create({data: {foo: ["index.html#foo"]}})
      source.selected.indices = [0]
      const cb = OpenURL.create({url: "http://stuff.com/@foo"})
      cb.execute(undefined, {source})
      expect(navigate_stub.calledOnce).to.be.true
      expect(navigate_stub.args[0]).to.be.equal(["http://stuff.com/index.html#foo"])
    })

    it("should not escape request args", () => {
      const source = ColumnDataSource.create({data: {foo: ["index.html?name=ferret&color=purple"]}})
      source.selected.indices = [0]
      const cb = OpenURL.create({url: "http://stuff.com/@foo"})
      cb.execute(undefined, {source})
      expect(navigate_stub.calledOnce).to.be.true
      expect(navigate_stub.args[0]).to.be.equal(["http://stuff.com/index.html?name=ferret&color=purple"])
    })
  })

  describe("Selection handling", () => {
    it("should should not navigate for empty selection", () => {
      const source = ColumnDataSource.create({data: {foo: ["bar", "baz", "quux"]}})
      source.selected.indices = []
      const cb = OpenURL.create({url: "http://@foo.com"})
      cb.execute(undefined, {source})
      expect(navigate_stub.called).to.be.false
    })

    it("should should navigate for every selection index", () => {
      const source = ColumnDataSource.create({data: {foo: ["bar", "baz", "quux"]}})
      source.selected.indices = [0, 2]
      const cb = OpenURL.create({url: "http://@foo.com"})
      cb.execute(undefined, {source})
      expect(navigate_stub.calledTwice).to.be.true
      expect(navigate_stub.args[0]).to.be.equal(["http://bar.com"])
      expect(navigate_stub.args[1]).to.be.equal(["http://quux.com"])
    })
  })
})
