if this.Bokeh
  Bokeh = this.Bokeh
else
  Bokeh = {}
  this.Bokeh = Bokeh
safebind = Continuum.safebind

class PlotWidget extends Continuum.DeferredView
  initialize : (options) ->
    super(options)
    @plot_id = options.plot_id
    @plot_model = options.plot_model



# Individual Components below.
# we first define the default view for a component,
# the model for the component, and the collection

#  Plot Container


class GridPlotContainerView extends Continuum.DeferredParent
  default_options : {
    scale:1.0
  }
  initialize : (options) ->
    super(_.defaults(options, @default_options))
    @childviews = {}
    @build_children()
    @request_render()
    safebind(this, @model, 'change:children', @build_children)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @model, 'destroy', () => @remove())
    @png_data_url_deferred = $.Deferred()
    return this

  to_png_daturl: () ->
    if @png_data_url_deferred.isResolved()
      return @png_data_url_deferred
    @render_deferred_components(true)
    svg_el = $(@el).find('svg')[0]
    SVGToCanvas.exportPNGcanvg(svg_el, (dataUrl) =>
      console.log(dataUrl.length, dataUrl[0..100])
      @png_data_url_deferred.resolve(dataUrl))
    return @png_data_url_deferred.promise()

  build_children : ->
    node = @build_node()
    childspecs = []
    for row in @mget('children')
      for x in row
        @model.resolve_ref(x).set('usedialog', false)
        childspecs.push(x)
    build_views(@model, @childviews, childspecs, {'el' : @tag_d3('plot')[0][0]})

  build_node : ->
    node = @tag_d3('mainsvg')
    if node == null
      node = d3.select(@el).append('svg').attr('id', @tag_id('mainsvg'))
      node.append('g').attr('id', @tag_id('plot'))
    return node

  render_deferred_components : (force) ->
    super(force)
    for row, ridx in @mget('children')
      for plotspec, cidx in row
        @childviews[plotspec.id].render_deferred_components(force)

  render : ->
    super()
    node = @build_node()
    trans_string = "scale(#{@options.scale}, #{@options.scale})"
    trans_string += "translate(#{@mget('border_space')}, #{@mget('border_space')})"
    @tag_d3('plot').attr('transform', trans_string)
    node.attr('width', @options.scale * @mget('outerwidth'))
      .attr('height', @options.scale * @mget('outerheight'))
      .attr('x', @model.position_x())
      .attr('y', @model.position_y())
    row_heights =  @model.layout_heights()
    col_widths =  @model.layout_widths()
    y_coords = [0]
    _.reduceRight(row_heights[1..]
      ,
        (x, y) ->
          val = x + y
          y_coords.push(val)
          return val
      , 0
    )
    y_coords.reverse()
    x_coords = [0]
    _.reduce(col_widths[..-1]
      ,
        (x,y) ->
          val = x + y
          x_coords.push(val)
          return val
      , 0
    )
    for row, ridx in @mget('children')
      for plotspec, cidx in row
        plot = @model.resolve_ref(plotspec)
        plot.set(
          offset : [x_coords[cidx], y_coords[ridx]]
          usedialog : false
        )
    if @mget('usedialog') and not @$el.is(":visible")
      @add_dialog()



