import {Renderer, RendererView} from "./renderer"
import {LineView} from "../glyphs/line"
import {RemoteDataSource} from "../sources/remote_data_source"
import {CDSView} from "../sources/cds_view"
import {logger} from "core/logging"
import * as p from "core/properties"
import {difference} from "core/util/array"
import {extend, clone} from "core/util/object"

export class GlyphRendererView extends RendererView

  initialize: (options) ->
    super(options)

    base_glyph = @model.glyph
    has_fill = "fill" in base_glyph.mixins
    has_line = "line" in base_glyph.mixins
    glyph_attrs = clone(base_glyph.attributes)
    delete glyph_attrs.id

    mk_glyph = (defaults) ->
      attrs = clone(glyph_attrs)
      if has_fill then extend(attrs, defaults.fill)
      if has_line then extend(attrs, defaults.line)
      return new (base_glyph.constructor)(attrs)

    @glyph = @build_glyph_view(base_glyph)

    selection_glyph = @model.selection_glyph
    if not selection_glyph?
      selection_glyph = mk_glyph({fill: {}, line: {}})
    else if selection_glyph == "auto"
      selection_glyph = mk_glyph(@model.selection_defaults)
    @selection_glyph = @build_glyph_view(selection_glyph)

    nonselection_glyph = @model.nonselection_glyph
    if not nonselection_glyph?
      nonselection_glyph = mk_glyph({fill: {}, line: {}})
    else if nonselection_glyph == "auto"
      nonselection_glyph = mk_glyph(@model.nonselection_defaults)
    @nonselection_glyph = @build_glyph_view(nonselection_glyph)

    hover_glyph = @model.hover_glyph
    if hover_glyph?
      @hover_glyph = @build_glyph_view(hover_glyph)

    muted_glyph = @model.muted_glyph
    if muted_glyph?
      @muted_glyph = @build_glyph_view(muted_glyph)

    decimated_glyph = mk_glyph(@model.decimated_defaults)
    @decimated_glyph = @build_glyph_view(decimated_glyph)

    @xscale = @plot_view.frame.xscales[@model.x_range_name]
    @yscale = @plot_view.frame.yscales[@model.y_range_name]

    @set_data(false)

    if @model.data_source instanceof RemoteDataSource
      @model.data_source.setup()

  @getters {
    xmapper: () ->
      log.warning("xmapper attr is deprecated, use xscale")
      @xscale
    ymapper: () ->
      log.warning("ymapper attr is deprecated, use yscale")
      @yscale
  }

  build_glyph_view: (model) ->
    new model.default_view({model: model, renderer: @, plot_view: @plot_view, parent: @})

  connect_signals: () ->
    super()
    @connect(@model.change, () -> @request_render())
    @connect(@model.glyph.change, () -> @set_data())
    @connect(@model.data_source.change, () -> @set_data())
    @connect(@model.data_source.streaming, () -> @set_data())
    @connect(@model.data_source.patching, (indices) -> @set_data(true, indices))
    @connect(@model.data_source.select, () -> @request_render())
    if @hover_glyph?
      @connect(@model.data_source.inspect, () -> @request_render())
    @connect(@model.properties.view.change, () -> @set_data())
    @connect(@model.view.change, () -> @set_data())

    @connect(@model.glyph.transformchange, () -> @set_data())

  have_selection_glyphs: () -> @selection_glyph? && @nonselection_glyph?

  # in case of partial updates like patching, the list of indices that actually
  # changed may be passed as the "indices" parameter to afford any optional optimizations
  set_data: (request_render=true, indices) ->
    t0 = Date.now()
    source = @model.data_source

    @all_indices = @model.view.indices

    # TODO (bev) this is a bit clunky, need to make sure glyphs use the correct ranges when they call
    # mapping functions on the base Renderer class
    @glyph.model.setv({x_range_name: @model.x_range_name, y_range_name: @model.y_range_name}, {silent: true})
    @glyph.set_data(source, @all_indices, indices)

    @glyph.set_visuals(source)
    @decimated_glyph.set_visuals(source)
    if @have_selection_glyphs()
      @selection_glyph.set_visuals(source)
      @nonselection_glyph.set_visuals(source)
    if @hover_glyph?
      @hover_glyph.set_visuals(source)
    if @muted_glyph?
      @muted_glyph.set_visuals(source)

    lod_factor = @plot_model.plot.lod_factor
    @decimated = []
    for i in [0...Math.floor(@all_indices.length/lod_factor)]
      @decimated.push(@all_indices[i*lod_factor])

    dt = Date.now() - t0
    logger.debug("#{@glyph.model.type} GlyphRenderer (#{@model.id}): set_data finished in #{dt}ms")

    @set_data_timestamp = Date.now()

    if request_render
      @request_render()

  render: () ->
    if not @model.visible
      return

    t0 = Date.now()

    glsupport = @glyph.glglyph

    tmap = Date.now()
    @glyph.map_data()
    dtmap = Date.now() - t0

    tmask = Date.now()
    # all_indices and indices are in cdsview subset space
    indices = @glyph.mask_data(@all_indices)
    dtmask = Date.now() - tmask

    ctx = @plot_view.canvas_view.ctx
    ctx.save()

    # selected is in full set space
    selected = @model.data_source.selected
    if !selected or selected.length == 0
      selected = []
    else
      if selected['0d'].glyph
        if @glyph instanceof LineView
          selected = indices
        else
          selected = @model.view.convert_indices_from_subset(indices)
      else if selected['1d'].indices.length > 0
        selected = selected['1d'].indices
      else
        selected = (parseInt(i) for i in Object.keys(selected["2d"].indices))

    # inspected is in full set space
    inspected = @model.data_source.inspected
    if !inspected or inspected.length == 0
      inspected = []
    else
      if inspected['0d'].glyph
        if @glyph instanceof LineView
          inspected = indices
        else
          inspected = @model.view.convert_indices_from_subset(indices)
      else if inspected['1d'].indices.length > 0
        inspected = inspected['1d'].indices
      else
        inspected = (parseInt(i) for i in Object.keys(inspected["2d"].indices))

    # inspected is transformed to subset space
    inspected = (i for i in indices when @all_indices[i] in inspected)

    lod_threshold = @plot_model.plot.lod_threshold
    if @plot_view.interactive and !glsupport and lod_threshold? and @all_indices.length > lod_threshold
      # Render decimated during interaction if too many elements and not using GL
      indices = @decimated
      glyph = @decimated_glyph
      nonselection_glyph = @decimated_glyph
      selection_glyph = @selection_glyph
    else
      glyph = if @model.muted and @muted_glyph? then @muted_glyph else @glyph
      nonselection_glyph = @nonselection_glyph
      selection_glyph = @selection_glyph

    if @hover_glyph? and inspected.length
      indices = difference(indices, inspected)

    if not (selected.length and @have_selection_glyphs())
        trender = Date.now()
        glyph.render(ctx, indices, @glyph)
        if @hover_glyph and inspected.length
          @hover_glyph.render(ctx, inspected, @glyph)
        dtrender = Date.now() - trender

    else
      # reset the selection mask
      tselect = Date.now()
      selected_mask = {}
      for i in selected
        selected_mask[i] = true

      # intersect/different selection with render mask
      selected = new Array()
      nonselected = new Array()
      for i in indices
        # now, selected is changed to subset space, except for Line glyph
        if @glyph instanceof LineView
          if selected_mask[i]?
            selected.push(i)
          else
            nonselected.push(i)
        else
          if selected_mask[@all_indices[i]]?
            selected.push(i)
          else
            nonselected.push(i)
      dtselect = Date.now() - tselect

      trender = Date.now()
      nonselection_glyph.render(ctx, nonselected, @glyph)
      selection_glyph.render(ctx, selected, @glyph)
      if @hover_glyph?
        @hover_glyph.render(ctx, inspected, @glyph)
      dtrender = Date.now() - trender

    @last_dtrender = dtrender

    dttot = Date.now() - t0
    logger.debug("#{@glyph.model.type} GlyphRenderer (#{@model.id}): render finished in #{dttot}ms")
    logger.trace(" - map_data finished in       : #{dtmap}ms")
    if dtmask?
      logger.trace(" - mask_data finished in      : #{dtmask}ms")
    if dtselect?
      logger.trace(" - selection mask finished in : #{dtselect}ms")
    logger.trace(" - glyph renders finished in  : #{dtrender}ms")

    ctx.restore()

  map_to_screen: (x, y) ->
    @plot_view.map_to_screen(x, y, @model.x_range_name, @model.y_range_name)

  draw_legend: (ctx, x0, x1, y0, y1, field, label) ->
    index = @model.get_reference_point(field, label)
    @glyph.draw_legend_for_index(ctx, x0, x1, y0, y1, index)

  hit_test: (geometry, final, append, mode="select") ->
    return @model.hit_test_helper(geometry, @, final, append, mode)


