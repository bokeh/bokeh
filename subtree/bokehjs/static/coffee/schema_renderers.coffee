base = require("./base")
Collections = base.Collections
HasParent = base.HasParent
PlotWidget = base.PlotWidget
safebind = base.safebind

mapper = require("./mapper")
LinearMapper = mapper.LinearMapper

# ###class : XYRendererView
class XYRendererView extends PlotWidget
  # This class is the base class for  all 2d renderers
  # half of it is for setting up mappers,
  # The other half (`@select`,  and `@calc_buffer`)
  # only make sense for our schema based renderers
  # (line/scatter) because the glyph renderer allows
  # for specifying data space and
  # screen space offsets, which aren't handled in those methods.
  # so we probably need to split this up somehow

  initialize : (options) ->
    super(options)
    @set_xmapper()
    @set_ymapper()

  bind_bokeh_events : () ->
    safebind(this, @model, 'change', @request_render)
    safebind(this, @plot_view.viewstate, 'change', @request_render)
    safebind(this, @mget_obj('data_source'), 'change', @request_render)
    safebind(this, @model, 'change:xdata_range', @set_xmapper)
    safebind(this, @model, 'change:ydata_range', @set_ymapper)
    safebind(this, @mget_obj('xdata_range'), 'change', @request_render)
    safebind(this, @mget_obj('ydata_range'), 'change', @request_render)

  set_xmapper : () ->
    @xmapper = new LinearMapper({},
      data_range : @mget_obj('xdata_range')
      viewstate : @plot_view.viewstate
      screendim : 'width'
    )
    @request_render()

  set_ymapper: () ->
    @ymapper = new LinearMapper({},
      data_range : @mget_obj('ydata_range')
      viewstate : @plot_view.viewstate
      screendim : 'height'
    )
    @request_render()
  # ### method : XYRendererView::select
  select : (xscreenbounds, yscreenbounds) ->
    # given x/y screen coordinates, select
    # points on the data source that fall within
    # these bounds.  This does not work for glyph
    # based renderers
    if xscreenbounds
      mapper = @xmapper
      xdatabounds = [mapper.map_data(xscreenbounds[0]),
        mapper.map_data(xscreenbounds[1])]
    else
      xdatabounds = null
    if yscreenbounds
      mapper = @ymapper
      ydatabounds = [mapper.map_data(yscreenbounds[0]),
        mapper.map_data(yscreenbounds[1])]
    else
      ydatabounds = null
    func = (xval, yval) ->
      val = ((xdatabounds is null) or
        (xval > xdatabounds[0] and xval < xdatabounds[1])) and
          ((ydatabounds is null) or
          (yval > ydatabounds[0] and yval < ydatabounds[1]))
      return val
    source = @mget_obj('data_source')
    return source.select([@mget('xfield'), @mget('yfield')], func)

  # ### method : XYRendererView::calc_buffer

  calc_buffer : (data) ->
    # calculates screen coordinates for data.  Only works
    # for schema based renderers(line/scatter)
    "use strict";
    pv = @plot_view
    pvo = @plot_view.options
    own_options = @options
    xfield = @model.get('xfield')
    yfield = @model.get('yfield')

    datax = (x[xfield] for x in data)
    screenx = @xmapper.v_map_screen(datax)
    screenx = pv.viewstate.v_xpos(screenx)

    datay = (y[yfield] for y in data)
    screeny = @ymapper.v_map_screen(datay)
    screeny = pv.viewstate.v_ypos(screeny)

    @screeny = screeny
    @screenx = screenx

class LineRendererView extends XYRendererView
  render : ->
    super()
    data = @model.get_obj('data_source').get('data')
    @calc_buffer(data)

    @plot_view.ctx.fillStyle = @mget('foreground_color')
    @plot_view.ctx.strokeStyle = @mget('foreground_color')
    @plot_view.ctx.beginPath()
    @plot_view.ctx.moveTo(@screenx[0], @screeny[0])
    for idx in [1..@screenx.length]
      x = @screenx[idx]
      y = @screeny[idx]
      if isNaN(x) or isNaN(y)
        @plot_view.ctx.stroke()
        @plot_view.ctx.beginPath()
        continue
      @plot_view.ctx.lineTo(x, y)
    @plot_view.ctx.stroke()
    @render_end()
    return null


class ScatterRendererView extends XYRendererView
  #FIXME: render_canvas
  render : ->
    "use strict";
    super()
    selected = {}
    sel_idxs = @model.get_obj('data_source').get('selected')
    console.log('sel_idxs', sel_idxs)
    if sel_idxs.length == 0
      selecting = false
    else
      selecting = true
    for idx in sel_idxs
      selected[idx] = true
    data = @model.get_obj('data_source').get('data')
    @calc_buffer(data)
    @plot_view.ctx.beginPath()
    foreground_color = @mget('foreground_color')
    unselected_color = @mget('unselected_color')
    color_field = @mget('color_field')
    ctx = @plot_view.ctx
    if color_field
      color_mapper = @model.get_obj('color_mapper')
      color_arr = @model.get('color_field')
    mark_type = @mget('mark')
    for idx in [0..data.length]
      if selecting and not selected[idx]
        unselected_color = @mget('unselected_color')
        @plot_view.ctx.strokeStyle = unselected_color
        @plot_view.ctx.fillStyle = unselected_color
      else if color_field
        comp_color = color_mapper.map_screen(idx)
        @plot_view.ctx.strokeStyle = comp_color
        @plot_view.ctx.fillStyle = comp_color
      else
        @plot_view.ctx.strokeStyle = foreground_color
        @plot_view.ctx.fillStyle = foreground_color
      if mark_type == "square"
        @addPolygon(@screenx[idx], @screeny[idx])
      else
        @addCircle(@screenx[idx], @screeny[idx])
    @plot_view.ctx.stroke()
    @render_end()
    return null

class XYRenderer extends HasParent

XYRenderer::defaults = _.clone(XYRenderer::defaults)
_.extend(XYRenderer::defaults , {
  xdata_range : null
  ydata_range : null
  xfield : null
  yfield : null
  data_source : null
  #axes fit here
})

class LineRenderer extends XYRenderer
  type : 'LineRenderer'
  default_view : LineRendererView
LineRenderer::defaults = _.clone(LineRenderer::defaults)
_.extend(LineRenderer::defaults
  ,
    xmapper : null,
    ymapper: null,
    xfield : null,
    yfield : null,
    color : "#000",
)

class LineRenderers extends Backbone.Collection
  model : LineRenderer


class ScatterRenderer extends XYRenderer
  type : 'ScatterRenderer'
  default_view : ScatterRendererView

ScatterRenderer::defaults = _.clone(ScatterRenderer::defaults)
_.extend(ScatterRenderer::defaults, {
    data_source : null,
    xmapper : null,
    ymapper: null,
    xfield : null,
    yfield : null,
    #if colorfield, we use a color mapper
    colormapper : null,
    colorfield : null,
    mark : 'circle',
})

class ScatterRenderers extends Backbone.Collection
  model : ScatterRenderer

exports.scatterrenderers = new ScatterRenderers
exports.linerenderers = new LineRenderers

exports.ScatterRenderer = ScatterRenderer
exports.ScatterRendererView = ScatterRendererView
exports.LineRenderer = LineRenderer
exports.LineRendererView = LineRendererView
exports.XYRenderer = XYRenderer
exports.XYRendererView = XYRendererView
