define [
  "underscore",
  "backbone",
  "common/has_properties",
], (_, Backbone, HasProperties) ->
  class Interpolate extends HasProperties 
    type: 'Interpolate'
    
    initialize : (attrs, options) =>
      super(attrs, options)
      @callbacks = {}


  class Interpolates extends Backbone.Collection
    model: Interpolate 
  return {
    "Model": Interpolate,
    "Collection": new Interpolates()
  }
