_ = require "underscore"

{expect} = require "chai"
utils = require "../../utils"
{ stdoutTrap, stderrTrap } = require 'logtrap'

{ColumnDataSource} = utils.require("models/sources/column_data_source")

describe "column_data_source module", ->

  describe "default creation", ->
    r = new ColumnDataSource()

    it "should have empty data", ->
      expect(r.data).to.be.deep.equal {}

    it "should have empty columns", ->
      expect(r.columns()).to.be.deep.equal []

    it "should return null for get_length", ->
      expect(r.get_length()).to.be.null

  describe "single column added", ->
    r = new ColumnDataSource({data: {foo: []}})

    it "should return supplied data", ->
      expect(r.data).to.be.deep.equal {foo: []}

    it "should return one column", ->
      expect(r.columns()).to.be.deep.equal ["foo"]

  describe "single column added", ->
    r = new ColumnDataSource({data: {foo: [], bar:[]}})

    it "should return supplied data", ->
      expect(r.data).to.be.deep.equal {foo: [], bar: []}

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

    it "should not alert for consistent column lengths (including zero)", ->
      r = new ColumnDataSource({data: {foo: []}})
      out = stderrTrap -> r.get_length()
      expect(out).to.be.equal ""

      r = new ColumnDataSource({data: {foo: [], bar:[]}})
      out = stderrTrap -> r.get_length()
      expect(out).to.be.equal ""

      r = new ColumnDataSource({data: {foo: [10]}})
      out = stderrTrap -> r.get_length()
      expect(out).to.be.equal ""

      r = new ColumnDataSource({data: {foo: [10], bar:[10]}})
      out = stderrTrap -> r.get_length()
      expect(out).to.be.equal ""

      r = new ColumnDataSource({data: {foo: [10, 20], bar:[10, 20]}})
      out = stderrTrap -> r.get_length()
      expect(out).to.be.equal ""

    it "should alert if column lengths are inconsistent", ->
      r = new ColumnDataSource({data: {foo: [1], bar: [1,2]}})
      out = stderrTrap -> r.get_length()
      expect(out).to.be.equal "[bokeh] data source has columns of inconsistent lengths\n"

      r = new ColumnDataSource({data: {foo: [1], bar: [1,2], baz: [1]}})
      out = stderrTrap -> r.get_length()
      expect(out).to.be.equal "[bokeh] data source has columns of inconsistent lengths\n"