export class GlyphRenderer extends Renderer
  default_view: GlyphRendererView

  type: 'GlyphRenderer'

  initialize: (options) ->
    super(options)

    if not @view.source?
      @view.source = @data_source
      @view.compute_indices()

  get_reference_point: (field, value) ->
    index = 0  # This is the default to return
    if field? and @data_source.get_column?
      data = @data_source.get_column(field)
      if data
        i = data.indexOf(value)
        if i > 0
          index = i
    return index

  hit_test_helper: (geometry, renderer_view, final, append, mode) ->
    if not @visible
      return false

    hit_test_result = renderer_view.glyph.hit_test(geometry)

    # glyphs that don't have hit-testing implemented will return null
    if hit_test_result == null
      return false

    indices = @view.convert_selection_from_subset(hit_test_result)

    if mode == "select"
      selector = @data_source.selection_manager.selector
      selector.update(indices, final, append)
      @data_source.selected = selector.indices
      @data_source.select.emit()
    else # mode == "inspect"
      inspector = @data_source.selection_manager.get_or_create_inspector(@)
      inspector.update(indices, true, false, true)
      @data_source.inspected = inspector.indices
      @data_source.inspect.emit([renderer_view, {"geometry": geometry}])

    return not indices.is_empty()

  get_selection_manager: () ->
    return @data_source.selection_manager

  @define {
      x_range_name:       [ p.String,  'default' ]
      y_range_name:       [ p.String,  'default' ]
      data_source:        [ p.Instance           ]
      view:               [ p.Instance, () -> new CDSView() ]
      glyph:              [ p.Instance           ]
      hover_glyph:        [ p.Instance           ]
      nonselection_glyph: [ p.Any,      'auto'   ] # Instance or "auto"
      selection_glyph:    [ p.Any,      'auto'   ] # Instance or "auto"
      muted_glyph:        [ p.Instance           ]
      muted:              [ p.Bool,        false ]
    }

  @override {
    level: 'glyph'
  }

  selection_defaults: {fill: {}, line: {}}
  decimated_defaults: {fill: {fill_alpha: 0.3, fill_color: "grey"}, line: {line_alpha: 0.3, line_color: "grey"}}
  nonselection_defaults: {fill: {fill_alpha: 0.2, line_alpha: 0.2}, line: {}}
