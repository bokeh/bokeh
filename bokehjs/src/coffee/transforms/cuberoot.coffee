Collection = require "../common/collection"
Transform = require "./transform"

class Cuberoot extends Transform
  type: "Cuberoot"

class Cuberoots extends Collection
  model: Cuberoot

module.exports =
  Model: Cuberoot
  Collection: new Cuberoots()