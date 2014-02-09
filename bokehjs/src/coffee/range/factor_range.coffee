

define [
  "backbone",
  "common/has_properties"
], (Backbone, HasProperties) ->

  class FactorRange extends HasProperties
    type: 'FactorRange'
    initialize: (attrs, options) ->
      super(attrs, options)
      @register_property('start',
          () -> @get('values')[0]
        , true)
      @add_dependencies('start', this, ['values'])
      @register_property('end',
          () -> @get('values')[@get('values').length-1]
        , true)
      @add_dependencies('end', this, ['values'])
      @register_property('min',
          () -> @get('start')
        , true)
      @add_dependencies('min', this, ['start'])
      @register_property('max',
          () -> @get('end')
        , true)
      @add_dependencies('max', this, ['end'])

    defaults: () ->
      return {
        values: []
      }

  class FactorRanges extends Backbone.Collection
    model: FactorRange

  return {
    "Model": FactorRange,
    "Collection": new FactorRanges()
  }