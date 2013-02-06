base = require("./base")
ticks = require("./ticks")

safebind = base.safebind
HasParent = base.HasParent
PlotWidget = base.PlotWidget

mapper = require("./mapper")
LinearMapper = mapper.LinearMapper

class LinearAxisView extends PlotWidget
  initialize : (options) ->
    super(options)
    @plot_view = options.plot_view
    if @mget('orientation') == 'top' or @mget('orientation') == 'bottom'
      @screendim = 'width'
    else
      @screendim = 'height'
    @set_mapper()

  bind_bokeh_events : () ->
    safebind(this, @plot_model, 'change', @request_render)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @model, 'change:data_range', @set_mapper)
    safebind(this, @mget_obj('data_range'), 'change', @request_render)

  set_mapper : () ->
    @mapper = new LinearMapper({},
      data_range : @mget_obj('data_range')
      viewstate : @plot_view.viewstate
      screendim : @screendim
    )
    @request_render()

  tagName : 'div'
  get_offsets : (orientation) ->
    offsets =
      x : 0
      y : 0
    if orientation == 'bottom'
      offsets['y'] += @plot_view.viewstate.get('height')
    return offsets

  get_tick_size : (orientation) ->
    if (not _.isNull(@mget('tickSize')))
      return @mget('tickSize')
    else
      if orientation == 'bottom'
        return -@plot_view.viewstate.get('height')
      else
        return -@plot_view.viewstate.get('width')

  render : ->
    super()
    unselected_color = "#ccc"
    @plot_view.ctx.fillStyle = unselected_color
    @plot_view.ctx.strokeStyle = unselected_color
    if @mget('orientation') in ['bottom', 'top']
      @render_x()
      @render_end()
      return
    @render_y()
    @render_end()
    return

  tick_label : (tick) ->
    return tick.toString()

  render_x : ->
    can_ctx = @plot_view.x_can_ctx
    data_range = @mapper.data_range
    interval = ticks.auto_interval(
      data_range.get('start'), data_range.get('end')
    )
    range = data_range.get('end') - data_range.get('start')
    x_scale = @mapper.get('scalestate')[0]
    last_tick_end = 10000
    [first_tick, last_tick] = ticks.auto_bounds(
      data_range.get('start'), data_range.get('end'), interval)
    current_tick = first_tick
    x_ticks = []
    last_tick_end = 0
    can_ctx.clearRect(0, 0,  @plot_view.viewstate.get('width'),
      @plot_view.viewstate.get('height'))
    while current_tick <= last_tick
      x_ticks.push(current_tick)
      text_width = can_ctx.measureText(@tick_label(current_tick)).width
      x = @plot_view.viewstate.xpos(@mapper.map_screen(current_tick))
      txtpos = ( x - (text_width/2))
      if txtpos > last_tick_end
        can_ctx.fillText(@tick_label(current_tick), txtpos, 20)
        last_tick_end = (txtpos + text_width) + 10
      @plot_view.ctx.beginPath()
      @plot_view.ctx.moveTo(x, 0)
      @plot_view.ctx.lineTo(x, @plot_view.viewstate.get('height'))
      @plot_view.ctx.stroke()
      current_tick += interval
    can_ctx.stroke()
    @render_end()

  DEFAULT_TEXT_HEIGHT : 8
  render_y : ->
    can_ctx = @plot_view.y_can_ctx
    data_range = @mapper.data_range
    interval = ticks.auto_interval(
      data_range.get('start'), data_range.get('end'))
    range = data_range.get('end') - data_range.get('start')
    y_scale = @mapper.get('scalestate')[0]
    [first_tick, last_tick] = ticks.auto_bounds(
      data_range.get('start'), data_range.get('end'), interval)
    current_tick = first_tick
    y_ticks = []
    last_tick_end = 10000
    can_ctx.clearRect(0, 0, @plot_view.viewstate.get('width'),
      @plot_view.viewstate.get('height'))
    while current_tick <= last_tick
      y_ticks.push(current_tick)
      y = @plot_view.viewstate.ypos(@mapper.map_screen(current_tick))
      txtpos = (y + (@DEFAULT_TEXT_HEIGHT/2))
      if y < last_tick_end
        can_ctx.fillText(@tick_label(current_tick), 0, y)
        last_tick_end = (y + @DEFAULT_TEXT_HEIGHT) + 10
      @plot_view.ctx.beginPath()
      @plot_view.ctx.moveTo(0, y)
      @plot_view.ctx.lineTo(@plot_view.viewstate.get('width'), y)
      @plot_view.ctx.stroke()
      current_tick += interval
    can_ctx.stroke()
    @render_end()

