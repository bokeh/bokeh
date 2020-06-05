import {expect} from "assertions"

import * as sinon from 'sinon'

import {CustomJS} from "@bokehjs/models/callbacks/customjs"
import {AjaxDataSource} from "@bokehjs/models/sources/ajax_data_source"
import {Data} from "@bokehjs/core/types"
import {last} from "@bokehjs/core/util/array"

describe("ajax_data_source module", () => {

  describe("AjaxDataSource", () => {
    let requests: sinon.SinonFakeXMLHttpRequest[]
    let xhr: sinon.SinonFakeXMLHttpRequestStatic

    before_each(() => {
      requests = []
      xhr = sinon.useFakeXMLHttpRequest()
      xhr.onCreate = (xhr) => requests.push(xhr)
    })

    after_each(() => {
      xhr.restore()
    })

    describe("do_load method", () => {

      it("should replace", () => {
        const s = new AjaxDataSource({data_url: "http://foo.com"})
        expect(s.data).to.be.equal({})

        const xhr0 = s.prepare_request()
        last(requests).respond(200, {}, '{"foo": [10, 20], "bar": [1, 2]}')
        s.do_load(xhr0, "replace", 10)
        expect(s.data).to.be.equal({foo: [10, 20], bar: [1, 2]})

        const xhr1 = s.prepare_request()
        last(requests).respond(200, {}, '{"foo": [100, 200], "bar": [1.1, 2.2]}')
        s.do_load(xhr1, "replace", 10)
        expect(s.data).to.be.equal({foo: [100, 200], bar: [1.1, 2.2]})

        // max size ignored when replacing
        const xhr2 = s.prepare_request()
        last(requests).respond(200, {}, '{"foo": [1000, 2000], "bar": [10.1, 20.2]}')
        s.do_load(xhr2, "replace", 1)
        expect(s.data).to.be.equal({foo: [1000, 2000], bar: [10.1, 20.2]})
      })

      it("should append up to max_size", () => {
        const s = new AjaxDataSource({data_url: "http://foo.com"})
        expect(s.data).to.be.equal({})

        const xhr0 = s.prepare_request()
        last(requests).respond(200, {}, '{"foo": [10, 20], "bar": [1, 2]}')
        s.do_load(xhr0, "append", 3)
        expect(s.data).to.be.equal({foo: [10, 20], bar: [1, 2]})

        const xhr1 = s.prepare_request()
        last(requests).respond(200, {}, '{"foo": [100, 200], "bar": [1.1, 2.2]}')
        s.do_load(xhr1, "append", 3)
        expect(s.data).to.be.equal({foo: [20, 100, 200], bar: [2, 1.1, 2.2]})
      })

      it("should use a CustomJS adapter", () => {
        const code = `
          const result = {foo: [], bar: []}
          const pts = cb_data.response.points
          for (var i = 0; i < pts.length; i++) {
            result.foo.push(pts[i][0])
            result.bar.push(pts[i][1])
          }
          return result
        `
        const cb = new CustomJS({code})
        const s = new AjaxDataSource({data_url: "http://foo.com", adapter: cb as any}) // XXX
        expect(s.data).to.be.equal({})

        const xhr = s.prepare_request()
        last(requests).respond(200, {}, '{"points": [[10, 1], [20, 2]]}')
        s.do_load(xhr, "replace", 10)
        expect(s.data).to.be.equal({foo: [10, 20], bar: [1, 2]})
      })

      it("should use a JavaScript function adapter", () => {
        function execute(_cb_obj: AjaxDataSource, cb_data: {response: {points: [number, number][]}}): Data {
          const foo: number[] = []
          const bar: number[] = []
          for (const pt of cb_data.response.points) {
            foo.push(pt[0])
            bar.push(pt[1])
          }
          return {foo, bar}
        }

        const s = new AjaxDataSource({data_url: "http://foo.com", adapter: {execute}})
        expect(s.data).to.be.equal({})

        const xhr = s.prepare_request()
        last(requests).respond(200, {}, '{"points": [[10, 1], [20, 2]]}')
        s.do_load(xhr, "replace", 10)
        expect(s.data).to.be.equal({foo: [10, 20], bar: [1, 2]})
      })
    })

    describe("prepare_request method", () => {

      it("should return an xhr with withCredentials = False", () => {
        const s = new AjaxDataSource({data_url: "http://foo.com"})
        const xhr = s.prepare_request()
        expect(xhr).to.be.instanceof(XMLHttpRequest)
        expect(xhr.withCredentials).to.be.false
      })

      it("should return an xhr with method set from this.method", () => {
        const s0 = new AjaxDataSource({data_url: "http://foo.com"})
        s0.prepare_request()
        expect(last(requests).method).to.be.equal('POST')

        const s1 = new AjaxDataSource({data_url: "http://foo.com", method: "POST"})
        s1.prepare_request()
        expect(last(requests).method).to.be.equal('POST')

        const s2 = new AjaxDataSource({data_url: "http://foo.com", method: "GET"})
        s2.prepare_request()
        expect(last(requests).method).to.be.equal('GET')
      })

      it("should return an xhr with Content-Type header set to json", () => {
        const s = new AjaxDataSource({data_url: "http://foo.com"})
        s.prepare_request()
        expect(last(requests).requestHeaders).to.be.equal({"Content-Type": "application/json"})
      })

      it("should return an xhr with additional headers set from this.http_headers", () => {
        const s = new AjaxDataSource({data_url: "http://foo.com", http_headers: {foo: "bar", baz: "10"}})
        s.prepare_request()
        expect(last(requests).requestHeaders).to.be.equal({"Content-Type": "application/json", foo: "bar", baz: "10"})
      })
    })

    describe("get_column method", () => {

      it("should return empty lists for not-yet-existant columns", () => {
        const s = new AjaxDataSource({data_url: "http://foo.com"})
        const c = s.get_column("foo")
        expect(c).to.be.equal([])
      })
    })

    describe("initialize method", () => {

      it("should call get_data", () => {
        const s = new AjaxDataSource({data_url: "http://foo.com"})
        const spy = sinon.spy(s, "get_data")
        s.initialize()
        expect(spy.calledOnce).to.be.true
      })
    })
  })
})
