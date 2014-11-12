define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class Seq extends HasProperties
    type: "Seq"

  class Seqs extends Collection
    model: Seq

  return {
    Model: Seq
    Collection: new Seqs()
  }