class LinearDateAxisView extends LinearAxisView
  tick_label : (tick) ->
    start = @mget_obj('data_range').get('start')
    end = @mget_obj('data_range').get('end')
    one_day = 3600 * 24 *1000
    tick = new Date(tick)
    if (Math.abs(end - start))  > (one_day * 2)
      return tick.toLocaleDateString()
    else
      return tick.toLocaleTimeString()


class LegendRendererView extends PlotWidget
  render : ->
    super()
    #data = @model.get_obj('data_source').get('data')
    #@calc_buffer(data)
    can_ctx = @plot_view.ctx


    coords = @model.get('coords')
    [x, y] = coords
    if x < 0
      start_x = @plot_view.viewstate.get('width') + x
    else
      start_x = x

    if y < 0
      start_y = @plot_view.viewstate.get('height') + y
    else
      start_y = y


    #width = can_ctx.measureText("blahblah").width
    text_height = 20

    legend_height = text_height * @model.get('legends').length
    legend_width = 100


    legend_offset_x = start_x
    legend_offset_y = start_y

    can_ctx.strokeStyle = 'black'
    can_ctx.strokeRect(legend_offset_x, legend_offset_y, legend_width, legend_height)
    can_ctx.fillStyle = 'white'
    can_ctx.fillRect(legend_offset_x, legend_offset_y, legend_width, legend_height)
    can_ctx.strokeStyle = 'black'
    can_ctx.fillStyle = 'black'

    legend_offset_x += 5
    legend_offset_y += 10

    for l in @model.get('legends')
      console.log("l.name", l.name, l, legend_offset_x, legend_offset_y)
      can_ctx.strokeStyle = l.color
      can_ctx.fillStyle = l.color

      can_ctx.fillText(l.name, legend_offset_x, legend_offset_y)
      legend_offset_y += text_height
    can_ctx.stroke()
    @render_end()
    return null


class LinearAxis extends HasParent
  type : 'LinearAxis'
  default_view : LinearAxisView
  display_defaults :
    tick_color : '#fff'

LinearAxis::defaults = _.clone(LinearAxis::defaults)
_.extend(LinearAxis::defaults
  ,
    data_range : null
    orientation : 'bottom'
    ticks : 10
    ticksSubdivide : 1
    tickSize : null
    tickPadding : 3
)
class LinearAxes extends Backbone.Collection
  model : LinearAxis

class LinearDateAxis extends LinearAxis
  type : "LinearDateAxis"
  default_view : LinearDateAxisView

class LinearDateAxes extends Backbone.Collection
  model : LinearDateAxis

class Legend extends HasParent
  type : "Legend"
  default_view : LegendRendererView
  defaults :
    renderers : []
    unselected_color : "#ccc"
    positions :
      top_left     : [ 20,  20]
      top_right    : [-80,  20]
      bottom_left  : [ 20, -60]
      bottom_right : [-80, -60]
    position : "top_left"

  initialize : (options) ->
    super(options)
    console.log("options", options)
    ptype = typeof options.position
    if ptype == "string"
      @set('coords', @defaults.positions[options.position])
    else if ptype == "object"
      @set('coords',  options.position)

class Legends extends Backbone.Collection
  model : Legend

exports.linearaxes = new LinearAxes
exports.lineardateaxes = new LinearDateAxes
exports.legends = new Legends

exports.LinearAxisView = LinearAxisView
exports.LinearDateAxisView = LinearDateAxisView
exports.LegendRendererView = LegendRendererView
