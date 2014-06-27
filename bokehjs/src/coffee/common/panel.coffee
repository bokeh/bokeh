
define [
  "underscore",
  "backbone",
  "kiwi",
  "./has_properties"
  "range/range1d",
], (_, Backbone, kiwi, HasProperties, Range1d) ->

  class Panel extends HasProperties
    type: 'Panel'

    initialize: (attrs, options) ->
      super(attrs, options)

      @top = @mget('top').var ? new kiwi.Variable()
      @bottom = @mget('bottom').var ? new kiwi.Variable()
      @left = @mget('left').var ? new kiwi.Variable()
      @right = @mget('right').var ? new kiwi.Variable()

      @h_range = new Range1d.Model({
        start: @left.value(),
        end:   @left.value() + @width.value()
      })
      @register_property('h_range',
        () ->
            @h_range.set('start', @left.value)
            @h_range.set('end', @left.value() + @width.value())
            return @h_range
        , true)
      @add_dependencies('h_range', this, ['extra_contraints'])

      @v_range = new Range1d.Model({
        start: @get('bottom'),
        end:   @get('bottom') + @get('height')
      })
      @register_property('v_range',
        () ->
            @v_range.set('start', @get('bottom'))
            @v_range.set('end', @get('bottom') + @get('height'))
            return @v_range
        , true)
      @add_dependencies('v_range', this, ['extra_contraints'])

    defaults: () ->
      return {
        extra_contraints: []
        top: new kiwi.Variable()

      }

  class Panels extends Backbone.Collection
    model: Panel

  return {
    "Model": Panel,
    "Collection": new Panels(),
  }
