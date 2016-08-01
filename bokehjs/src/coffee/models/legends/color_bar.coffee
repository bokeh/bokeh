_ = require "underscore"

LinearMapper = require "../mappers/linear_mapper"
LogMapper = require "../mappers/log_mapper"
Range1d = require "../ranges/range1d"
AdaptiveTicker = require "../tickers/adaptive_ticker"
GuideRenderer = require "../renderers/guide_renderer"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"

class ColorBarView extends Renderer.View
  initialize: (options) ->
    super(options)
    @_set_data()

    # needs refactor to use image_bounds and legend_size, not hardcode
    bounds = {
      'source_range': new Range1d.Model({start: 0, end: 10})
      'target_range': new Range1d.Model({start: 0, end: 400})
    }

    switch @mget('color_mapper').type
      when "LinearColorMapper" then @_range = new LinearMapper.Model(bounds)
      when "LogColorMapper" then @_range = new LogMapper.Model(bounds)

  _set_data: () ->
    # Probably move to computed property
    if @mget('orientation') == 'vertical'
      a = [_.map([0...10], () -> return i) for i in [0...10]]
    else
      a = [[0...10] for i in [0...10]]

    b = _.flatten(a)

    canvas = document.createElement('canvas')
    canvas.width = 10
    canvas.height = 10
    image_ctx = canvas.getContext('2d')
    image_data = image_ctx.getImageData(0, 0, 10, 10)

    cmap = @mget('color_mapper')
    buf = cmap.v_map_screen(b)
    buf8 = new Uint8ClampedArray(buf)
    image_data.data.set(buf8)

    image_ctx.putImageData(image_data, 0, 0)
    @image_data = canvas

  render: () ->
    if @model.visible == false
      return

    ctx = @plot_view.canvas_view.ctx
    @_draw_image(ctx)
    @_draw_major_ticks(ctx)
    @_draw_minor_ticks(ctx)
    @_draw_major_labels(ctx)

  _draw_image: (ctx) ->
    @visuals.border_line.set_value(ctx)
    ctx.save()
    ctx.drawImage(@image_data, 100, 100, @mget('legend_width'), @mget('legend_height'))
    ctx.rect(100, 100, @mget('legend_width'), @mget('legend_height'))
    ctx.stroke()
    ctx.restore()

  _draw_major_ticks: (ctx) ->
    if not @visuals.major_tick_line.doit
      return
    coords = @mget('tick_coords')
    [x, y] = coords.major
    [sx, sy] = [@_range.v_map_to_target(x), @_range.v_map_to_target(y)]
    # [nx, ny] = @mget('normals')
    # [xoff, yoff]  = @mget('offsets')
    [nx, ny] = [1, 0]
    [xoff, yoff] = [150, 100]

    tin = @mget('major_tick_in')
    tout = @mget('major_tick_out')
    @visuals.major_tick_line.set_value(ctx)
    for i in [0...sx.length]
      ctx.beginPath()
      ctx.moveTo(Math.round(sx[i]+nx*tout+nx*xoff), Math.round(sy[i]+ny*tout+ny*yoff+100))
      ctx.lineTo(Math.round(sx[i]-nx*tin+nx*xoff), Math.round(sy[i]-ny*tin+ny*yoff+100))
      ctx.stroke()

  _draw_minor_ticks: (ctx) ->
    if not @visuals.minor_tick_line.doit
      return
    coords = @mget('tick_coords')
    [x, y] = coords.minor
    [sx, sy] = [@_range.v_map_to_target(x), @_range.v_map_to_target(y)]
    # [nx, ny] = @mget('normals')
    # [xoff, yoff]  = @mget('offsets')
    [nx, ny] = [1, 0]
    [xoff, yoff] = [150, 100]
    tin = @mget('minor_tick_in')
    tout = @mget('minor_tick_out')
    @visuals.minor_tick_line.set_value(ctx)
    for i in [0...sx.length]
      ctx.beginPath()
      ctx.moveTo(Math.round(sx[i]+nx*tout+nx*xoff), Math.round(sy[i]+ny*tout+ny*yoff+100))
      ctx.lineTo(Math.round(sx[i]-nx*tin+nx*xoff), Math.round(sy[i]-ny*tin+ny*yoff+100))
      ctx.stroke()

  _draw_major_labels: (ctx) ->
    coords = @mget('tick_coords')
    [x, y] = coords.major
    # [sx, sy] = @plot_view.map_to_screen(x, y, @_x_range_name, @_y_range_name)
    # [nx, ny] = @mget('normals')
    # [xoff, yoff]  = @mget('offsets')
    [sx, sy] = [@_range.v_map_to_target(x), @_range.v_map_to_target(y)]
    # [nx, ny] = @mget('normals')
    # [xoff, yoff]  = @mget('offsets')
    [nx, ny] = [1, 0]
    [xoff, yoff] = [150, 100]
    # dim = @mget('dimension')
    # side = @mget('panel_side')
    # orient = @mget('orientation')
    # if _.isString(orient)
    #   angle = @model.panel.get_label_angle_heuristic(orient)
    # else
    #   angle = -orient
    angle = null
    # standoff = @_tick_extent() + @mget('major_label_standoff')
    standoff = 1

    if @mget('formatter')?
      labels = @mget('formatter').doFormat(coords.major[1])
    else
      labels = coords.major[1]

    @visuals.major_label_text.set_value(ctx)
    # @model.panel.apply_label_text_heuristics(ctx, orient)
    for i in [0...sx.length]
      # if angle
      #   ctx.translate(sx[i]+nx*standoff+nx*xoff, sy[i]+ny*standoff+ny*yoff)
      #   ctx.rotate(angle)
      #   ctx.fillText(labels[i], 0, 0)
      #   ctx.rotate(-angle)
      #   ctx.translate(-sx[i]-nx*standoff+nx*xoff, -sy[i]-ny*standoff+ny*yoff)
      # else
      #   ctx.fillText(labels[i], Math.round(sx[i]+nx*standoff+nx*xoff), Math.round(sy[i]+ny*standoff+ny*yoff))

      ctx.fillText(labels[i],
                   Math.round(sx[i]+nx*standoff+nx*xoff+10),
                   Math.round(sy[i]+ny*standoff+ny*yoff+110))


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
      orientation:    [ p.Orientation,    'vertical'  ]
      legend_height:  [ p.Number,         400         ]
      legend_width:   [ p.Number,         50          ]
      ticker:         [ p.Instance,       () -> new AdaptiveTicker.Model()  ]
      formatter:      [ p.Instance,                   ]
      color_mapper:   [ p.Instance                    ]
      major_tick_in:  [ p.Number,         2           ]
      major_tick_out: [ p.Number,         6           ]
      minor_tick_in:  [ p.Number,         0           ]
      minor_tick_out: [ p.Number,         4           ]

  }

  @override {
    background_fill_color: "#ffffff"
    background_fill_alpha: 0.95
  }

  initialize: (attrs, options) ->
    super(attrs, options)

    @define_computed_property('tick_coords', @_tick_coords, true)

  _tick_coords: () ->
    [start, end] = [@get('color_mapper').get('low'), @get('color_mapper').get('high')]

    ticks = @get('ticker').get_ticks(start, end, null, 10)
    majors = ticks.major
    minors = ticks.minor

    xs = []
    ys = []
    coords = [xs, ys]

    minor_xs = []
    minor_ys = []
    minor_coords = [minor_xs, minor_ys]

    for ii in [0...majors.length]
      if majors[ii] < start or majors[ii] > end
        continue
      coords[1].push(majors[ii])
      coords[0].push(0)

    for ii in [0...minors.length]
      if minors[ii] < start or minors[ii] > end
        continue
      minor_coords[1].push(minors[ii])
      minor_coords[0].push(0)

    return {
      "major": coords,
      "minor": minor_coords
    }

module.exports =
  Model: ColorBar
  View: ColorBarView
