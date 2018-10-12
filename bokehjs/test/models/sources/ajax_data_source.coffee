{expect} = require "chai"

sinon = require 'sinon'

{CustomJS} = require("models/callbacks/customjs")
{AjaxDataSource} = require("models/sources/ajax_data_source")

describe "ajax_data_source module", ->

  describe "AjaxDataSource", ->

    beforeEach ->
      global.XMLHttpRequest = sinon.useFakeXMLHttpRequest();
      requests = this.requests = [];

      global.XMLHttpRequest.onCreate = (xhr) ->
        requests.push(xhr)

    afterEach ->
      global.XMLHttpRequest.restore()

    describe "do_load method", ->

      it "should replace", ->
        s = new AjaxDataSource({data_url: "http://foo.com"})
        expect(s.data).to.be.deep.equal {}

        xhr = s.prepare_request()
        xhr.respond(200, {}, '{"foo": [10, 20], "bar": [1, 2]}')
        s.do_load(xhr, "replace", 10)
        expect(s.data).to.be.deep.equal {"foo": [10, 20], "bar": [1, 2]}

        xhr = s.prepare_request()
        xhr.respond(200, {}, '{"foo": [100, 200], "bar": [1.1, 2.2]}')
        s.do_load(xhr, "replace", 10)
        expect(s.data).to.be.deep.equal {"foo": [100, 200], "bar": [1.1, 2.2]}

        # max size ignored when replacing
        xhr = s.prepare_request()
        xhr.respond(200, {}, '{"foo": [1000, 2000], "bar": [10.1, 20.2]}')
        s.do_load(xhr, "replace", 1)
        expect(s.data).to.be.deep.equal {"foo": [1000, 2000], "bar": [10.1, 20.2]}

      it "should append up to max_size", ->
        s = new AjaxDataSource({data_url: "http://foo.com"})
        expect(s.data).to.be.deep.equal {}

        xhr = s.prepare_request()
        xhr.respond(200, {}, '{"foo": [10, 20], "bar": [1, 2]}')
        s.do_load(xhr, "append", 3)
        expect(s.data).to.be.deep.equal {"foo": [10, 20], "bar": [1, 2]}

        xhr = s.prepare_request()
        xhr.respond(200, {}, '{"foo": [100, 200], "bar": [1.1, 2.2]}')
        s.do_load(xhr, "append", 3)
        expect(s.data).to.be.deep.equal {"foo": [20, 100, 200], "bar": [2, 1.1, 2.2]}

      it "should use a CustomJS adapter", ->
        code = """
        const result = {foo: [], bar: []}
        const pts = cb_data.response.points
        for (i=0; i<pts.length; i++) {
            result.foo.push(pts[i][0])
            result.bar.push(pts[i][1])
        }
        return result
        """
        cb = new CustomJS({code: code})
        s = new AjaxDataSource({data_url: "http://foo.com", adapter: cb})
        expect(s.data).to.be.deep.equal {}

        xhr = s.prepare_request()
        xhr.respond(200, {}, '{"points": [[10, 1], [20, 2]]}')
        s.do_load(xhr, "replace", 10)
        expect(s.data).to.be.deep.equal {"foo": [10, 20], "bar": [1, 2]}

      it "should use a JavaScript function adapter", ->
        func = (cb_obj, cb_data) ->
          result = {foo: [], bar: []}
          for pt in cb_data.response.points
            result.foo.push(pt[0])
            result.bar.push(pt[1])
          return result

        s = new AjaxDataSource({data_url: "http://foo.com", adapter: func})
        expect(s.data).to.be.deep.equal {}

        xhr = s.prepare_request()
        xhr.respond(200, {}, '{"points": [[10, 1], [20, 2]]}')
        s.do_load(xhr, "replace", 10)
        expect(s.data).to.be.deep.equal {"foo": [10, 20], "bar": [1, 2]}


    describe "prepare_request method", ->

      it "should return an xhr with withCredentials = False", ->
        s = new AjaxDataSource({data_url: "http://foo.com"})
        xhr = s.prepare_request()
        expect(xhr).to.be.instanceof XMLHttpRequest
        expect(xhr.withCredentials).to.be.false

      it "should return an xhr with method set from this.method", ->
        s = new AjaxDataSource({data_url: "http://foo.com"})
        xhr = s.prepare_request()
        expect(xhr.method).to.be.equal 'POST'

        s = new AjaxDataSource({data_url: "http://foo.com", method: "POST"})
        xhr = s.prepare_request()
        expect(xhr.method).to.be.equal 'POST'

        s = new AjaxDataSource({data_url: "http://foo.com", method: "GET"})
        xhr = s.prepare_request()
        expect(xhr.method).to.be.equal 'GET'

      it "should return an xhr with Content-Type header set to json", ->
        s = new AjaxDataSource({data_url: "http://foo.com"})
        xhr = s.prepare_request()
        expect(xhr.requestHeaders).to.be.deep.equal {"Content-Type": "application/json"}

      it "should return an xhr with additional headers set from this.http_headers", ->
        s = new AjaxDataSource({data_url: "http://foo.com", http_headers: {foo: "bar", baz: 10}})
        xhr = s.prepare_request()
        expect(xhr.requestHeaders).to.be.deep.equal {"Content-Type": "application/json", foo: "bar", baz: 10}

    describe "get_column method", ->

      it "should return empty lists for not-yet-existant columns", ->
        s = new AjaxDataSource({data_url: "http://foo.com"})
        c = s.get_column("foo")
        expect(c).to.be.deep.equal []

    describe "initialize method", ->

      it "should set the source to initialized", ->
        s = new AjaxDataSource({data_url: "http://foo.com"})
        expect(s.initialized).to.be.false
        s.initialize()
        expect(s.initialized).to.be.true

      it "should call get_data", ->
        s = new AjaxDataSource({data_url: "http://foo.com"})
        sinon.spy(s, "get_data")
        s.initialize()
        expect(s.get_data.calledOnce).to.be.true
