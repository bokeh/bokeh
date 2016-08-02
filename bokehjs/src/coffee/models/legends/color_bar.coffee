_ = require "underscore"

LinearMapper = require "../mappers/linear_mapper"
LogMapper = require "../mappers/log_mapper"
Range1d = require "../ranges/range1d"
BasicTicker = require "../tickers/basic_ticker"
BasicTickFormatter = require "../formatters/basic_tick_formatter"
GuideRenderer = require "../renderers/guide_renderer"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"

class ColorBarView extends Renderer.View
  initialize: (options) ->
    super(options)
    @_set_data()
    debugger;

  _set_data: () ->
    if @mget('orientation') == 'vertical'
      gradient = [_.map([0...10], () -> return i) for i in [0...10]]
    else
      gradient = [[0...10] for i in [0...10]]

    canvas = document.createElement('canvas')
    canvas.width = 10
    canvas.height = 10
    image_ctx = canvas.getContext('2d')
    image_data = image_ctx.getImageData(0, 0, 10, 10)

    cmap = @mget('color_mapper')
    buf = cmap.v_map_screen(_.flatten(gradient))
    buf8 = new Uint8ClampedArray(buf)
    image_data.data.set(buf8)

    image_ctx.putImageData(image_data, 0, 0)
    @image_data = canvas

  _get_scale_coords: () ->
    legend_margin = @mget('legend_margin')
    legend_padding = @mget('legend_padding')
    # legend_spacing = @mget('legend_spacing') # I don't think this is relevant
    label_standoff =  @mget('label_standoff')

    if @mget("orientation") == "vertical"
      legend_height = @mget('legend_height')
      legend_width = @mget('legend_width')
    else
      legend_height = @mget('legend_width')
      legend_width = @mget('legend_height')

    location = @mget('location')
    h_range = @plot_view.frame.get('h_range')
    v_range = @plot_view.frame.get('v_range')

    if _.isString(location)
      switch location
        when 'top_left'
          x = h_range.get('start') + legend_margin
          y = v_range.get('end') - legend_margin
        when 'top_center'
          x = (h_range.get('end') + h_range.get('start'))/2 - legend_width/2
          y = v_range.get('end') - legend_margin
        when 'top_right'
          x = h_range.get('end') - legend_margin - legend_width
          y = v_range.get('end') - legend_margin
        when 'right_center'
          x = h_range.get('end') - legend_margin - legend_width
          y = (v_range.get('end') + v_range.get('start'))/2 + legend_height/2
        when 'bottom_right'
          x = h_range.get('end') - legend_margin - legend_width
          y = v_range.get('start') + legend_margin + legend_height
        when 'bottom_center'
          x = (h_range.get('end') + h_range.get('start'))/2 - legend_width/2
          y = v_range.get('start') + legend_margin + legend_height
        when 'bottom_left'
          x = h_range.get('start') + legend_margin
          y = v_range.get('start') + legend_margin + legend_height
        when 'left_center'
          x = h_range.get('start') + legend_margin
          y = (v_range.get('end') + v_range.get('start'))/2 + legend_height/2
        when 'center'
          x = (h_range.get('end') + h_range.get('start'))/2 - legend_width/2
          y = (v_range.get('end') + v_range.get('start'))/2 + legend_height/2
    else if _.isArray(location) and location.length == 2
      [x, y] = location

    sx = @plot_view.canvas.vx_to_sx(x)
    sy = @plot_view.canvas.vy_to_sy(y)

    return {sx: sx, sy: sy, width: legend_width, height: legend_height}

  render: () ->
    if @model.visible == false
      return

    loc = @_get_scale_coords()

    ctx = @plot_view.canvas_view.ctx
    @_draw_image(ctx)
    @_draw_major_ticks(ctx)
    @_draw_minor_ticks(ctx)
    @_draw_major_labels(ctx)

  _draw_image: (ctx) ->
    geom = @_get_scale_coords()
    # if we want a bounding box around bar + ticks + labels
    # @visuals.background_fill.set_value(ctx)
    # ctx.fillRect(75, 75, @mget('legend_width')+60, @mget('legend_height')+60)
    @visuals.border_line.set_value(ctx)
    ctx.save()
    ctx.drawImage(@image_data, geom.sx, geom.sy, geom.width, geom.height)
    ctx.rect(geom.sx, geom.sy, geom.width, geom.height)
    ctx.stroke()
    ctx.restore()

  _draw_major_ticks: (ctx) ->
    if not @visuals.major_tick_line.doit
      return

    geom = @_get_scale_coords()

    coords = @mget('tick_coords').major

    [sx, sy] = [coords[0], coords[1]]
    [nx, ny] = @mget('normals')

    tin = @mget('major_tick_in')
    tout = @mget('major_tick_out')

    [x_offset, y_offset] = [geom.sx + geom.width * nx, geom.sy + geom.height * ny]

    ctx.save()
    ctx.translate(x_offset, y_offset)
    @visuals.major_tick_line.set_value(ctx)
    for i in [0...sx.length]
      ctx.beginPath()
      ctx.moveTo(Math.round(sx[i]+nx*tout), Math.round(sy[i]+ny*tout))
      ctx.lineTo(Math.round(sx[i]-nx*tin), Math.round(sy[i]-ny*tin))
      ctx.stroke()
    ctx.restore()

  _draw_minor_ticks: (ctx) ->
    if not @visuals.minor_tick_line.doit
      return

    geom = @_get_scale_coords()

    coords = @mget('tick_coords').minor

    [sx, sy] = [coords[0], coords[1]]
    [nx, ny] = @mget('normals')

    tin = @mget('minor_tick_in')
    tout = @mget('minor_tick_out')

    [x_offset, y_offset] = [geom.sx + geom.width * nx, geom.sy + geom.height * ny]

    ctx.save()
    ctx.translate(x_offset, y_offset)

    @visuals.minor_tick_line.set_value(ctx)
    for i in [0...sx.length]
      ctx.beginPath()
      ctx.moveTo(Math.round(sx[i]+nx*tout), Math.round(sy[i]+ny*tout))
      ctx.lineTo(Math.round(sx[i]-nx*tin), Math.round(sy[i]-ny*tin))
      ctx.stroke()
    ctx.restore()

  _draw_major_labels: (ctx) ->

    geom = @_get_scale_coords()

    coords = @mget('tick_coords').major

    [sx, sy] = [coords[0], coords[1]]
    [nx, ny] = @mget('normals')

    [x_offset, y_offset] = [geom.sx + geom.width * nx, geom.sy + geom.height * ny]

    standoff = (@mget('label_standoff') + @mget('major_tick_out'))
    [x_standoff, y_standoff] = [standoff*nx, standoff*ny]

    switch @mget('orientation')
      when "vertical" then labels = coords[1]
      when "horizontal" then labels = coords[0]
    labels = @mget('formatter').doFormat(labels)

    @visuals.major_label_text.set_value(ctx)

    ctx.save()
    ctx.translate(x_offset + x_standoff, y_offset + y_standoff)
    for i in [0...sx.length]
      ctx.fillText(labels[i],
                   Math.round(sx[i]+nx*@mget('label_standoff')),
                   Math.round(sy[i]+ny*@mget('label_standoff')))
    ctx.restore()

