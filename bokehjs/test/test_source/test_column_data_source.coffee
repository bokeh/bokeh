_ = require "underscore"
{expect} = require "chai"
utils = require "../utils"

base = utils.require "common/base"
{Collections} = base

describe "column_data_source module", ->

  describe "default creation", ->
    r = Collections('ColumnDataSource').create()

    it "should have empty data", ->
      expect(r.get("data")).to.be.deep.equal {}

    it "should have empty columns", ->
      expect(r.columns()).to.be.deep.equal []

    it "should return null for get_length", ->
      expect(r.get_length()).to.be.null

  describe "single column added", ->
    r = Collections('ColumnDataSource').create({data: {foo: []}})

    it "should return supplied data", ->
      expect(r.get("data")).to.be.deep.equal {foo: []}

    it "should return one column", ->
      expect(r.columns()).to.be.deep.equal ["foo"]

  describe "single column added", ->
    r = Collections('ColumnDataSource').create({data: {foo: [], bar:[]}})

    it "should return supplied data", ->
      expect(r.get("data")).to.be.deep.equal {foo: [], bar: []}

    it "should return all columns", ->
      expect((r.columns()).sort()).to.be.deep.equal ["bar", "foo"]

  describe "get_length function", ->

    it "should return 0 for empty columns", ->
      r = Collections('ColumnDataSource').create({data: {foo: []}})
      expect(r.get_length()).to.be.equal 0

      r = Collections('ColumnDataSource').create({data: {foo: [], bar:[]}})
      expect(r.get_length()).to.be.equal 0

    it "should return common length for columns with data", ->
      r = Collections('ColumnDataSource').create({data: {foo: [10]}})
      expect(r.get_length()).to.be.equal 1

      r = Collections('ColumnDataSource').create({data: {foo: [10], bar:[10]}})
      expect(r.get_length()).to.be.equal 1

      r = Collections('ColumnDataSource').create({data: {foo: [10, 20], bar:[10, 20]}})
      expect(r.get_length()).to.be.equal 2

    it "should raise an error if column lengths are inconsistent"


