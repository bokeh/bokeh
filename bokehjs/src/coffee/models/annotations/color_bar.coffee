_ = require "underscore"

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

    a = [[0...10] for i in [0...10]]
    b = _.flatten(a)

    canvas = document.createElement('canvas')
    canvas.width = 10
    canvas.height = 10
    ctx = canvas.getContext('2d')
    image_data = ctx.getImageData(0, 0, 10, 10)

    cmap = @mget('mapper')
    buf = cmap.v_map_screen(b)
    buf8 = new Uint8ClampedArray(buf)
    image_data.data.set(buf8)
    ctx.putImageData(image_data, 0, 0)
    @image_data = canvas

    ctx2 = @plot_view.canvas_view.ctx
    ctx2.save()
    # ctx.translate(300, 300)
    # ctx2.scale(1, -1)
    ctx2.drawImage(@image_data, 25, 575, 550, 575)
    # ctx2.scale(1, -1)
    ctx2.restore()
    
    return

class ColorBar extends GuideRenderer.Model
  default_view: ColorBarView

  type: 'ColorBar'

  # @mixins ['text:label_', 'line:border_', 'fill:background_']

  @define {
      orientation:    [ p.Orientation,    'vertical'  ]
      mapper:         [ p.Instance                    ]
  }

  # @override {
  #   border_line_color: "#e5e5e5"
  #   border_line_alpha: 0.5
  #   border_line_width: 1
  #   background_fill_color: "#ffffff"
  #   background_fill_alpha: 0.95
  #   label_text_font_size: "10pt"
  #   label_text_baseline: "middle"
  # }

module.exports =
  Model: ColorBar
  View: ColorBarView
