_ = require "underscore"
base = require "../common/base"
Logging = require "../common/logging"
FactorRange = require "../range/factor_range"
Range1d = require "../range/range1d"
ColumnDataSource = require "../source/column_data_source"
helpers = "./helpers"

Collections = base.Collections
logger = Logging.logger

_get_num_minor_ticks = (axis_type, num_minor_ticks) ->
  if not num_minor_ticks?
    return 0

  if _.isNumber(num_minor_ticks)
    if num_minor_ticks <= 1
      logger.error("num_minor_ticks must be > 1")
      num_minor_ticks = 0
    return num_minor_ticks

  if num_minor_ticks == 'auto'
    if axis_type? == "Log"
      return 10
    return 5

  logger.error("unrecognized num_minor_ticks: #{num_minor_ticks}")
  return 0

_get_axis_type = (axis_type, range) ->
  if not axis_type?
    return null

  if axis_type == "auto"
    if range instanceof FactorRange.Model
      return Collections("CategoricalAxis")

    else if range instanceof Range1d.Model
      try
        new Date.parse(range.get('start'))
        return Collections("DatetimeAxis")
      catch e
        "pass"

      return Collections("LinearAxis")

  try
    return Collections(axis_type + "Axis")
  catch e
    logger.error("unrecognized axis_type: #{axis_type}")
    return null

_get_range = (range) ->
  if not range?
    return Collections("DataRange1d").create()

  # TODO: (bev) accept existing ranges
  # if range instanceof Range.Model
  #   return range

  if _.isArray(range)
    if _.every(range, _.isString)
      return Collections("FactorRange").create(factors: range)

    if range.length == 2 and _.every(range, _.isNumber)
      return Collections("Range1d").create({start: range[0], end: range[1]})

  logger.error("Unrecognized range input: #{range.toJSON}")
  return null

_get_sources = (sources, glyph_source) ->
  if glyph_source instanceof ColumnDataSource.Model
    return glyph_source

  if _.isString(glyph_source)
    return sources[glyph_source]

  return Collections("ColumnDataSource").create({data: glyph_source})

_process_annotations = (annotations) ->
  annotation_objs = []

  return annotation_objs

_process_tools = (tools, plot) ->
  tool_objs = []

  for tool in tools
    if _.isString(tool)
      tool_type = tool + "Tool"
      tool_args = {plot: plot}
    else
      tool_type = tool.type + "Tool"
      tool_args = _.omit(tool, "type")
    try
      tool_obj = Collections(tool_type).create(tool_args)
      tool_objs.push(tool_obj)
    catch e
      logger.error("unrecognized tool: #{tool}")

  return tool_objs

_process_glyphs = (glyphs, sources) ->
  renderers = []

  for glyph in glyphs

    glyph_type = glyph.type

    source = _get_sources(sources, glyph.source)

    glyph_args = _.omit(glyph, 'source', 'selection', 'inspection', 'nonselection')
    glyph_obj = Collections(glyph_type).create(glyph_args)

    renderer_args = {
      data_source: source
      glyph: glyph_obj
    }

    for x in ['selection', 'inspection', 'nonselection']
      if glyph[x]?
        # TODO: (bev) accept existing glyphs
        # TODO: (bev) accept glyph mod functions
        if glyph[x].type?
          x_args = _.omit(glyph[x], 'type')
          x_obj = Collections(glyph[x].type).create(x_args)
        else
          x_obj = _.clone(glyph_obj)
          x_obj.set(glyph[x])
        renderer_args[x] = x_obj

    renderer = Collections("GlyphRenderer").create(renderer_args)

    renderers.push(renderer)

  return renderers

_process_guides = (guides, plot) ->
  guide_objs = []

  for guide in guides

    location = guide.location
    if location == "below" or location == "above"
      dim = 0
      range = plot.get('x_range')
    else if location == "left" or location == "right"
      dim = 1
      range = plot.get('y_range')
    else
      logger.error("unrecognized axis location: #{location}")
      continue

    axis_type = _get_axis_type(guide.type, range)

    axis_args = _.omit(guide, 'type', 'grid')
    axis_args['plot'] = plot
    axis = axis_type.create(axis_args)

    guide_objs.push(axis)

    if guide.grid == true
      grid = Collections("Grid").create(
        dimension: dim
        plot: plot
        ticker: axis.get('ticker')
      )
      guide_objs.push(grid)

  return guide_objs

make_plot = (options) ->

  # handle shared ranges
  options.x_range = _get_range(options.x_range)
  options.y_range = _get_range(options.y_range)

  plot = Collections('Plot').create(options)

  return plot

make_sources = (data) ->
  source_objs = {}

  for key, value of data
    source_objs[key] = Collections("ColumnDataSource").create({data: value})

  return source_objs

add_glyphs = (plot, sources, glyphs) ->
  glyphs = _process_glyphs(glyphs, sources)
  plot.add_renderers(glyphs)

add_guides = (plot, guides) ->
  guides = _process_guides(guides, plot)

  for guide in guides
    location = guide.get('location')
    if location?
      loc = plot.get(location)
      loc.push(guide)
      plot.set(location, loc)

  plot.add_renderers(guides)

add_annotations = (plot, annotations) ->
  annotations = _process_annotations(annotations)
  plot.add_renderers(annotations)

add_tools = (plot, tools) ->
  tools = _process_tools(tools, plot)
  for tool in tools
    tool.set('plot', plot)
  plot.set_obj('tools', tools)

  # TODO: (bev) these should happen automatically
  plot.get('tool_manager').set_obj('tools', tools)
  plot.get('tool_manager')._init_tools()

figure = ({options, sources, glyphs, guides, annotations, tools}) ->
  options ?= {}
  sources ?= {}
  glyphs ?= []
  guides ?= []
  annotations ?= {}
  tools ?= []

  plot = make_plot(options)

  sources = make_sources(sources)

  add_glyphs(plot, sources, glyphs)
  add_guides(plot, guides)
  add_annotations(plot, annotations)
  add_tools(plot, tools)

  return plot

module.exports = figure
