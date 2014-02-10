
define [
  "backbone",
  "common/has_properties"
], (Backbone, HasProperties) ->

  class FactorRange extends HasProperties
    type: 'FactorRange'
    initialize: (attrs, options) ->
      super(attrs, options)
      @register_property('start',
          () -> @get('factors')[0]
        , true)
      @add_dependencies('start', this, ['factors'])
      @register_property('end',
          () -> @get('factors')[@get('factors').length-1]
        , true)
      @add_dependencies('end', this, ['factors'])
      @register_property('min',
          () -> @get('start')
        , true)
      @add_dependencies('min', this, ['factors'])
      @register_property('max',
          () -> @get('end')
        , true)
      @add_dependencies('max', this, ['factors'])

    defaults: () ->
      return {
        factors: []
      }

  class FactorRanges extends Backbone.Collection
    model: FactorRange

  return {
    "Model": FactorRange,
    "Collection": new FactorRanges()
  }