{expect} = require "chai"
utils = require "../../utils"

LegendItem = utils.require("models/annotations/legend_item")

describe "LegendItem", ->

  describe "get_field_from_label_prop", ->

    it "should return undefined if label property is null", ->
      legend_item = new LegendItem({'label': null})
      field = legend_item.get_field_from_legend_item_label_prop()
      expect(field).to.be.undefined

    it "should return undefined if label property is value", ->
      legend_item = new LegendItem({'label': {'value': 'milk'}})
      field = legend_item.get_field_from_legend_item_label_prop()
      expect(field).to.be.undefined

    it "should return field if label property is field", ->
      legend_item = new LegendItem({'label': {'field': 'milk'}})
      field = legend_item.get_field_from_legend_item_label_prop()
      expect(field).to.be.equal 'milk'

  describe "get_labels_list_from_label_prop", ->

    it "should return labels if field is valid", ->
      legend_item = new LegendItem({'label': {'field': 'label'}})
      field = legend_item.get_labels_from_legend_item_label_prop()
      expect(field).to.be.deep.equal ['foo', 'bar']

    it "should return 'Invalid field' list if field is not valid", ->
      legend_item = new LegendItem({'label': {'field': 'milk'}})
      field = legend_item.get_labels_from_legend_item_label_prop()
      expect(field).to.be.deep.equal ['Invalid field']

    it "should return value in single list if label is value", ->
      legend_item = new LegendItem({'label': {'value': 'milk'}})
      field = legend_item.get_labels_from_legend_item_label_prop()
      expect(field).to.be.deep.equal ['milk']

    it "should return empty list if label is null", ->
      legend_item = new LegendItem({'label': null})
      field = legend_item.get_labels_from_legend_item_label_prop()
      expect(field).to.be.deep.equal []
