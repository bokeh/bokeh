
define [
  "backbone",
  "common/has_properties"
], (Backbone, HasProperties) ->

  class FactorRange extends HasProperties
    type: 'FactorRange'
    initialize: (attrs, options) ->
      super(attrs, options)
      @register_property('end',
          () -> @get('factors').length + 0.5
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
        start: 0.5
        factors: []
      }

  class FactorRanges extends Backbone.Collection
    model: FactorRange

  return {
    "Model": FactorRange,
    "Collection": new FactorRanges()
  }