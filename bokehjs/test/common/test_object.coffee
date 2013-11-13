
define [
  "backbone",
  "common/has_properties",
], (Backbone, HasProperties) ->

  class TestObject extends HasProperties
    type: 'TestObject'

  class TestObjects extends Backbone.Collection
    model: TestObject
    url: "/"

  return {
    "Model": TestObject,
    "Collection": new TestObjects(),
  }