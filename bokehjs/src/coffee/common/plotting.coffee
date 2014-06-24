console.log("multirange2.js");
define [
  "underscore",
  "jquery",
  "./plot",
  "range/data_range1d",
  "range/factor_range",
  "range/range1d",
  "renderer/annotation/legend",
  "renderer/glyph/glyph_factory",
  "renderer/guide/categorical_axis",
  "renderer/guide/linear_axis",
  "renderer/guide/grid",
  "renderer/overlay/box_selection",
  "source/column_data_source",
  "tool/box_select_tool",
  "tool/box_zoom_tool",
  "tool/hover_tool",
  "tool/pan_tool",
  "tool/preview_save_tool",
  "tool/resize_tool",
  "tool/wheel_zoom_tool",
  "tool/reset_tool",
  "renderer/guide/datetime_axis",
  "tool/auto_range_tool",
], (_, $, Plot, DataRange1d, FactorRange, Range1d, Legend,
  GlyphFactory, CategoricalAxis, LinearAxis, Grid, BoxSelection,
  ColumnDataSource, BoxSelectTool, BoxZoomTool, HoverTool, PanTool,
  PreviewSaveTool, ResizeTool, WheelZoomTool,
  ResetTool, DatetimeAxis, AutoRangeTool) ->

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
        sources: ({source: s.ref(), columns: columns} for s in sources)
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
        parent: plot.ref()
        data_source: source.ref()
        glyphspec: spec
        nonselection_glyphspec: non_spec
      })
      glyphs.push(glyph)

    return glyphs

  
  interpret_axis= (axis_spec, plot) ->
    defaults =  {
      type: 'linear',
      _axis_label: false,
      parent: plot.ref(),
      plot: plot.ref(),
      dimension: 0,
      location: 'min'
    }
    merged_spec = _.defaults({}, axis_spec, defaults)
    if merged_spec.type == 'linear'
      return LinearAxis.Collection.create(merged_spec)
    else if merged_spec.type == 'factor_range'
      return CategoricalAxis.Collection.create(merged_spec)
    else if merged_spec.type == 'datetime'
      return DatetimeAxis.Collection.create(merged_spec)
    else
      1/0 # an invalid type wwas specified, throw an error

  _axis_api = (plot, axes_spec, dim) ->
    axes = []
    if typeof(axes_spec) == "string"
      #the user specified min or max, and wants a LinearAxis
      if axes_spec == "min" || axes_spec == "max"
        axes.push(interpret_axis({location: axes_spec, dimension:dim}, plot))
      else  # here the user wants to specify the axis type
        axes.push(interpret_axis({type:axes_spec, dimension:dim}, plot))
    else if _.isArray(axes_spec)
      for yspec in axes_spec
        axes.push(interpret_axis(_.defaults(yspec, {dimension:dim}), plot))
    else if typeof(axes_spec)=="boolean"
      if axes_spec
        axes.push(interpret_axis({location: 'min', dimension:dim}, plot))
    else if typeof(axes_spec) == "object"
      axes.push(interpret_axis(_.defaults(axes_spec, {dimension:dim}), plot))
    else
      1/0  # I don't know what else there is, but this API doesn't
           # know how to deal with it
    return axes
  
  add_axes = (plot, xaxes_spec, yaxes_spec) ->
    xaxes = _axis_api(plot, xaxes_spec, 0)
    yaxes = _axis_api(plot, yaxes_spec, 1)
    plot.add_renderers(a.ref() for a in xaxes)
    plot.add_renderers(a.ref() for a in yaxes)
    return [xaxes, yaxes]
  # FIXME The xaxis_is_datetime argument is a huge hack, but for now I want to
  # make as small a change as possible.  Doing it right will require a larger
  # refactoring.
  add_grids = (plot, xgrid, ygrid, xaxes, yaxes) ->
    grids = []
    if xgrid and xaxes.length > 0
      grid = Grid.Collection.create(
        dimension: 0
        parent: plot.ref()
        plot: plot.ref()
        axis: xaxes[0].ref()
      )
      grids.push(grid)
    if ygrid and yaxes.length > 0
      grid = Grid.Collection.create(
        dimension: 1
        parent: plot.ref()
        plot: plot.ref()
        axis: yaxes[0].ref()
      )
      grids.push(grid)
      plot.add_renderers(g.ref() for g in grids)

  add_tools = (plot, tools, glyphs, xdr, ydr) ->
    if tools == false
      return

    if tools == true
      tools = "pan,wheel_zoom,select,resize,preview,reset,box_zoom,auto_range"
    added_tools = []

    if tools.indexOf("pan") > -1
      pan_tool = PanTool.Collection.create(
        dataranges: [xdr.ref(), ydr.ref()]
        dimensions: ['width', 'height']
      )
      added_tools.push(pan_tool)

    if tools.indexOf("wheel_zoom") > -1
      wheel_zoom_tool = WheelZoomTool.Collection.create(
        dataranges: [xdr.ref(), ydr.ref()]
        dimensions: ['width', 'height']
      )
      added_tools.push(wheel_zoom_tool)

    if tools.indexOf("hover") > -1
      hover_tool = HoverTool.Collection.create(
        plot: plot.ref()
      )
      added_tools.push(hover_tool)

    if tools.indexOf("select") > -1
      select_tool = BoxSelectTool.Collection.create(
        renderers: (g.ref() for g in glyphs)
      )
      select_overlay = BoxSelection.Collection.create(
        tool: select_tool.ref()
      )
      added_tools.push(select_tool)
      plot.add_renderers([select_overlay.ref()])

    if tools.indexOf("resize") > -1
      resize_tool = ResizeTool.Collection.create()
      added_tools.push(resize_tool)

    if tools.indexOf("preview") > -1
      preview_tool = PreviewSaveTool.Collection.create()
      added_tools.push(preview_tool)

    if tools.indexOf("reset") > -1
      reset_tool = ResetTool.Collection.create()
      added_tools.push(reset_tool)

    if tools.indexOf("auto_range") > -1
      auto_range_tool = AutoRangeTool.Collection.create()
      added_tools.push(auto_range_tool)

    if tools.indexOf("box_zoom") > -1
      box_zoom_tool = BoxZoomTool.Collection.create()
      box_zoom_overlay = BoxSelection.Collection.create(
        tool: box_zoom_tool.ref()
      )
      added_tools.push(box_zoom_tool)
      plot.add_renderers([box_zoom_overlay.ref()])

    plot.set_obj('tools', added_tools)

  add_legend = (plot, legend, glyphs) ->
    if legend
      legends = {}
      default_legend_options = {
        read_name_from_renderer: false
        legend_text: legend
        orientation: "top_right"}

      if typeof(legend) == "string"
        legend_options = default_legend_options
        if legend == "renderer"
          legend_options.read_name_from_renderer = true
      else if typeof(legend) == "object"
        legend_options = _.defaults(legend, default_legend_options)
      else
        1/0 #hack to force an exception.
        
      for g, idx in glyphs
        if legend_options.read_name_from_renderer
          if g.get('glyphspec').show_legend
            legends[g.get('glyphspec').name] = [g.ref()]
        else
          legends[legend_options.legend_text + String(idx)] = [g.ref()]

      legend_renderer = Legend.Collection.create({
        parent: plot.ref()
        plot: plot.ref()
        orientation: legend_options.orientation
        legends: legends
      })
      plot.add_renderers([legend_renderer.ref()])

  make_plot = (glyphspecs, data, {nonselected, title, dims, xrange, yrange, xaxes, yaxes, xgrid, ygrid, xdr, ydr, tools, legend, extra_x_ranges, extra_y_ranges}) ->
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
    extra_x_ranges ?= null
    extra_y_ranges ?= null
    
    plot = Plot.Collection.create()
    update_plot(plot, glyphspecs, data,
                {nonselected:nonselected, title: title, dims: dims, xrange: xrange,
                yrange: yrange, xaxes: xaxes, yaxes: yaxes, xgrid: xgrid,
                ygrid: ygrid, xdr: xdr, ydr: ydr, tools: tools,
                legend: legend, extra_x_ranges: extra_x_ranges, extra_y_ranges: extra_y_ranges})

    return plot

  update_plot = (plot, glyphspecs, data, {nonselected, title, dims, xrange, yrange, xaxes, yaxes, xgrid, ygrid, xdr, ydr, tools, legend, extra_x_ranges, extra_y_ranges}) ->
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
    extra_x_ranges ?= null
    extra_y_ranges ?= null
    
    sources = create_sources(data)

    xdr = create_range(xrange, sources, ['x'])
    ydr = create_range(yrange, sources, ['y'])

    if extra_x_ranges?
      for name, rng of extra_x_ranges
        extra_x_ranges[name] = create_range(rng)

    if extra_y_ranges?
      for name, rng of extra_y_ranges
        extra_y_ranges[name] = create_range(rng)
    console.log("before each loop")
    _.each({
        x_range: xdr.ref()
        y_range: ydr.ref()
        canvas_width: dims[0]
        canvas_height: dims[1]
        outer_width: dims[0]
        outer_height: dims[1]
        
        extra_x_ranges: extra_x_ranges
        extra_y_ranges: extra_y_ranges
        glyphs:[]
        tools:[]
        title: title}, (val, key) ->
                #console.log(val, key);
                plot.set(key, val));
    console.log("after  each loop")
    glyphs = create_glyphs(plot, glyphspecs, sources, nonselected)
    plot.add_renderers(g.ref() for g in glyphs)
    
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
      console.log("added plot: " + plot.get('title'))
    _.defer(myrender)


  return {
    "make_plot": make_plot,
    "update_plot": update_plot,        
    "create_glyphs": create_glyphs,
    "create_sources": create_sources,
    "show": show,
  }
