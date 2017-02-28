import {XYGlyph, XYGlyphView} from "./xy_glyph"
import * as p from "core/properties"
import {max, concat} from "core/util/array"

export class ImageRGBAView extends XYGlyphView

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

      shape = []
      if @_image_shape?
        shape = @_image_shape[i]

      # Note specifying rows and cols is deprecated and this can soon
      # be removed.
      if @_rows?
        @_height[i] = @_rows[i]
        @_width[i] = @_cols[i]
        if shape.length > 0
          buf = @_image[i].buffer
        else
          flat = @_image[i]
          buf = new ArrayBuffer(flat.length * 4)
          color = new Uint32Array(buf)
          for j in [0...flat.length]
            color[j] = flat[j]
      else if shape.length > 0
        buf = @_image[i].buffer
        @_height[i] = shape[0]
        @_width[i] = shape[1]
      else
        flat = concat(@_image[i])
        buf = new ArrayBuffer(flat.length * 4)
        color = new Uint32Array(buf)
        for j in [0...flat.length]
          color[j] = flat[j]
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

export class ImageRGBA extends XYGlyph
  default_view: ImageRGBAView

  type: 'ImageRGBA'

  @define {
      image:  [ p.NumberSpec       ] # TODO (bev) array spec?
      rows:   [ p.NumberSpec       ]
      cols:   [ p.NumberSpec       ]
      dw:     [ p.DistanceSpec     ]
      dh:     [ p.DistanceSpec     ]
      dilate: [ p.Bool,      false ]
  }

  initialize: (attrs, options) ->
    super(attrs, options)
    @properties.rows.optional = true
    @properties.cols.optional = true
