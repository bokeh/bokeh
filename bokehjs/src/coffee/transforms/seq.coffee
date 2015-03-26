Collection = require "../common/collection"
Transform = require "./transform"

class Seq extends Transform
  type: "Seq"

class Seqs extends Collection
  model: Seq

module.exports =
  Model: Seq
  Collection: new Seqs()