define [
  "underscore",
  "backbone",
  "common/has_properties",
], (_, Backbone, HasProperties) ->
  class Const extends HasProperties 
    type: 'Const'
    
    initialize : (attrs, options) =>
      super(attrs, options)
      @callbacks = {}


  class Consts extends Backbone.Collection
    model: Const 
  return {
    "Model": Const,
    "Collection": new Consts()
  }