class ColorBar extends GuideRenderer.Model
  default_view: ColorBarView

  type: 'ColorBar'

  @mixins ['text:major_label_',
           'line:major_tick_',
           'line:minor_tick_',
           'line:border_',
           'fill:background_',
  ]

  @define {
      location:       [ p.Any,            'top_right' ]
      orientation:    [ p.Orientation,    'vertical'  ]
      legend_height:  [ p.Number,         400         ]
      legend_width:   [ p.Number,         50          ]
      ticker:         [ p.Instance,    () -> new BasicTicker.Model()         ]
      formatter:      [ p.Instance,    () -> new BasicTickFormatter.Model()  ]
      color_mapper:   [ p.Instance                    ]
      label_standoff: [ p.Number,         5           ]
      legend_margin:  [ p.Number,         20          ]
      legend_padding: [ p.Number,         10          ]
      # legend_spacing: [ p.Number,         3           ]
      major_tick_in:  [ p.Number,         2           ]
      major_tick_out: [ p.Number,         6           ]
      minor_tick_in:  [ p.Number,         0           ]
      minor_tick_out: [ p.Number,         4           ]

  }

  @override {
    background_fill_color: "#FAEBD7"
    background_fill_alpha: 0.95
    major_label_text_align: "center"
    major_label_text_baseline: "middle"
    major_label_text_font_size: "8pt"
  }

  initialize: (attrs, options) ->
    super(attrs, options)

    @define_computed_property('value_mapper', @_value_mapper, true)
    @define_computed_property('normals', @_normals, true)

    @define_computed_property('tick_coords', @_tick_coords, true)
    @add_dependencies('tick_coords', this, ['value_mapper', 'normals'])

  _normals: () ->
    if @get('orientation') == 'vertical'
      [i, j] = [1, 0]
    else
      [i, j] = [0, 1]
    return [i, j]

  _value_mapper: () ->
    switch @get('orientation')
      when "vertical" then target_end = @get('legend_height')
      when "horizontal" then target_end = @get('legend_height')

    mapping = {
      'source_range': new Range1d.Model({
        start: @get('color_mapper').get('low')
        end: @get('color_mapper').get('high')
      })
      'target_range': new Range1d.Model({
        start: 0
        end: @get('legend_height')})
    }

    switch @get('color_mapper').type
      when "LinearColorMapper" then mapper = new LinearMapper.Model(mapping)
      when "LogColorMapper" then mapper = new LogMapper.Model(mapping)

    return mapper

  _tick_coords: () ->
    [i, j] = @get('normals')
    mapper = @get('value_mapper')

    [start, end] = [@get('color_mapper').get('low'), @get('color_mapper').get('high')]

    ticks = @get('ticker').get_ticks(start, end, null, 10)

    majors = ticks.major
    minors = ticks.minor

    major_coords = [[], []]
    minor_coords = [[], []]

    for ii in [0...majors.length]
      if majors[ii] < start or majors[ii] > end
        continue
      major_coords[i].push(majors[ii])
      major_coords[j].push(0)

    for ii in [0...minors.length]
      if minors[ii] < start or minors[ii] > end
        continue
      minor_coords[i].push(minors[ii])
      minor_coords[j].push(0)

    major_coords[0] = mapper.v_map_to_target(major_coords[0])
    major_coords[1] = mapper.v_map_to_target(major_coords[1])

    minor_coords[0] = mapper.v_map_to_target(minor_coords[0])
    minor_coords[1] = mapper.v_map_to_target(minor_coords[1])

    return {
      "major": major_coords
      "minor": minor_coords
    }

module.exports =
  Model: ColorBar
  View: ColorBarView
