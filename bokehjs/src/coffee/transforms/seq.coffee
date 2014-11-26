define [
  "common/collection",
  "./transform",
], (Collection, Transform) ->

  class Seq extends Transform
    type: "Seq"

  class Seqs extends Collection
    model: Seq

  return {
    Model: Seq
    Collection: new Seqs()
  }
