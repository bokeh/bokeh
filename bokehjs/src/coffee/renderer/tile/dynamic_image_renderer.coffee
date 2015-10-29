_ = require "underscore"
HasParent = require "../../common/has_parent"
PlotWidget = require "../../common/plot_widget"
properties = require "../../common/properties"
ImagePool = require "./image_pool"
{logger} = require "../../common/logging"

class DynamicImageView extends PlotWidget
  
  bind_bokeh_events: () ->
    @listenTo(@model, 'change', @request_render)

  get_extent: () ->
    return [@x_range.get('start'), @y_range.get('start'), @x_range.get('end'), @y_range.get('end')]

  _set_data: () ->
    @map_plot = @plot_view.model
    @map_canvas = @plot_view.canvas_view.ctx
    @map_frame = @plot_view.frame
    @x_range = @map_plot.get('x_range')
    @x_mapper = this.map_frame.get('x_mappers')['default']
    @y_range = @map_plot.get('y_range')
    @y_mapper = this.map_frame.get('y_mappers')['default']
    @extent = @get_extent()

  _map_data: () ->
    @initial_extent = @get_extent()

  _on_tile_load: (e) =>
    image_data = e.target.image_data
    image_data.img = e.target
    @mget('image_source').add_image(image_data)
    @request_render()

  _on_tile_error: (e) =>
    return ''

  _create_image: (bounds) ->
    image = new Image()
    image.onload = @_on_tile_load
    image.onerror = @_on_tile_error
    image.alt = ''
    image.image_data =
      bounds : bounds
      cache_key : bounds.join(':')

    image.src = @mget('image_source').get_image_url(bounds[0], bounds[1], bounds[2], bounds[3], Math.floor(@map_frame.get('height')), Math.floor(@map_frame.get('width')))
    return image

  render: (ctx, indices, args) ->

    if not @map_initialized?
      @_set_data()
      @_map_data()
      @map_initialized = true

    extent = @get_extent()

    if @render_timer?
      clearTimeout(@render_timer)

    @render_timer = setTimeout((=> @_create_image(extent)), 65)

  _draw_image: (image_key) ->
    image_obj = @mget('image_source').images[image_key]
    if image_obj?
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

  _set_rect:() ->
    outline_width = @plot_view.outline_props.width.value()
    l = @plot_view.canvas.vx_to_sx(@map_frame.get('left')) + (outline_width/2)
    t = @plot_view.canvas.vy_to_sy(@map_frame.get('top')) + (outline_width/2)
    w = @map_frame.get('width') - outline_width
    h = @map_frame.get('height') - outline_width
    @map_canvas.rect(l, t, w, h)
    @map_canvas.clip()

  _render_images: (image_keys) ->
    @map_canvas.save()
    @_set_rect()
    @map_canvas.globalAlpha = @mget('alpha')
    for image_key in image_keys
      @_draw_tile(image_key)
    @map_canvas.restore()

class DynamicImageRenderer extends HasParent
  default_view: DynamicImageView
  type: 'DynamicImageRenderer'
  visuals: []
  angles: ['angle']

  defaults: ->
    return _.extend {}, super(), {
      angle: 0
      alpha: 1.0
      image_source:undefined
    }

  display_defaults: ->
    return _.extend {}, super(), {
      level: 'underlay'
    }

module.exports =
  Model: DynamicImageRenderer
  View: DynamicImageView
