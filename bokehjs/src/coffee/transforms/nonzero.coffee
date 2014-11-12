define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class NonZero extends HasProperties
    type: "NonZero"

  class NonZeros extends Collection
    model: NonZero

  return {
    "Model": NonZero
    "Collection": new NonZeros()
  }
