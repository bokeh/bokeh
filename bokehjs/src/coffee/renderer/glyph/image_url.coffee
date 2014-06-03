
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  glyph_properties = Properties.glyph_properties

  class ImageURLView extends Glyph.View

    _fields: ['url:string', 'x', 'y', 'w', 'h', 'angle']
    _properties: []

    _set_data: (@data) ->
      @image = (null for img in @url)
      @need_load = (true for img in @url)
      @loaded = (false for img in @url)

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units, @x_range_name, @y_range_name)

      @sw = @distance_vector('x', 'w', 'edge', @mget('glyphspec')['dilate'])
      @sh = @distance_vector('y', 'h', 'edge', @mget('glyphspec')['dilate'])

    _render: (ctx, indices, glyph_props) ->
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
              vs = @plot_view.view_state
              ctx.rect(
                vs.get('border_left')+1, vs.get('border_top')+1,
                vs.get('inner_width')-2, vs.get('inner_height')-2,
              )
              ctx.clip()
              @_render_image(ctx, vs, i, img)
              ctx.restore()
          img.src = @url[i]
          @need_load[i] = false

        else if @loaded[i]
          vs = @plot_view.view_state
          @_render_image(ctx, vs, i, @image[i])

    _final_sx_sy: () ->
      anchor = @mget('glyphspec').anchor or "top_left"

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

    _render_image: (ctx, vs, i, img) ->
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

  # name Image conflicts with js Image
  class ImageURLGlyph extends Glyph.Model
    default_view: ImageURLView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        level: 'underlay'
      })

  return {
    "Model": ImageURLGlyph,
    "View": ImageURLView,
  }