class PlotView extends Continuum.DeferredParent
  default_options : {
    scale:1.0
  }

  initialize : (options) ->
    super(_.defaults(options, @default_options))
    @renderers = {}
    @axes = {}
    @tools = {}
    @overlays = {}

    @build_renderers()
    @build_axes()
    @build_tools()
    @build_overlays()

    @render()
    safebind(this, @model, 'change:renderers', @build_renderers)
    safebind(this, @model, 'change:axes', @build_axes)
    safebind(this, @model, 'change:tools', @build_tools)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @model, 'destroy', () => @remove())

    @png_data_url_deferred = $.Deferred()
    return this

  to_png_daturl: () ->
    if @png_data_url_deferred.isResolved()
      return @png_data_url_deferred
    @render_deferred_components(true)
    svg_el = $(@el).find('svg')[0]

    SVGToCanvas.exportPNGcanvg(svg_el, (dataUrl) =>
      console.log(dataUrl.length, dataUrl[0..100])
      @png_data_url_deferred.resolve(dataUrl))
    return @png_data_url_deferred.promise()

  build_renderers : ->
    build_views(@model, @renderers, @mget('renderers')
      ,
        el : @el,
        plot_id : @id,
        plot_model : @model
    )

  build_axes : ->
    build_views(@model, @axes, @mget('axes')
      ,
        el : @el
        plot_id : @id
        plot_model : @model
    )

  build_tools : ->
    build_views(@model, @tools, @mget('tools')
      ,
        el : @el,
        plot_id : @id,
        plot_model : @model
    )

  build_overlays : ->
    #add ids of renderer views into the overlay spec
    overlays = (_.clone(x) for x in @mget('overlays'))
    for overlayspec in overlays
      overlay = @model.resolve_ref(overlayspec)
      if not overlayspec['options']
        overlayspec['options'] = {}
      overlayspec['options']['renderer_ids'] = []
      for renderer in overlay.get('renderers')
        overlayspec['options']['renderer_ids'].push(@renderers[renderer.id].id)
    build_views(@model, @overlays, overlays
      ,
        el : @el,
        plot_id : @id,
        plot_model : @model
    )

  bind_overlays : ->
    for overlayspec in @mget('overlays')
      @overlays[overlayspec.id].bind_events(this)

  bind_tools : ->
    for toolspec in   @mget('tools')
      @tools[toolspec.id].bind_events(this)

  render_mainsvg : ->
    node = @tag_d3('mainsvg')
    if node == null
      node = d3.select(@el).append('svg')
        .attr('id', @tag_id('mainsvg'))
      node.append('g')
        .attr('id', @tag_id('plot'))
      @tag_d3('plot').append('g').attr('id', @tag_id('bg'))
      @tag_d3('plot').append('g').attr('id', @tag_id('fg'))
      @tag_d3('fg').append('text')
        .text(@mget('title'))
        .attr('x', 0)
        .attr('y', -15)
      @tag_d3('bg')
        .append('rect')
        .attr('id', @tag_id('innerbox'))
      @tag_d3('fg').append('svg').attr('id', @tag_id('plotwindow'))
      @bind_tools()
      @bind_overlays()

    if not @mget('usedialog')
      node.attr('x', @model.position_x())
       .attr('y', @model.position_y())
    @tag_d3('innerbox')
      .attr('fill', @mget('background_color'))
      .attr('stroke', @model.get('foreground_color'))
      .attr('width', @mget('width'))
      .attr("height",  @mget('height'))


    @tag_d3('plotwindow')
      .attr('width',  @mget('width'))
      .attr('height', @mget('height'))

    node.attr("width", @options.scale * @mget('outerwidth'))
      .attr('height', @options.scale * @mget('outerheight'))
    #svg puts origin in the top left, we want it on the bottom left
    #
    trans_string = "scale(#{@options.scale}, #{@options.scale})"
    trans_string += "translate(#{@mget('border_space')}, #{@mget('border_space')})"

    @tag_d3('plot').attr('transform', trans_string)

  render : () ->
    super()
    ret_val = @render_mainsvg();
    if @mget('usedialog') and not @$el.is(":visible")
      ret_val = @add_dialog()

    return ret_val

  render_deferred_components: (force) ->
    super(force)
    for own key, view of @axes
      view.render_deferred_components(force)
    for own key, view of @renderers
      view.render_deferred_components(force)
    for own key, view of @tools
      view.render_deferred_components(force)
    for own key, view of @overlays
      view.render_deferred_components(force)

build_views = Continuum.build_views

# D3LinearAxisView

