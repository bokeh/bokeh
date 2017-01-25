import {XYGlyph, XYGlyphView} from "./xy_glyph"
import {LinearColorMapper} from "../mappers/linear_color_mapper"
import * as p from "../../core/properties"
import {max, concat} from "../../core/util/array"

export class ImageView extends XYGlyphView

  initialize: (options) ->
    super(options)
    @listenTo(@model.color_mapper, 'change', @_update_image)

  _update_image: () ->
    # Only reset image_data if already initialized
    if @image_data?
      @_set_data()
      @renderer.plot_view.request_render()

  _set_data: () ->
    if not @image_data? or @image_data.length != @_image.length
      @image_data = new Array(@_image.length)

    if not @_width? or @_width.length != @_image.length
      @_width = new Array(@_image.length)

    if not @_height? or @_height.length != @_image.length
      @_height = new Array(@_image.length)

    for i in [0...@_image.length]
      shape = []
      if @_image_shape?
        shape = @_image_shape[i]

      if shape.length > 0
        img = @_image[i]
        @_height[i] = shape[0]
        @_width[i] = shape[1]
      else
        img = concat(@_image[i])
        @_height[i] = @_image[i].length
        @_width[i] = @_image[i][0].length

      if @image_data[i]? and @image_data[i].width == @_width[i] and @image_data[i].height == @_height[i]
        canvas = @image_data[i]
      else
        canvas = document.createElement('canvas')
        canvas.width = @_width[i]
        canvas.height = @_height[i]

      ctx = canvas.getContext('2d')
      image_data = ctx.getImageData(0, 0, @_width[i], @_height[i])
      cmap = @model.color_mapper
      buf = cmap.v_map_screen(img, true)
      buf8 = new Uint8Array(buf)
      image_data.data.set(buf8)
      ctx.putImageData(image_data, 0, 0)
      @image_data[i] = canvas

      @max_dw = 0
      if @_dw.units == "data"
        @max_dw = max(@_dw)
      @max_dh = 0
      if @_dh.units == "data"
        @max_dh = max(@_dh)

  _map_data: () ->
    switch @model.properties.dw.units
      when "data" then @sw = @sdist(@renderer.xmapper, @_x, @_dw, 'edge', @model.dilate)
      when "screen" then @sw = @_dw

    switch @model.properties.dh.units
      when "data" then @sh = @sdist(@renderer.ymapper, @_y, @_dh, 'edge', @model.dilate)
      when "screen" then @sh = @_dh

  _render: (ctx, indices, {image_data, sx, sy, sw, sh}) ->
    old_smoothing = ctx.getImageSmoothingEnabled()
    ctx.setImageSmoothingEnabled(false)

    for i in indices
      if not image_data[i]?
        continue
      if isNaN(sx[i]+sy[i]+sw[i]+sh[i])
        continue

      y_offset = sy[i]

      ctx.translate(0, y_offset)
      ctx.scale(1, -1)
      ctx.translate(0, -y_offset)
      ctx.drawImage(image_data[i], sx[i]|0, sy[i]|0, sw[i], sh[i])
      ctx.translate(0, y_offset)
      ctx.scale(1, -1)
      ctx.translate(0, -y_offset)

    ctx.setImageSmoothingEnabled(old_smoothing)

  bounds: () ->
    bbox = @index.bbox
    bbox.maxX += @max_dw
    bbox.maxY += @max_dh
    return bbox

# NOTE: this needs to be redefined here, because palettes are located in bokeh-api.js bundle
Greys9 = () -> [0x000000, 0x252525, 0x525252, 0x737373, 0x969696, 0xbdbdbd, 0xd9d9d9, 0xf0f0f0, 0xffffff]

export class Image extends XYGlyph
  default_view: ImageView

  type: 'Image'

  @define {
      image:        [ p.NumberSpec       ] # TODO (bev) array spec?
      dw:           [ p.DistanceSpec     ]
      dh:           [ p.DistanceSpec     ]
      dilate:       [ p.Bool,      false ]
      color_mapper: [ p.Instance,  () -> new LinearColorMapper({palette: Greys9()}) ]
  }
