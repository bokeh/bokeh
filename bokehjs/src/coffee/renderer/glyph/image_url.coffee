define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class ImageURLView extends Glyph.View

    _fields: ['url:string', 'x', 'y', 'w', 'h', 'angle']
    _properties: []

    _set_data: () ->
      @image = (null for img in @url)
      @need_load = (true for img in @url)
      @loaded = (false for img in @url)

    _map_data: () ->
      [@sx, @sy] = @renderer.map_to_screen(@x, @glyph.x.units, @y, @glyph.y.units)
      @sw = @distance_vector('x', 'w', 'edge', @mget('dilate'))
      @sh = @distance_vector('y', 'h', 'edge', @mget('dilate'))

    _render: (ctx, indices) ->
      for i in indices
        if isNaN(@sx[i] + @sy[i] + @angle[i])
          continue

        if @need_load[i]
          img = new Image()
          img.onload = do (img, i) =>
            return () =>
              @loaded[i] = true
              @image[i] = img
              ctx.save()
              ctx.beginPath()
              # TODO should take the real axis rule width into account, for now shrink region by 1 px
              frame = @renderer.plot_view.frame
              # use bottom here because frame is view coords
              ctx.rect(
                frame.get('left')+1, frame.get('bottom')+1,
                frame.get('width')-2, frame.get('height')-2,
              )
              ctx.clip()
              @_render_image(ctx, i, img)
              ctx.restore()

          img.src = @url[i]
          @need_load[i] = false
        else if @loaded[i]
          @_render_image(ctx, i, @image[i])

    _final_sx_sy: () ->
      anchor = @mget('anchor') or "top_left"

      switch anchor
        when "top_left"      then (i) => [@sx[i]           , @sy[i]           ]
        when "top_center"    then (i) => [@sx[i] - @sw[i]/2, @sy[i]           ]
        when "top_right"     then (i) => [@sx[i] - @sw[i]  , @sy[i]           ]
        when "right_center"  then (i) => [@sx[i] - @sw[i]  , @sy[i] - @sh[i]/2]
        when "bottom_right"  then (i) => [@sx[i] - @sw[i]  , @sy[i] - @sh[i]  ]
        when "bottom_center" then (i) => [@sx[i] - @sw[i]/2, @sy[i] - @sh[i]  ]
        when "bottom_left"   then (i) => [@sx[i]           , @sy[i] - @sh[i]  ]
        when "left_center"   then (i) => [@sx[i]           , @sy[i] - @sh[i]/2]
        when "center"        then (i) => [@sx[i] - @sw[i]/2, @sy[i] - @sh[i]/2]

    _render_image: (ctx, i, img) ->
      if isNaN(@sw[i]) then @sw[i] = img.width
      if isNaN(@sh[i]) then @sh[i] = img.height

      [sx, sy] = @_final_sx_sy()(i)

      if @angle[i]
        ctx.translate(sx, sy)
        ctx.rotate(@angle[i])
        ctx.drawImage(img, 0, 0, @sw[i], @sh[i])
        ctx.rotate(-@angle[i])
        ctx.translate(-sx, -sy)
      else
        ctx.drawImage(img, sx, sy, @sw[i], @sh[i])

  class ImageURL extends Glyph.Model
    default_view: ImageURLView
    type: 'ImageURL'

    defaults: ->
      return _.extend {}, super(), {
        angle: 0
      }

    display_defaults: ->
      return _.extend {}, super(), {
        level: 'underlay'
      }

  class ImageURLs extends Glyph.Collection
    model: ImageURL

  return {
    Model: ImageURL
    View: ImageURLView
    Collection: new ImageURLs()
  }