class D3LinearAxisView extends PlotWidget
  initialize : (options) ->
    super(options)
    safebind(this, @plot_model, 'change', @request_render)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @mget_ref('mapper'), 'change', @request_render)


  get_offsets : (orientation) ->
    offsets =
      x : 0
      y : 0
    if orientation == 'bottom'
      offsets['y'] += @plot_model.get('height')
    return offsets

  get_tick_size : (orientation) ->
    if (not _.isNull(@mget('tickSize')))
      return @mget('tickSize')
    else
      if orientation == 'bottom'
        return -@plot_model.get('height')
      else
        return -@plot_model.get('width')

  convert_scale : (scale) ->
    domain = scale.domain()
    range = scale.range()
    if @mget('orientation') in ['bottom', 'top']
      func = 'xpos'
    else
      func = 'ypos'
    range = [@plot_model[func](range[0]), @plot_model[func](range[1])]
    scale = d3.scale.linear().domain(domain).range(range)
    return scale

  render : ->
    super()
    base = @tag_d3('bg', @plot_id)
    node = @tag_d3('axis')
    if not node
      node = base.append('g')
        .attr('id', @tag_id('axis'))
        .attr('style', '  font: 12px sans-serif; fill:none; stroke-width:1.5px; shape-rendering:crispEdges')
        .attr('stroke', @mget('foreground_color'))
    offsets = @get_offsets(@mget('orientation'))
    offsets['h'] = @plot_model.get('height')
    node.attr('transform',
      _.template('translate({{x}}, {{y}})', offsets))
    axis = d3.svg.axis()
    ticksize = @get_tick_size(@mget('orientation'))
    scale_converted = @convert_scale(@mget_ref('mapper').get('scale'))
    temp = axis.scale(scale_converted)
    temp.orient(@mget('orientation'))
      .ticks(@mget('ticks'))
      .tickSubdivide(@mget('tickSubdivide'))
      .tickSize(ticksize)
      .tickPadding(@mget('tickPadding'))
    node.call(axis)
    node.selectAll('.tick').attr('stroke', @mget('tick_color'))
class BarRendererView extends PlotWidget
  initialize : (options) ->
    safebind(this, @model, 'change', @request_render)
    safebind(this, @mget_ref('xmapper'), 'change', @request_render)
    safebind(this, @mget_ref('ymapper'), 'change', @request_render)
    safebind(this, @mget_ref('data_source'), 'change:data', @request_render)
    super(options)

  render_bars : (node, orientation) ->
    if orientation == 'vertical'
      index_mapper = @mget_ref('xmapper')
      value_mapper = @mget_ref('ymapper')
      value_field = @mget('yfield')
      index_field = @mget('xfield')
      index_coord = 'x'
      value_coord = 'y'
      index_dimension = 'width'
      value_dimension = 'height'
      indexpos = (x, width) =>
        @model.position_object_x(x, @mget('width'), width)
      valuepos = (y, height) =>
        @model.position_object_y(y, @mget('height'), height)
    else
      index_mapper = @mget_ref('ymapper')
      value_mapper = @mget_ref('xmapper')
      value_field = @mget('xfield')
      index_field = @mget('yfield')
      index_coord = 'y'
      value_coord = 'x'
      index_dimension = 'height'
      value_dimension = 'width'
      valuepos = (x, width) =>
        @model.position_object_x(x, @mget('width'), width)
      indexpos = (y, height) =>
        @model.position_object_y(y, @mget('height'), height)

    if not _.isObject(index_field)
      index_field = {'field' : index_field}
    data_source = @mget_ref('data_source')
    if _.has(index_field, 'field')
      if _.has(index_field, index_dimension)
        thickness = index_field[index_dimension]
      else
        thickness = 0.85 * @plot_model.get(index_dimension)
        thickness = thickness / data_source.get('data').length

      node.attr(index_coord,
            (d) =>
              ctr = index_mapper.map_screen(d[index_field['field']])
              return indexpos(ctr - thickness / 2.0, thickness))
        .attr(index_dimension, thickness)
    else
      node
        .attr(index_coord,
          (d) =>
            [start, end] = [index_mapper.map_screen(d[index_field['start']]),
              index_mapper.map_screen(d[index_field['end']])]
            [start, end] = [indexpos(start, 0), indexpos(end, 0)]
            return d3.min([xstart, end]))
        .attr(index_dimension,
          (d) =>
            [start, end] = [index_mapper.map_screen(d[index_field['start']]),
              index_mapper.map_screen(d[index_field['end']])]
            [start, end] = [indexpos(start, 0), indexpos(end, 0)]
            return d3.abs(end -start))
    node
      .attr(value_coord,
          (d) =>
            length = value_mapper.get('scale_factor') * d[value_field]
            location = value_mapper.map_screen(0)
            return valuepos(location, length))
      .attr(value_dimension,
          (d) =>
            return value_mapper.get('scale_factor') * d[value_field])
    node
      .attr('stroke', @mget('foreground_color'))
      .attr('fill', @mget('foreground_color'))
    return null

  render : () ->
    super()
    plot = @tag_d3('plotwindow', this.plot_id)
    node = @tag_d3('bar')
    if not node
      node = plot.append('g').attr('id', @tag_id('bar'))
    bars = node.selectAll('rect').data(@model.get_ref('data_source').get('data'))
    @render_bars(bars, @mget('orientation'))
    @render_bars(bars.enter().append('rect'), @mget('orientation'))
    return null


