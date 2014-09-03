
define [
  "underscore"
  "jquery"
  "./logging"
  "./plot"
  "range/data_range1d"
  "range/factor_range"
  "range/range1d"
  "renderer/annotation/legend"
  "renderer/glyph/glyph_factory"
  "renderer/guide/categorical_axis"
  "renderer/guide/linear_axis"
  "renderer/guide/grid"
  "renderer/overlay/box_selection"
  "source/column_data_source"
  "tool/box_select_tool"
  "tool/box_zoom_tool"
  "tool/hover_tool"
  "tool/pan_tool"
  "tool/preview_save_tool"
  "tool/resize_tool"
  "tool/wheel_zoom_tool"
  "tool/reset_tool"
  "renderer/guide/datetime_axis"
], (_, $, Logging, Plot, DataRange1d, FactorRange, Range1d, Legend,
  GlyphFactory, CategoricalAxis, LinearAxis, Grid, BoxSelection,
  ColumnDataSource, BoxSelectTool, BoxZoomTool, HoverTool, PanTool,
  PreviewSaveTool, ResizeTool, WheelZoomTool, ResetTool, DatetimeAxis) ->

  logger = Logging.logger

  create_sources = (data) ->
    if not _.isArray(data)
      data = [data]
    sources = []
    for d in data
      if d instanceof ColumnDataSource.Model
        sources.push(d)
      else
        sources.push(ColumnDataSource.Collection.create({data: d}))
    return sources

  create_range = (range, sources, columns) ->
    if range == 'auto'
      return DataRange1d.Collection.create(
        sources: ({source: s, columns: columns} for s in sources)
      )
    else if (range instanceof Range1d.Model) or (range instanceof FactorRange.Model)
      return range
    else
      if typeof(range[0]) == "string"
        return FactorRange.Collection.create({factors: range})
      else
        return Range1d.Collection.create({start: range[0], end: range[1]})

  create_glyphs = (plot, glyphspecs, sources, nonselection_glyphspecs) ->
    glyphs = []
    if not _.isArray(glyphspecs)
      glyphspecs = [glyphspecs]

    if sources.length == 1
      sources = (sources[0] for x in glyphspecs)

    if not nonselection_glyphspecs?
      nonselection_glyphspecs = {
        fill_alpha: 0.1
        line_alpha: 0.1
      }
    if not _.isArray(nonselection_glyphspecs)
      nonselection_glyphspecs = (nonselection_glyphspecs for x in glyphspecs)

    for val in _.zip(glyphspecs, nonselection_glyphspecs, sources)
      [spec, non_spec, source] = val
      glyph = GlyphFactory.Collection.create({
        data_source: source
        glyphspec: spec
        nonselection_glyphspec: non_spec
      })
      glyphs.push(glyph)

    return glyphs

  add_axes = (plot, xaxes_spec, yaxes_spec, xdr, ydr) ->
    xaxes = []
    if xaxes_spec
      if xaxes_spec == true
        xaxes_spec = ['below', 'above']
      if not _.isArray(xaxes_spec)
        xaxes_spec = [xaxes_spec]
      if xaxes_spec[0]=="datetime"
        axis = DatetimeAxis.Collection.create(
          axis_label: 'x'
          location: 'below'
          plot: plot
        )
        xaxes.push(axis)
      else if xdr.type == "FactorRange"
        for loc in xaxes_spec
          axis = CategoricalAxis.Collection.create(
            axis_label: 'x'
            location: loc
            plot: plot
          )
          xaxes.push(axis)
      else
        for loc in xaxes_spec
          axis = LinearAxis.Collection.create(
            axis_label: 'x'
            location: loc
            plot: plot
          )
          xaxes.push(axis)
      for xax in xaxes
        if xax.get('location') == "below"
          below = plot.get('below')
          below.push(xax)
          plot.set('below', below)
        else if xax.get('location') == "above"
          above = plot.get('above')
          above.push(xax)
          plot.set('above', above)
    yaxes = []
    if yaxes_spec
      if yaxes_spec == true
        yaxes_spec = ['left', 'right']
      if not _.isArray(yaxes_spec)
        yaxes_spec = [yaxes_spec]
      if yaxes_spec[0]=="datetime"
        axis = DatetimeAxis.Collection.create(
          axis_label: 'y'
          location: 'left'
          plot: plot
        )
        yaxes.push(axis)
      else if ydr.type == "FactorRange"
        for loc in yaxes_spec
          axis = CategoricalAxis.Collection.create(
            axis_label: 'y'
            location: loc
            plot: plot
          )
          yaxes.push(axis)
      else
        for loc in yaxes_spec
          axis = LinearAxis.Collection.create(
            axis_label: 'y'
            location: loc
            plot: plot
          )
          yaxes.push(axis)
      for yax in yaxes
        if yax.get('location') == "left"
          left = plot.get('left')
          left.push(yax)
          plot.set('left', left)
        else if yax.get('location') == "right"
          right = plot.get('right')
          right.push(yax)
          plot.set('right', right)

    plot.add_renderers(a for a in xaxes)
    plot.add_renderers(a for a in yaxes)

    return [xaxes, yaxes]

  # FIXME The xaxis_is_datetime argument is a huge hack, but for now I want to
  # make as small a change as possible.  Doing it right will require a larger
  # refactoring.
  add_grids = (plot, xgrid, ygrid, xaxes, yaxes) ->
    grids = []
    if xgrid and xaxes.length > 0
      grid = Grid.Collection.create(
        dimension: 0
        plot: plot
        ticker: xaxes[0].get('ticker')
      )
      grids.push(grid)
    if ygrid and yaxes.length > 0
      grid = Grid.Collection.create(
        dimension: 1
        plot: plot
        ticker: yaxes[0].get('ticker')
      )
      grids.push(grid)
      plot.add_renderers(g for g in grids)

  add_tools = (plot, tools, glyphs, xdr, ydr) ->
    if tools == false
      return

    if tools == true
      tools = "pan,wheel_zoom,select,resize,preview,reset,box_zoom"
    added_tools = []

    if tools.indexOf("pan") > -1
      pan_tool = PanTool.Collection.create(
        dataranges: [xdr, ydr]
        dimensions: ['width', 'height']
      )
      added_tools.push(pan_tool)

    if tools.indexOf("wheel_zoom") > -1
      wheel_zoom_tool = WheelZoomTool.Collection.create(
        dataranges: [xdr, ydr]
        dimensions: ['width', 'height']
      )
      added_tools.push(wheel_zoom_tool)

    if tools.indexOf("hover") > -1
      hover_tool = HoverTool.Collection.create(
        plot: plot
      )
      added_tools.push(hover_tool)

    if tools.indexOf("select") > -1
      select_tool = BoxSelectTool.Collection.create(
        renderers: (g for g in glyphs)
      )
      select_overlay = BoxSelection.Collection.create(
        tool: select_tool
      )
      added_tools.push(select_tool)
      plot.add_renderers([select_overlay])

    if tools.indexOf("resize") > -1
      resize_tool = ResizeTool.Collection.create()
      added_tools.push(resize_tool)

    if tools.indexOf("preview") > -1
      preview_tool = PreviewSaveTool.Collection.create()
      added_tools.push(preview_tool)

    if tools.indexOf("reset") > -1
      reset_tool = ResetTool.Collection.create()
      added_tools.push(reset_tool)

    if tools.indexOf("box_zoom") > -1
      box_zoom_tool = BoxZoomTool.Collection.create()
      box_zoom_overlay = BoxSelection.Collection.create(
        tool: box_zoom_tool
      )
      added_tools.push(box_zoom_tool)
      plot.add_renderers([box_zoom_overlay])

    plot.set_obj('tools', added_tools)

  add_legend = (plot, legend, glyphs) ->
    if legend
      legends = {}
      for g, idx in glyphs
        legends[legend + String(idx)] = [g]
      legend_renderer = Legend.Collection.create({
        plot: plot
        orientation: "top_right"
        legends: legends
      })
      plot.add_renderers([legend_renderer])

  make_plot = (glyphspecs, data, {nonselected, title, dims, xrange, yrange, xaxes, yaxes, xgrid, ygrid, xdr, ydr, tools, legend}) ->
    nonselected ?= null
    title  ?= ""
    dims   ?= [400, 400]
    xrange ?= 'auto'
    yrange ?= 'auto'
    xaxes  ?= true
    yaxes  ?= true
    xgrid  ?= true
    ygrid  ?= true
    tools  ?= true
    legend ?= false

    sources = create_sources(data)

    xdr = create_range(xrange, sources, ['x'])
    ydr = create_range(yrange, sources, ['y'])

    plot = Plot.Collection.create(
      x_range: xdr
      y_range: ydr
      plot_width: dims[0]
      plot_height: dims[1]
      title: title
    )

    glyphs = create_glyphs(plot, glyphspecs, sources, nonselected)
    plot.add_renderers(g for g in glyphs)

    [xaxes, yaxes] = add_axes(plot, xaxes, yaxes, xdr, ydr)
    add_grids(plot, xgrid, ygrid, xaxes, yaxes)
    add_tools(plot, tools, glyphs, xdr, ydr)
    add_legend(plot, legend, glyphs)

    return plot

  show = (plot, target_div=false) ->
    div = $('<div class="plotdiv"></div>')
    if target_div
      target_div = $(target_div)
    else
      target_div = $('body')
    target_div.append(div)
    myrender  =  ->
      view = new plot.default_view(model: plot)
      window.pview = view
      div.append(view.$el)
      logger.info("added plot: #{plot.get('title')}")
    _.defer(myrender)

  return {
    "make_plot": make_plot,
    "create_glyphs": create_glyphs,
    "show": show,
  }
