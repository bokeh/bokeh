import {Glyph, GlyphView} from "./glyph"
import {logger} from "core/logging"
import * as p from "core/properties"

export class ImageURLView extends GlyphView
  initialize: (options) ->
    super(options)
    @connect(@model.properties.global_alpha.change, () => @renderer.request_render())

  _index_data: () ->

  _set_data: () ->
    if not @image? or @image.length != @_url.length
      @image = (null for img in @_url)

    retry_attempts = @model.retry_attempts
    retry_timeout = @model.retry_timeout

    @retries = (retry_attempts for img in @_url)

    for i in [0...@_url.length]
      if not @_url[i]?
        continue

      img = new Image()
      img.onerror = do (i, img) =>
        return () =>
          if @retries[i] > 0
            logger.trace("ImageURL failed to load #{@_url[i]} image, retrying in #{retry_timeout} ms")
            setTimeout((=> img.src = @_url[i]), retry_timeout)
          else
            logger.warn("ImageURL unable to load #{@_url[i]} image after #{retry_attempts} retries")
          @retries[i] -= 1
      img.onload = do (img, i) =>
        return () =>
          @image[i] = img
          @renderer.request_render()
      img.src = @_url[i]

  has_finished: () ->
    return super() and @_images_rendered == true

  _map_data: () ->
    # Better to check @model.w and @model.h for null since the set_data
    # machinery will have converted @_w and @_w to lists of null
    ws = (if @model.w? then @_w else NaN for x in @_x)
    hs = (if @model.h? then @_h else NaN for x in @_x)

    switch @model.properties.w.units
      when "data" then @sw = @sdist(@renderer.xscale, @_x, ws, 'edge', @model.dilate)
      when "screen" then @sw = ws

    switch @model.properties.h.units
      when "data" then @sh = @sdist(@renderer.yscale, @_y, hs, 'edge', @model.dilate)
      when "screen" then @sh = hs

  _render: (ctx, indices, {_url, image, sx, sy, sw, sh, _angle}) ->

    # TODO (bev): take actual border width into account when clipping
    frame = @renderer.plot_view.frame
    ctx.rect(
      frame._left.value+1, frame._bottom.value+1,
      frame._width.value-2, frame._height.value-2,
    )
    ctx.clip()

    finished = true

    for i in indices
      if isNaN(sx[i]+sy[i]+_angle[i])
        continue

      if @retries[i] == -1
        continue

      if not image[i]?
        finished = false
        continue

      @_render_image(ctx, i, image[i], sx, sy, sw, sh, _angle)

    if finished and not @_images_rendered
      @_images_rendered = true
      @notify_finished()

  _final_sx_sy: (anchor, sx, sy, sw, sh) ->
    switch anchor
      when 'top_left'      then [sx       , sy       ]
      when 'top_center'    then [sx - sw/2, sy       ]
      when 'top_right'     then [sx - sw  , sy       ]
      when 'center_right'  then [sx - sw  , sy - sh/2]
      when 'bottom_right'  then [sx - sw  , sy - sh  ]
      when 'bottom_center' then [sx - sw/2, sy - sh  ]
      when 'bottom_left'   then [sx       , sy - sh  ]
      when 'center_left'   then [sx       , sy - sh/2]
      when 'center'        then [sx - sw/2, sy - sh/2]

  _render_image: (ctx, i, image, sx, sy, sw, sh, angle) ->
    if isNaN(sw[i]) then sw[i] = image.width
    if isNaN(sh[i]) then sh[i] = image.height

    anchor = @model.anchor
    [sx, sy] = @_final_sx_sy(anchor, sx[i], sy[i], sw[i], sh[i])

    ctx.save()

    ctx.globalAlpha = @model.global_alpha

    if angle[i]
      ctx.translate(sx, sy)
      ctx.rotate(angle[i])
      ctx.drawImage(image, 0, 0, sw[i], sh[i])
      ctx.rotate(-angle[i])
      ctx.translate(-sx, -sy)
    else
      ctx.drawImage(image, sx, sy, sw[i], sh[i])
    ctx.restore()

export class ImageURL extends Glyph
  default_view: ImageURLView

  type: 'ImageURL'

  @coords [['x', 'y']]
  @mixins []
  @define {
      url:            [ p.StringSpec            ]
      anchor:         [ p.Anchor,    'top_left' ]
      global_alpha:   [ p.Number,    1.0        ]
      angle:          [ p.AngleSpec, 0          ]
      w:              [ p.DistanceSpec          ]
      h:              [ p.DistanceSpec          ]
      dilate:         [ p.Bool,      false      ]
      retry_attempts: [ p.Number,    0          ]
      retry_timeout:  [ p.Number,    0          ]
  }
