_ = require "underscore"

Glyph = require "./glyph"
p = require "../../core/properties"

class ImageRGBAView extends Glyph.View

  _index_data: () ->
    @_xy_index()

  # TODO (bev) to improve. Currently, if only one image has changed, can
  # pass index as "arg" to prevent full re-preocessing (useful for streaming)
  _set_data: (source, arg) ->
    if not @image_data? or @image_data.length != @_image.length
      @image_data = new Array(@_image.length)

    if not @_width? or @_width.length != @_image.length
      @_width = new Array(@_image.length)

    if not @_height? or @_height.length != @_image.length
      @_height = new Array(@_image.length)

    for i in [0...@_image.length]
      if arg?
        if i != arg
          continue
      if @_rows?
        @_height[i] = @_rows[i]
        @_width[i] = @_cols[i]
      else
        @_height[i] = @_image[i].length
        @_width[i] = @_image[i][0].length
      canvas = document.createElement('canvas')
      canvas.width = @_width[i]
      canvas.height = @_height[i]
      ctx = canvas.getContext('2d')
      image_data = ctx.getImageData(0, 0, @_width[i], @_height[i])
      if @_rows?
        image_data.data.set(new Uint8ClampedArray(@_image[i]))
      else
        flat = _.flatten(@_image[i])
        buf = new ArrayBuffer(flat.length * 4)
        color = new Uint32Array(buf)
        for j in [0...flat.length]
          color[j] = flat[j]
        buf8 = new Uint8ClampedArray(buf)
        image_data.data.set(buf8)
      ctx.putImageData(image_data, 0, 0)
      @image_data[i] = canvas

      @max_dw = 0
      if @_dw.units == "data"
        @max_dw = _.max(@_dw)
      @max_dh = 0
      if @_dh.units == "data"
        @max_dh = _.max(@_dh)

  _map_data: () ->
    @sw = @sdist(@renderer.xmapper, @_x, @_dw, 'edge', @mget('dilate'))
    @sh = @sdist(@renderer.ymapper, @_y, @_dh, 'edge', @mget('dilate'))

  _render: (ctx, indices, {image_data, sx, sy, sw, sh}) ->
    old_smoothing = ctx.getImageSmoothingEnabled()
    ctx.setImageSmoothingEnabled(false)

    for i in indices

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
    d = @index.data
    return {
      minX: d.minX,
      minY: d.minY,
      maxX: d.maxX + @max_dw,
      maxY: d.maxY + @max_dh
    }

class ImageRGBA extends Glyph.Model
  default_view: ImageRGBAView

  type: 'ImageRGBA'

  @coords [['x', 'y']]
  @mixins []
  @define {
      image:  [ p.NumberSpec       ] # TODO (bev) array spec?
      rows:   [ p.NumberSpec       ]
      cols:   [ p.NumberSpec       ]
      dw:     [ p.NumberSpec       ]
      dh:     [ p.NumberSpec       ]
      dilate: [ p.Bool,      false ]
  }

  initialize: (attrs, options) ->
    super(attrs, options)
    @properties.rows.optional = true
    @properties.cols.optional = true

module.exports =
  Model: ImageRGBA
  View: ImageRGBAView
