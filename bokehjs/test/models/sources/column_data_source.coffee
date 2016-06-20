_ = require "underscore"

{expect} = require "chai"
utils = require "../../utils"

ColumnDataSource = utils.require("models/sources/column_data_source").Model

describe "column_data_source module", ->

  describe "default creation", ->
    r = new ColumnDataSource()

    it "should have empty data", ->
      expect(r.get("data")).to.be.deep.equal {}

    it "should have empty columns", ->
      expect(r.columns()).to.be.deep.equal []

    it "should return null for get_length", ->
      expect(r.get_length()).to.be.null

  describe "single column added", ->
    r = new ColumnDataSource({data: {foo: []}})

    it "should return supplied data", ->
      expect(r.get("data")).to.be.deep.equal {foo: []}

    it "should return one column", ->
      expect(r.columns()).to.be.deep.equal ["foo"]

  describe "single column added", ->
    r = new ColumnDataSource({data: {foo: [], bar:[]}})

    it "should return supplied data", ->
      expect(r.get("data")).to.be.deep.equal {foo: [], bar: []}

    it "should return all columns", ->
      expect((r.columns()).sort()).to.be.deep.equal ["bar", "foo"]

  describe "get_length function", ->

    it "should return 0 for empty columns", ->
      r = new ColumnDataSource({data: {foo: []}})
      expect(r.get_length()).to.be.equal 0

      r = new ColumnDataSource({data: {foo: [], bar:[]}})
      expect(r.get_length()).to.be.equal 0

    it "should return common length for columns with data", ->
      r = new ColumnDataSource({data: {foo: [10]}})
      expect(r.get_length()).to.be.equal 1

      r = new ColumnDataSource({data: {foo: [10], bar:[10]}})
      expect(r.get_length()).to.be.equal 1

      r = new ColumnDataSource({data: {foo: [10, 20], bar:[10, 20]}})
      expect(r.get_length()).to.be.equal 2

    it "should raise an error if column lengths are inconsistent"
