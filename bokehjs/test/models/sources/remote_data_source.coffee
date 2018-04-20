{expect} = require "chai"
utils = require "../../utils"

sinon = require 'sinon'

{RemoteDataSource} = utils.require("models/sources/remote_data_source")

describe "ajax_data_source module", ->

  describe "RemoteDataSource", ->

    describe "get_column method", ->

      it "should return empty lists for not-yet-existant columns", ->
        s = new RemoteDataSource({data_url: "http://foo.com"})
        c = s.get_column("foo")
        expect(c).to.be.deep.equal []
