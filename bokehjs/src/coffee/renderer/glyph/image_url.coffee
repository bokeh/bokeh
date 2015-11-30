_ = require "underscore"
Glyph = require "./glyph"
{logger} = require "../../common/logging"

class ImageURLView extends Glyph.View

  initialize: (options) ->
    super(options)
    @listenTo(@model, 'change:global_alpha', @renderer.request_render)

  _index_data: () ->

  _set_data: () ->
    if not @image? or @image.length != @url.length
      @image = (null for img in @url)

    retry_attempts = @mget('retry_attempts')
    retry_timeout = @mget('retry_timeout')

    @retries = (retry_attempts for img in @url)

    for i in [0...@url.length]
      img = new Image()
      img.onerror = do (i, img) =>
        return () =>
          if @retries[i] > 0
            logger.trace("ImageURL failed to load #{@url[i]} image, retrying in #{retry_timeout} ms")
            setTimeout((=> img.src = @url[i]), retry_timeout)
          else
            logger.warn("ImageURL unable to load #{@url[i]} image after #{retry_attempts} retries")
          @retries[i] -= 1
      img.onload = do (img, i) =>
        return () =>
          @image[i] = img
          @renderer.request_render()
      img.src = @url[i]

  _map_data: () ->
    @sw = @sdist(@renderer.xmapper, @x, @w, 'edge', @mget('dilate'))
    @sh = @sdist(@renderer.ymapper, @y, @h, 'edge', @mget('dilate'))

  _render: (ctx, indices, {url, image, sx, sy, sw, sh, angle}) ->

    # TODO (bev): take actual border width into account when clipping
    frame = @renderer.plot_view.frame
    ctx.rect(
      frame.get('left')+1, frame.get('bottom')+1,
      frame.get('width')-2, frame.get('height')-2,
    )
    ctx.clip()

    for i in indices
      if isNaN(sx[i]+sy[i]+angle[i])
        continue

      if @retries[i] == -1
        continue

      if not image[i]?
        continue

      @_render_image(ctx, i, image[i], sx, sy, sw, sh, angle)

  _final_sx_sy: (anchor, sx, sy, sw, sh) ->
    switch anchor
      when "top_left"      then [sx       , sy       ]
      when "top_center"    then [sx - sw/2, sy       ]
      when "top_right"     then [sx - sw  , sy       ]
      when "right_center"  then [sx - sw  , sy - sh/2]
      when "bottom_right"  then [sx - sw  , sy - sh  ]
      when "bottom_center" then [sx - sw/2, sy - sh  ]
      when "bottom_left"   then [sx       , sy - sh  ]
      when "left_center"   then [sx       , sy - sh/2]
      when "center"        then [sx - sw/2, sy - sh/2]

  _render_image: (ctx, i, image, sx, sy, sw, sh, angle) ->
    if isNaN(sw[i]) then sw[i] = image.width
    if isNaN(sh[i]) then sh[i] = image.height

    anchor = @mget('anchor') or "top_left"
    [sx, sy] = @_final_sx_sy(anchor, sx[i], sy[i], sw[i], sh[i])

    ctx.save()

    ctx.globalAlpha = @mget("global_alpha")

    if angle[i]
      ctx.translate(sx, sy)
      ctx.rotate(angle[i])
      ctx.drawImage(image, 0, 0, sw[i], sh[i])
      ctx.rotate(-angle[i])
      ctx.translate(-sx, -sy)
    else
      ctx.drawImage(image, sx, sy, sw[i], sh[i])
    ctx.restore()

class ImageURL extends Glyph.Model
  default_view: ImageURLView
  type: 'ImageURL'
  visuals: []
  distances: ['w', 'h']
  angles: ['angle']
  fields: ['url:string']

  defaults: ->
    return _.extend {}, super(), {
      angle: 0
      retry_attempts: 0
      retry_timeout: 0
      global_alpha: 1.0
    }

module.exports =
  Model: ImageURL
  View: ImageURLView
