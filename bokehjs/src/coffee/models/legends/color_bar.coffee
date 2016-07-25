_ = require "underscore"

LinearAxis = require "../axes/linear_axis"
GuideRenderer = require "../renderers/guide_renderer"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"

class ColorBarView extends Renderer.View
  initialize: (options) ->
    super(options)

  render: () ->
    frame = @plot_model.get('frame')
    x_range = [frame.get('h_range').get('start'), frame.get('h_range').get('end')]
    y_range = [frame.get('h_range').get('start'), frame.get('h_range').get('end')]

    scale_x_range = x_range
    scale_y_range = [500, 570]

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

    ctx = @plot_view.canvas_view.ctx
    ctx.save()
    ctx.drawImage(@image_data, 100, 100, @mget('legend_width'), @mget('legend_height'))
    ctx.restore()

    debugger;
    @model.plot.add_layout(@mget('axis'))
    debugger;
    # axis = @mget('axis')
    # axis.render()
    # @mget('axis').render()
    return

class ColorBar extends GuideRenderer.Model
  default_view: ColorBarView

  type: 'ColorBar'

  @mixins ['line:border_', 'fill:background_']

  @define {
      orientation:    [ p.Orientation,    'vertical'  ]
      color_mapper:   [ p.Instance                    ]
      legend_height:  [ p.Number,         400         ]
      legend_width:   [ p.Number,         50          ]
      axis:           [ p.Instance,       new LinearAxis.Model({bounds: [0,1]})  ]
  }

  @override {
    border_line_color: "#e5e5e5"
    border_line_alpha: 0.5
    border_line_width: 1
    background_fill_color: "#ffffff"
    background_fill_alpha: 0.95
  }

module.exports =
  Model: ColorBar
  View: ColorBarView
