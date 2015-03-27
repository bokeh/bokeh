
define [
  "underscore",
  "common/collection",
  "common/has_parent",
], (_, Collection, HasParent) ->

  class TestParent extends HasParent
      type : 'TestParent',
      parent_properties : ['testprop'],
      display_defaults : ->
        _.extend {}, super(), {
          testprop : 'defaulttestprop'
        }

  class TestParents extends Collection
      model : TestParent

  return {
    "Model": TestParent,
    "Collection": new TestParents(),
  }
