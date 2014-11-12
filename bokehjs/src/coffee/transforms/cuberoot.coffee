define [
  "common/collection",
  "./transform",
], (Collection, Transform) ->

  class Cuberoot extends Transform
    type: "Cuberoot"

  class Cuberoots extends Collection
    model: Cuberoot

  return {
    Model: Cuberoot
    Collection: new Cuberoots()
  }
