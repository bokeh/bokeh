
define [
  "underscore",
  "backbone",
  "./server_data_source"
], (_, Backbone, ServerDataSource) ->

  class Resample extends ServerDataSource
    type: 'Resample'

    initialize : (attrs, options) =>
      super(attrs, options)
      @callbacks = {}
    
  class Resamples extends Backbone.Collection
    model: Resample
  return {
    "Model": Resample,
    "Collection": new Resamples()
  }
