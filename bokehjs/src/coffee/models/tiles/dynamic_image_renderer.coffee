import {Renderer, RendererView} from "../renderers/renderer"
import {logger} from "core/logging"
import * as p from "core/properties"

export class DynamicImageView extends RendererView

  bind_bokeh_events: () ->
    @listenTo(@model, 'change', @request_render)

  get_extent: () ->
    return [@x_range.start, @y_range.start, @x_range.end, @y_range.end]

  _set_data: () ->
    @map_plot = @plot_view.model.plot
    @map_canvas = @plot_view.canvas_view.ctx
    @map_frame = @plot_view.frame
    @x_range = @map_plot.x_range
    @x_mapper = this.map_frame.x_mappers['default']
    @y_range = @map_plot.y_range
    @y_mapper = this.map_frame.y_mappers['default']
    @lastImage = undefined
    @extent = @get_extent()

  _map_data: () ->
    @initial_extent = @get_extent()

  _on_image_load: (e) =>
    image_data = e.target.image_data
    image_data.img = e.target
    image_data.loaded = true
    @lastImage = image_data

    if @get_extent().join(':') == image_data.cache_key
      @request_render()

  _on_image_error: (e) =>
    logger.error('Error loading image: #{e.target.src}')
    image_data = e.target.image_data
    @model.image_source.remove_image(image_data)

  _create_image: (bounds) ->
    image = new Image()
    image.onload = @_on_image_load
    image.onerror = @_on_image_error
    image.alt = ''
    image.image_data =
      bounds : bounds
      loaded : false
      cache_key : bounds.join(':')

    @model.image_source.add_image(image.image_data)
    image.src = @model.image_source.get_image_url(bounds[0], bounds[1], bounds[2], bounds[3], Math.ceil(@map_frame.height), Math.ceil(@map_frame.width))
    return image

  render: (ctx, indices, args) ->

    if not @map_initialized?
      @_set_data()
      @_map_data()
      @map_initialized = true

    extent = @get_extent()

    if @render_timer
      clearTimeout(@render_timer)

    image_obj = @model.image_source.images[extent.join(':')]
    if image_obj? and image_obj.loaded
      @_draw_image(extent.join(':'))
      return

    if @lastImage?
      @_draw_image(@lastImage.cache_key)

    if not image_obj?
      @render_timer = setTimeout((=> @_create_image(extent)), 125)

  _draw_image: (image_key) ->
    image_obj = @model.image_source.images[image_key]
    if image_obj?
      @map_canvas.save()
      @_set_rect()
      @map_canvas.globalAlpha = @model.alpha
      [sxmin, symin] = @plot_view.frame.map_to_screen([image_obj.bounds[0]], [image_obj.bounds[3]], @plot_view.canvas)
      [sxmax, symax] = @plot_view.frame.map_to_screen([image_obj.bounds[2]], [image_obj.bounds[1]], @plot_view.canvas)
      sxmin = sxmin[0]
      symin = symin[0]
      sxmax = sxmax[0]
      symax = symax[0]
      sw = sxmax - sxmin
      sh = symax - symin
      sx = sxmin
      sy = symin
      @map_canvas.drawImage(image_obj.img, sx, sy, sw, sh)
      @map_canvas.restore()

  _set_rect:() ->
    outline_width = @plot_model.plot.properties.outline_line_width.value()
    l = @plot_view.canvas.vx_to_sx(@map_frame.left) + (outline_width/2)
    t = @plot_view.canvas.vy_to_sy(@map_frame.top) + (outline_width/2)
    w = @map_frame.width - outline_width
    h = @map_frame.height - outline_width
    @map_canvas.rect(l, t, w, h)
    @map_canvas.clip()

export class DynamicImageRenderer extends Renderer
  default_view: DynamicImageView
  type: 'DynamicImageRenderer'

  @define {
      alpha:          [ p.Number, 1.0 ]
      image_source:   [ p.Instance    ]
      render_parents: [ p.Bool, true ]
    }

  @override {
    level: 'underlay'
  }
