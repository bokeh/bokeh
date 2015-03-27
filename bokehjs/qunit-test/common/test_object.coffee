
define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class TestObject extends HasProperties
    type: 'TestObject'

  class TestObjects extends Collection
    model: TestObject
    url: "/"

  return {
    "Model": TestObject,
    "Collection": new TestObjects(),
  }
