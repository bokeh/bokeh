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

  describe("URL replacements", () => {
    it("should handle fieldnames with spaces", () => {
      const source = new ColumnDataSource({data: {"foo bar": ["baz"]}})
      source.selected.indices = [0]
      const cb = new OpenURL({url: "http://stuff.com/@{foo bar}.html"})
      const navigate_spy = sinon.spy(cb, "navigate")
      cb.execute(undefined, {source})
      expect(navigate_spy.calledOnce).to.be.true
      expect(navigate_spy.args[0]).to.be.equal(["http://stuff.com/baz.html"])
    })

    it("should escape spaces", () => {
      const source = new ColumnDataSource({data: {foo: ["bar baz/index.html"]}})
      source.selected.indices = [0]
      const cb = new OpenURL({url: "http://stuff.com/@foo"})
      const navigate_spy = sinon.spy(cb, "navigate")
      cb.execute(undefined, {source})
      expect(navigate_spy.calledOnce).to.be.true
      expect(navigate_spy.args[0]).to.be.equal(["http://stuff.com/bar%20baz/index.html"])
    })

    it("should not escape slashes", () => {
      const source = new ColumnDataSource({data: {foo: ["bar/baz/index.html"]}})
      source.selected.indices = [0]
      const cb = new OpenURL({url: "http://stuff.com/@foo"})
      const navigate_spy = sinon.spy(cb, "navigate")
      cb.execute(undefined, {source})
      expect(navigate_spy.calledOnce).to.be.true
      expect(navigate_spy.args[0]).to.be.equal(["http://stuff.com/bar/baz/index.html"])
    })

    it("should not escape anchors", () => {
      const source = new ColumnDataSource({data: {foo: ["index.html#foo"]}})
      source.selected.indices = [0]
      const cb = new OpenURL({url: "http://stuff.com/@foo"})
      const navigate_spy = sinon.spy(cb, "navigate")
      cb.execute(undefined, {source})
      expect(navigate_spy.calledOnce).to.be.true
      expect(navigate_spy.args[0]).to.be.equal(["http://stuff.com/index.html#foo"])
    })

    it("should not escape request args", () => {
      const source = new ColumnDataSource({data: {foo: ["index.html?name=ferret&color=purple"]}})
      source.selected.indices = [0]
      const cb = new OpenURL({url: "http://stuff.com/@foo"})
      const navigate_spy = sinon.spy(cb, "navigate")
      cb.execute(undefined, {source})
      expect(navigate_spy.calledOnce).to.be.true
      expect(navigate_spy.args[0]).to.be.equal(["http://stuff.com/index.html?name=ferret&color=purple"])
    })
  })

  describe("Selection handling", () => {
    it("should should not navigate for empty selection", () => {
      const source = new ColumnDataSource({data: {foo: ["bar", "baz", "quux"]}})
      source.selected.indices = []
      const cb = new OpenURL({url: "http://@foo.com"})
      const navigate_spy = sinon.spy(cb, "navigate")
      cb.execute(undefined, {source})
      expect(navigate_spy.called).to.be.false
    })

    it("should should navigate for every selection index", () => {
      const source = new ColumnDataSource({data: {foo: ["bar", "baz", "quux"]}})
      source.selected.indices = [0, 2]
      const cb = new OpenURL({url: "http://@foo.com"})
      const navigate_spy = sinon.spy(cb, "navigate")
      cb.execute(undefined, {source})
      expect(navigate_spy.calledTwice).to.be.true
      expect(navigate_spy.args[0]).to.be.equal(["http://bar.com"])
      expect(navigate_spy.args[1]).to.be.equal(["http://quux.com"])
    })
  })
})
