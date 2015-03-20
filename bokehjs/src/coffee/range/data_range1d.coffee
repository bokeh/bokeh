define [
  "underscore"
  "common/bbox"
  "common/collection"
  "common/logging"
  "range/range1d"
], (_, bbox, Collection, Logging, Range1d) ->

  logger = Logging.logger

  class DataRange1d extends Range1d.Model
    type: 'DataRange1d'

    _get_start: () ->
      return @get('_start') ? @get('_auto_start')

    _set_start: (start) ->
      @set('_start', start)

    _get_end: () ->
      return @get('_end') ? @get('_auto_end')

    _set_end: (end) ->
      @set('_end', end)

    _get_auto_ranging: () ->
      return not get('_start') and not get('_end')

    initialize: (attrs, options) ->
      @register_property('start', @_get_start, true)
      @register_setter('start', @_set_start)
      @add_dependencies('start', this, [
        '_start', 'flipped', '_auto_start', 'range_padding', 'default_span'
      ])

      @register_property('end', @_get_end, true)
      @register_setter('end', @_set_end)
      @add_dependencies('end', this, [
        '_end', 'flipped', '_auto_end', 'range_padding', 'default_span'
      ])

      @register_property('auto_ranging', @_get_auto_ranging, true)
      @add_dependencies('start', this, ['_start', '_end'])

      super(attrs, options)

      @plot_bounds = {}

    update: (bounds, dimension, plot_view) ->
      # TODO (bev)
      # check that renderers actually configured with this range
      renderers = @get('renderers')

      all_renderers = []
      if renderers.length == 0
        for plot in @get('plots')
          rs = plot.get('renderers')
          rs = (r for r in rs when r.type == "GlyphRenderer")
          all_renderers = all_renderers.concat(rs)
        renderers = all_renderers

      @set('renderers', renderers)

      result = new bbox.empty()
      for r in @get('renderers')
        if bounds[r.id]?
          result = bbox.extend(result, bounds[r.id])

      @plot_bounds[plot_view.model.id] = result

      overall = new bbox.empty()
      for k, v of @plot_bounds
        overall = bbox.extend(overall, v)

      [min, max] = overall[dimension]

      if max != min
        span = (max-min)*(1+@get('range_padding'))
      else
        span = @get('default_span')

      center = (max+min)/2.0

      sgn = 1
      if @get('flipped')
        sgn = -1

      @set('_auto_start', center-sgn*span/2.0)
      @set('_auto_end', center+sgn*span/2.0)

    defaults: ->
      return _.extend {}, super(), {
        plots: []
        sources: []
        range_padding: 0.1
        default_span: 2
        flipped: false
      }

  class DataRange1ds extends Collection
    model: DataRange1d

  return {
    "Model": DataRange1d,
    "Collection": new DataRange1ds()
  }
