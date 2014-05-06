define [
  "underscore",
  "backbone",
  "common/has_properties",
], (_, Backbone, HasProperties) ->
  class Cuberoot extends HasProperties 
    type: 'Cuberoot'
    
    initialize : (attrs, options) =>
      super(attrs, options)
      @callbacks = {}


  class Cuberoots extends Backbone.Collection
    model: Cuberoot 
  return {
    "Model": Cuberoot,
    "Collection": new Cuberoots()
  }
