define [
  "underscore",
  "backbone",
  "source/server_data_source"
], (_, Backbone, ServerDataSource) ->

  class Resample extends ServerDataSource 
    type: 'Resample'
    
  class Resamples extends Backbone.Collection
    model: Resample 
  return {
    "Model": Resample,
    "Collection": new Resamples()
  }