class LineRendererView extends PlotWidget
  initialize : (options) ->
    safebind(this, @model, 'change', @request_render)
    safebind(this, @mget_ref('xmapper'), 'change', @request_render)
    safebind(this, @mget_ref('ymapper'), 'change', @request_render)
    safebind(this, @mget_ref('data_source'), 'change:data', @request_render)
    super(options)

  render_line : (node) ->
    xmapper = @model.get_ref('xmapper')
    ymapper = @model.get_ref('ymapper')
    xfield = @model.get('xfield')
    yfield = @model.get('yfield')
    line = d3.svg.line()
      .x(
        (d) =>
          pos = xmapper.map_screen(d[xfield])
          return @model.xpos(pos)
      )
      .y(
        (d) =>
          pos = ymapper.map_screen(d[yfield])
          return @model.ypos(pos)
      )
    node.attr('stroke', @mget('color'))
      .attr('d', line)
    node.attr('fill', 'none')
    return null

  render : ->
    super()
    plot = @tag_d3('plotwindow', this.plot_id)
    node = @tag_d3('line')
    if not node
      node = plot.append('g').attr('id', @tag_id('line'))
    path = node.selectAll('path').data([@model.get_ref('data_source').get('data')])
    @render_line(path)
    @render_line(path.enter().append('path'))
    return null
window.scatter_render = 0
class ScatterRendererView extends PlotWidget
  request_render : () ->
    super()

  initialize : (options) ->
    super(options)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @mget_ref('xmapper'), 'change', @request_render)
    safebind(this, @mget_ref('ymapper'), 'change', @request_render)
    safebind(this, @mget_ref('data_source'), 'change', @request_render)

  fill_marks : (marks) ->
    window.scatter_render += 1
    color_field = @model.get('color_field')
    if color_field
      color_mapper = @model.get_ref('color_mapper')
      marks.attr('fill'
        ,
          (d) =>
            return color_mapper.map_screen(d[color_field])
      )
    else
      color = @model.get('foreground_color')
      marks.attr('fill', color)
    return null

  size_marks : (marks) ->
    marks.attr('r', @model.get('radius'))
    return null

  position_marks : (marks) ->
    marks.attr('cx', ((d, i) => return @screenx[i]))
      .attr('cy', ((d, i) => return @screeny[i]))
    return null

  get_marks : () ->
    plot = @tag_d3('plotwindow', this.plot_id)
    node = @tag_d3('scatter')
    if not node
      node = plot.append('g')
      .attr('id', @tag_id('scatter'))
    circles = node.selectAll(@model.get('mark'))
      .data(@model.get_ref('data_source').get('data'))

  get_new_marks : (marks) ->
    return marks.enter().append(@model.get('mark'))

  calc_buffer : (data) ->
    xmapper = @model.get_ref('xmapper')
    ymapper = @model.get_ref('ymapper')
    xfield = @model.get('xfield')
    yfield = @model.get('yfield')
    datax = (x[xfield] for x in data)
    screenx = xmapper.v_map_screen(datax)
    screenx = @model.v_xpos(screenx)
    datay = (y[yfield] for y in data)
    screeny = ymapper.v_map_screen(datay)
    screeny = @model.v_ypos(screeny)
    @screenx = screenx
    @screeny = screeny

  render : ->
    a = new Date()
    super()
    circles = @get_marks()
    @calc_buffer(@model.get_ref('data_source').get('data'))
    @position_marks(circles)
    @size_marks(circles)
    @fill_marks(circles)
    newcircles = @get_new_marks(circles)
    @position_marks(newcircles)
    @size_marks(newcircles)
    @fill_marks(newcircles)
    circles.exit().remove();
    b = new Date()
    console.log(b-a)
    return null


