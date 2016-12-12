import * as _ from "underscore"

import {DataRange} from "./data_range"
import {logger} from "../../core/logging"
import * as p from "../../core/properties"
import * as bbox from "../../core/util/bbox"

export class DataRange1d extends DataRange
  type: 'DataRange1d'

  @define {
      start:           [ p.Number        ]
      end:             [ p.Number        ]
      range_padding:   [ p.Number, 0.1   ]
      flipped:         [ p.Bool,   false ]
      follow:          [ p.String        ] # TODO (bev)
      follow_interval: [ p.Number        ]
      default_span:    [ p.Number, 2     ]
      bounds:          [ p.Any           ] # TODO (bev)
      min_interval: [ p.Any ]
      max_interval: [ p.Any ]
    }

  initialize: (attrs, options) ->
    super(attrs, options)

    @plot_bounds = {}

    @have_updated_interactively = false
    @_initial_start = @start
    @_initial_end = @end
    @_initial_range_padding = @range_padding
    @_initial_follow = @follow
    @_initial_follow_interval = @follow_interval
    @_initial_default_span = @default_span
    @_mapper_type = "auto"

  @getters {
    min: () -> Math.min(@start, @end)
    max: () -> Math.max(@start, @end)
  }

  computed_renderers: () ->
    # TODO (bev) check that renderers actually configured with this range
    names = @names
    renderers = @renderers

    if renderers.length == 0
      for plot in @plots
        all_renderers = plot.renderers
        rs = (r for r in all_renderers when r.type == "GlyphRenderer")
        renderers = renderers.concat(rs)

    if names.length > 0
      renderers = (r for r in renderers when names.indexOf(r.name) >= 0)

    logger.debug("computed #{renderers.length} renderers for DataRange1d #{@id}")
    for r in renderers
      logger.trace(" - #{r.type} #{r.id}")

    return renderers

  _compute_plot_bounds: (renderers, bounds) ->
    result = bbox.empty()

    for r in renderers
      if bounds[r.id]?
        result = bbox.union(result, bounds[r.id])

    return result

  _compute_min_max: (plot_bounds, dimension) ->
    overall = bbox.empty()
    for k, v of plot_bounds
      overall = bbox.union(overall, v)

    if dimension == 0
      [min, max] = [overall.minX, overall.maxX]
    else
      [min, max] = [overall.minY, overall.maxY]

    return [min, max]

  _compute_range: (min, max) ->
    range_padding = @range_padding
    if range_padding? and range_padding > 0

      if @_mapper_type == "log"
        log_min = Math.log(min) / Math.log(10)
        log_max = Math.log(max) / Math.log(10)
        if max == min
          span = @default_span + 0.001
        else
          span = (log_max-log_min)*(1+range_padding)
        center = (log_min+log_max) / 2.0
        [start, end] = [Math.pow(10, center-span / 2.0), Math.pow(10, center+span / 2.0)]

      else
        if max == min
          span = @default_span
        else
          span = (max-min)*(1+range_padding)
        center = (max+min) / 2.0
        [start, end] = [center-span / 2.0, center+span / 2.0]

    else
      [start, end] = [min, max]

    follow_sign = +1
    if @flipped
      [start, end] = [end, start]
      follow_sign = -1

    follow_interval = @follow_interval
    if follow_interval? and Math.abs(start-end) > follow_interval
      if @follow == 'start'
        end = start + follow_sign*follow_interval
      else if @follow == 'end'
        start = end - follow_sign*follow_interval

    return [start, end]

  update: (bounds, dimension, bounds_id) ->
    if @have_updated_interactively
      return

    renderers = @computed_renderers()

    # update the raw data bounds for all renderers we care about
    @plot_bounds[bounds_id] = @_compute_plot_bounds(renderers, bounds)

    # compute the min/mix for our specified dimension
    [min, max] = @_compute_min_max(@plot_bounds, dimension)

    # derive start, end from bounds and data range config
    [start, end] = @_compute_range(min, max)

    if @_initial_start?
      if @_mapper_type == "log"
        if @_initial_start > 0
          start = @_initial_start
      else
        start = @_initial_start
    if @_initial_end?
      if @_mapper_type == "log"
        if @_initial_end > 0
          end = @_initial_end
      else
        end = @_initial_end

    # only trigger updates when there are changes
    [_start, _end] = [@start, @end]
    if start != _start or end != _end
      new_range = {}
      if start != _start
        new_range.start = start
      if end != _end
        new_range.end = end
      @setv(new_range)

    if @bounds == 'auto'
      @setv({bounds: [start, end]}, {silent: true})

    @trigger('change')

  reset: () ->
    @have_updated_interactively = false
    @setv({
      range_padding: @_initial_range_padding
      follow: @_initial_follow
      follow_interval: @_initial_follow_interval
      default_span: @_initial_default_span
    }, {silent: true})
    @trigger('change')
