define [
  "underscore",
  "backbone",
  "common/has_properties",
], (_, Backbone, HasProperties) ->
  class Count extends HasProperties 
    type: 'Count'
    
    initialize : (attrs, options) =>
      super(attrs, options)
      @callbacks = {}


  class Counts extends Backbone.Collection
    model: Count 
  return {
    "Model": Count,
    "Collection": new Counts()
  }