#  tools

class PanToolView extends PlotWidget
  initialize : (options) ->
    @dragging = false
    super(options)

  mouse_coords : () ->
    plot = @tag_d3('plotwindow', @plot_id)
    [x, y] = d3.mouse(plot[0][0])
    [x, y] = [@plot_model.rxpos(x), @plot_model.rypos(y)]
    return [x, y]

  _start_drag_mapper : (mapper) ->
    range = mapper.get_ref('data_range')
    range[@tag_id('start')] = range.get('start')
    range[@tag_id('end')] = range.get('end')

  _start_drag : () ->
    @dragging = true
    [@x, @y] = @mouse_coords()
    xmappers = (@model.resolve_ref(x) for x in @mget('xmappers'))
    ymappers = (@model.resolve_ref(x) for x in @mget('ymappers'))
    for xmap in xmappers
      @_start_drag_mapper(xmap)
    for ymap in ymappers
      @_start_drag_mapper(ymap)

  _drag_mapper : (mapper, diff) ->
    screen_range = mapper.get_ref('screen_range')
    data_range = mapper.get_ref('data_range')
    screenlow = screen_range.get('start') - diff
    screenhigh = screen_range.get('end') - diff
    [start, end] = [mapper.map_data(screenlow), mapper.map_data(screenhigh)]
    data_range.set({
      'start' : start
      'end' : end
    }, {'local' : true})

  _drag : (xdiff, ydiff) ->
    plot = @tag_d3('plotwindow', @plot_id)
    if _.isUndefined(xdiff) or _.isUndefined(ydiff)
      [x, y] = @mouse_coords()
      xdiff = x - @x
      ydiff = y - @y
      [@x, @y] = [x, y]
    xmappers = (@model.resolve_ref(x) for x in @mget('xmappers'))
    ymappers = (@model.resolve_ref(x) for x in @mget('ymappers'))
    for xmap in xmappers
      @_drag_mapper(xmap, xdiff)
    for ymap in ymappers
      @_drag_mapper(ymap, ydiff)

  bind_events : (plotview) ->
    @plotview = plotview
    node = @tag_d3('mainsvg', @plot_id)
    node.attr('pointer-events' , 'all')
    node.on("mousemove.drag"
      ,
        () =>
          if d3.event.shiftKey
            if not @dragging
              @_start_drag()
            else
              @_drag()
            d3.event.preventDefault()
            d3.event.stopPropagation()
          else
            @dragging = false
          return null
    )

