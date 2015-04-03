_ = require "underscore"
{logger} = require "../../common/logging"
HasParent = require "../../common/has_parent"
Collection = require "../../common/collection"
PlotWidget = require "../../common/plot_widget"
FactorRange = require "../../range/factor_range"
RemoteDataSource = require "../../source/remote_data_source"

class GlyphRendererView extends PlotWidget

  initialize: (options) ->
    super(options)

    # XXX: this will be slow (see later in this file), perhaps reuse @glyph.
    @glyph = @build_glyph(@mget("glyph"))

    selection_glyph = @mget("selection_glyph")
    if not selection_glyph?
      selection_glyph = @mget("glyph").clone()
      selection_glyph.set(@model.selection_defaults, {silent: true})
    @selection_glyph = @build_glyph(selection_glyph)

    nonselection_glyph = @mget("nonselection_glyph")
    if not nonselection_glyph?
      nonselection_glyph = @mget("glyph").clone()
      nonselection_glyph.set(@model.nonselection_defaults, {silent: true})
    @nonselection_glyph = @build_glyph(nonselection_glyph)

    @xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    @ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]

    @set_data(false)

    if @mget('data_source') instanceof RemoteDataSource.RemoteDataSource
      @mget('data_source').setup(@plot_view, @glyph)

  build_glyph: (model) ->
    new model.default_view({model: model, renderer: this})

  bind_bokeh_events: () ->
    @listenTo(@model, 'change', @request_render)
    @listenTo(@mget('data_source'), 'change', @set_data)
    @listenTo(@mget('data_source'), 'select', @request_render)

  have_selection_glyphs: () -> true

  #TODO: There are glyph sub-type-vs-resample_op concordance issues...
  setup_server_data: () ->

  set_data: (request_render=true) ->
    t0 = Date.now()
    source = @mget('data_source')

    @glyph.set_data(source)
    @selection_glyph.set_data(source)
    @nonselection_glyph.set_data(source)

    length = source.get_length()
    length = 1 if not length?
    @all_indices = [0...length]

    dt = Date.now() - t0
    logger.debug("#{@glyph.model.type} glyph (#{@glyph.model.id}): set_data finished in #{dt}ms")

    @set_data_timestamp = Date.now()

    if request_render
      @request_render()

  render: () ->
    @glyph.map_data()
    @selection_glyph.map_data()
    @nonselection_glyph.map_data()

    indices = @glyph._mask_data(@all_indices)

    ctx = @plot_view.canvas_view.ctx
    ctx.save()

    selected = @mget('data_source').get('selected')
    if not selected?.length > 0
      selected = []

    t0 = Date.now()

    if not (selected.length and @have_selection_glyphs())
      @glyph.render(ctx, indices)
    else
      # reset the selection mask
      selected_mask = (i in selected for i in @all_indices)

      # intersect/different selection with render mask
      selected = new Array()
      nonselected = new Array()
      for i in indices
        if selected_mask[i]
          selected.push(i)
        else
          nonselected.push(i)

      @nonselection_glyph.render(ctx, nonselected)
      @selection_glyph.render(ctx, selected)

    dt = Date.now() - t0
    logger.trace("#{@glyph.model.type} glyph (#{@glyph.model.id}): do_render calls finished in #{dt}ms")

    ctx.restore()

  map_to_screen: (x, y) ->
    @plot_view.map_to_screen(x, y, @mget("x_range_name"), @mget("y_range_name"))

  draw_legend: (ctx, x0, x1, y0, y1) ->
    @glyph.draw_legend(ctx, x0, x1, y0, y1)

  hit_test: (geometry) ->
    @glyph.hit_test(geometry)

class GlyphRenderer extends HasParent
  default_view: GlyphRendererView
  type: 'GlyphRenderer'

  selection_defaults: {}
  nonselection_defaults: {fill_alpha: 0.1, line_alpha: 0.1}

  defaults: ->
    return _.extend {}, super(), {
      x_range_name: "default"
      y_range_name: "default"
      data_source: null
    }

  display_defaults: ->
    return _.extend {}, super(), {
      level: 'glyph'
    }

class GlyphRenderers extends Collection
  model: GlyphRenderer

module.exports =
  Model: GlyphRenderer
  View: GlyphRendererView
  Collection: new GlyphRenderers()
