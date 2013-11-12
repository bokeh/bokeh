
define [
  "backbone",
  "common/has_parent",
], (Backbone, HasParent) ->

  class TestParent extends HasParent
      type : 'TestParent',
      parent_properties : ['testprop'],
      display_defaults :
        testprop : 'defaulttestprop'

  class TestParents extends Backbone.Collection
      model : TestParent

  return {
    "Model": TestParent,
    "Collection": new TestParents(),
  }