class SelectionToolView extends PlotWidget
  initialize : (options) ->
    super(options)
    @selecting = false
    select_callback = _.debounce((() => @_select_data()),50)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @model, 'change', select_callback)
    for renderer in @mget('renderers')
      renderer = @model.resolve_ref(renderer)
      safebind(this, renderer, 'change', @request_render)
      safebind(this, renderer.get_ref('xmapper'), 'change', @request_render)
      safebind(this, renderer.get_ref('ymapper'), 'change', @request_render)
      safebind(this, renderer.get_ref('data_source'), 'change', @request_render)
      safebind(this, renderer, 'change', select_callback)
      safebind(this, renderer.get_ref('xmapper'), 'change', select_callback)
      safebind(this, renderer.get_ref('ymapper'), 'change', select_callback)


  bind_events : (plotview) ->
    @plotview = plotview
    node = @tag_d3('mainsvg', @plot_id)
    node.attr('pointer-events' , 'all')
    node.on("mousedown.selection"
      ,
        () =>
          @_stop_selecting()
    )
    node.on("mousemove.selection"
      ,
        () =>
          if d3.event.ctrlKey
            if not @selecting
              @_start_selecting()
            else
              @_selecting()
            d3.event.preventDefault()
            d3.event.stopPropagation()
          return null
    )

  mouse_coords : () ->
    plot = @tag_d3('plotwindow', @plot_id)
    [x, y] = d3.mouse(plot[0][0])
    [x, y] = [@plot_model.rxpos(x), @plot_model.rypos(y)]
    return [x, y]

  _stop_selecting : () ->
    @mset(
      start_x : null
      start_y : null
      current_x : null
      current_y : null
    )
    for renderer in @mget('renderers')
      @model.resolve_ref(renderer).get_ref('data_source').set('selecting', false)
      @model.resolve_ref(renderer).get_ref('data_source').save()
    @selecting = false
    node = @tag_d3('rect')
    if not(node is null)
      node.remove()

  _start_selecting : () ->
    [x, y] = @mouse_coords()
    @mset({'start_x' : x, 'start_y' : y, 'current_x' : null, 'current_y' : null})
    for renderer in @mget('renderers')
      data_source = @model.resolve_ref(renderer).get_ref('data_source')
      data_source.set('selecting', true)
      data_source.save()
    @selecting = true

  _get_selection_range : ->
    xrange = [@mget('start_x'), @mget('current_x')]
    yrange = [@mget('start_y'), @mget('current_y')]
    if @mget('select_x')
      xrange = [d3.min(xrange), d3.max(xrange)]
    else
      xrange = null
    if @mget('select_y')
      yrange = [d3.min(yrange), d3.max(yrange)]
    else
      yrange = null
    return [xrange, yrange]

  _selecting : () ->
    [x, y] = @mouse_coords()
    @mset({'current_x' : x, 'current_y' : y})
    return null

  _select_data : () ->
    if not @selecting
      return
    [xrange, yrange] = @_get_selection_range()
    datasources = {}
    datasource_selections = {}

    for renderer in @mget('renderers')
      datasource = @model.resolve_ref(renderer).get_ref('data_source')
      datasources[datasource.id] = datasource

    for renderer in @mget('renderers')
      datasource_id = @model.resolve_ref(renderer).get_ref('data_source').id
      _.setdefault(datasource_selections, datasource_id, [])
      selected = @model.resolve_ref(renderer).select(xrange, yrange)
      datasource_selections[datasource.id].push(selected)

    for own k,v of datasource_selections
      selected = _.intersect.apply(_, v)
      datasources[k].set('selected', selected)
      datasources[k].save()
    return null

  _render_shading : () ->
    [xrange, yrange] = @_get_selection_range()
    if _.any(_.map(xrange, _.isNullOrUndefined)) or
      _.any(_.map(yrange, _.isNullOrUndefined))
        return
    node = @tag_d3('rect')
    if node is null
      node = @tag_d3('plotwindow', @plot_id).append('rect')
        .attr('id', @tag_id('rect'))
    if xrange
      width = xrange[1] - xrange[0]
      node.attr('x', @plot_model.position_child_x(width, xrange[0]))
        .attr('width', width)
    else
      width = @plot_model.get('width')
      node.attr('x',  @plot_model.position_child_x(xrange[0]))
        .attr('width', width)
    if yrange
      height = yrange[1] - yrange[0]
      node.attr('y', @plot_model.position_child_y(height, yrange[0]))
        .attr('height', height)
    else
      height = @plot_model.get('height')
      node.attr('y', @plot_model.position_child_y(height, yrange[0]))
        .attr('height', height)
    node.attr('fill', '#000').attr('fill-opacity', 0.1)

  render : () ->
    super()
    @_render_shading()
    return null

