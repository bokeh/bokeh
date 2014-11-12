define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class Transform extends HasProperties
    type: "Transform"

  class Transforms extends Collection
    model: Transform

  return {
    Model: Transform
    Collection: new Transforms()
  }
