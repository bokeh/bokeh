_ = require "underscore"
bbox = require "../common/bbox"
{logger} = require "../common/logging"
DataRange = require "./data_range"

class DataRange1d extends DataRange.Model
  type: 'DataRange1d'

  initialize: (attrs, options) ->
    super(attrs, options)

    @register_property('min',
        () -> Math.min(@get('start'), @get('end'))
      , true)
    @add_dependencies('min', this, ['start', 'end'])

    @register_property('max',
        () -> Math.max(@get('start'), @get('end'))
      , true)
    @add_dependencies('max', this, ['start', 'end'])

    @register_property('computed_renderers',
        () -> @_compute_renderers()
      , true)
    @add_dependencies('computed_renderers', this, ['plots', 'renderers', 'names'])

    @plot_bounds = {}

    @_initial_start = @get('start')
    @_initial_end = @get('end')
    @_initial_range_padding = @get('range_padding')
    @_initial_follow = @get('follow')
    @_initial_follow_interval = @get('follow_interval')
    @_initial_default_span = @get('default_span')

  _compute_renderers: () ->
    # TODO (bev) check that renderers actually configured with this range
    names = @get('names')
    renderers = @get('renderers')

    if renderers.length == 0
      for plot in @get('plots')
        all_renderers = plot.get('renderers')
        rs = (r for r in all_renderers when r.type == "GlyphRenderer")
        renderers = renderers.concat(rs)

    if names.length > 0
      renderers = (r for r in renderers when names.indexOf(r.get('name')) >= 0)

    logger.debug("computed #{renderers.length} renderers for DataRange1d #{@id}")
    for r in renderers
      logger.trace(" - #{r.type} #{r.id}")

    return renderers

  _compute_plot_bounds: (renderers, bounds) ->
    result = new bbox.empty()

    for r in renderers
      if bounds[r.id]?
        result = bbox.extend(result, bounds[r.id])

    return result

  _compute_min_max: (plot_bounds, dimension) ->
    overall = new bbox.empty()
    for k, v of plot_bounds
      overall = bbox.extend(overall, v)

    [min, max] = overall[dimension]

    return [min, max]

  _compute_range: (min, max) ->
    range_padding = @get('range_padding')
    if range_padding? and range_padding > 0

      if max == min
        span = @get('default_span')
      else
        span = (max-min)*(1+range_padding)

      center = (max+min)/2.0
      [start, end] = [center-span/2.0, center+span/2.0]

    else
      [start, end] = [min, max]

    follow_sign = +1
    if @get('flipped')
      [start, end] = [end, start]
      follow_sign = -1

    follow_interval = @get('follow_interval')
    if follow_interval? and Math.abs(start-end) > follow_interval
      if @get('follow') == 'start'
        end = start + follow_sign*follow_interval
      else if @get('follow') == 'end'
        start = end - follow_sign*follow_interval

    return [start, end]

  update: (bounds, dimension, bounds_id) ->
    renderers = @get('computed_renderers')

    # update the raw data bounds for all renderers we care about
    @plot_bounds[bounds_id] = @_compute_plot_bounds(renderers, bounds)

    # compute the min/mix for our specified dimension
    [min, max] = @_compute_min_max(@plot_bounds, dimension)

    # derive start, end from bounds and data range config
    [start, end] = @_compute_range(min, max)

    if @_initial_start?
      start = @_initial_start
    if @_initial_end?
      end = @_initial_end

    # only trigger updates when there are changes
    [_start, _end] = [@get('start'), @get('end')]
    if start != _start or end != _end
      new_range = {}
      if start != _start
        new_range.start = start
      if end != _end
        new_range.end = end
      @set(new_range)

  reset: () ->
    @set({
      range_padding: @_initial_range_padding
      follow: @_initial_follow
      follow_interval: @_initial_follow_interval
      default_span: @_initial_default_span
    })

  nonserializable_attribute_names: () ->
    super().concat(['plots'])

  defaults: ->
    return _.extend {}, super(), {
      start: null
      end: null
      range_padding: 0.1
      flipped: false
      follow: null
      follow_interval: null
      default_span: 2
      plots: []
    }

module.exports =
  Model: DataRange1d