class OverlayView extends PlotWidget
  initialize : (options) ->
    @renderer_ids = options['renderer_ids']
    super(options)

  bind_events : (plotview) ->
    @plotview = plotview
    return null

class ScatterSelectionOverlayView extends OverlayView
  request_render : () ->
    super()
  initialize : (options) ->
    super(options)
    for renderer in @mget('renderers')
      renderer = @model.resolve_ref(renderer)
      safebind(this, renderer, 'change', @request_render)
      safebind(this, renderer.get_ref('xmapper'), 'change', @request_render)
      safebind(this, renderer.get_ref('ymapper'), 'change', @request_render)
      safebind(this, renderer.get_ref('data_source'), 'change', @request_render)

  render : () ->
    window.overlay_render += 1
    super()
    for temp in _.zip(@mget('renderers'), @renderer_ids)
      [renderer, viewid] = temp
      renderer = @model.resolve_ref(renderer)
      selected = {}
      if renderer.get_ref('data_source').get('selecting') == false
        #skip data sources which are not selecting'
        continue
      for idx in renderer.get_ref('data_source').get('selected')
        selected[String(idx)] = true
      node = @tag_d3('scatter', viewid)
      node.selectAll(renderer.get('mark')).filter((d, i) =>
        return not selected[String(i)]
      ).attr('fill', @mget('unselected_color'))

      marks = node.selectAll(renderer.get('mark')).filter((d, i) =>
        return selected[String(i)]
      )
      @plotview.renderers[renderer.id].fill_marks(marks)
    return null


window.overlay_render = 0
class ZoomToolView extends PlotWidget
  initialize : (options) ->
    super(options)

  mouse_coords : () ->
    plot = @tag_d3('plotwindow', @plot_id)
    [x, y] = d3.mouse(plot[0][0])
    [x, y] = [@plot_model.rxpos(x), @plot_model.rypos(y)]
    return [x, y]

  _zoom_mapper : (mapper, eventpos, factor) ->
    screen_range = mapper.get_ref('screen_range')
    data_range = mapper.get_ref('data_range')
    screenlow = screen_range.get('start')
    screenhigh = screen_range.get('end')
    start = screenlow - (eventpos - screenlow) * factor
    end = screenhigh + (screenhigh - eventpos) * factor
    [start, end] = [mapper.map_data(start), mapper.map_data(end)]
    data_range.set({
      'start' : start
      'end' : end
    }, {'local' : true})

  _zoom : () ->
    [x, y] = @mouse_coords()
    factor = - @mget('speed') * d3.event.wheelDelta
    xmappers = (@model.resolve_ref(mapper) for mapper in @mget('xmappers'))
    ymappers = (@model.resolve_ref(mapper) for mapper in @mget('ymappers'))
    for xmap in xmappers
      @_zoom_mapper(xmap, x, factor)
    for ymap in ymappers
      @_zoom_mapper(ymap, y, factor)

  bind_events : (plotview) ->
    @plotview = plotview
    node = @tag_d3('mainsvg', @plot_id)
    node.attr('pointer-events' , 'all')
    node.on("mousewheel.zoom"
      ,
        () =>
          @_zoom()
          d3.event.preventDefault()
          d3.event.stopPropagation()
    )

Bokeh.PlotWidget = PlotWidget
Bokeh.PlotView = PlotView
Bokeh.ScatterRendererView = ScatterRendererView
Bokeh.LineRendererView = LineRendererView
Bokeh.BarRendererView = BarRendererView
Bokeh.GridPlotContainerView = GridPlotContainerView
Bokeh.PanToolView = PanToolView
Bokeh.ZoomToolView = ZoomToolView
Bokeh.SelectionToolView = SelectionToolView
Bokeh.ScatterSelectionOverlayView = ScatterSelectionOverlayView
Bokeh.D3LinearAxisView = D3LinearAxisView