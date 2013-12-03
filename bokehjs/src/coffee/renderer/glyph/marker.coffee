
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class Marker extends Glyph.View

    _fields: ['x', 'y', 'size']

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      @size = @distance(@data, 'x', 'size', 'edge')

    _mask_data: () ->
      ow = @plot_view.view_state.get('outer_width')
      oh = @plot_view.view_state.get('outer_height')
      for i in [0..@mask.length-1]
        if (@sx[i]+@size[i]) < 0 or (@sx[i]-@size[i]) > ow or (@sy[i]+@size[i]) < 0 or (@sy[i]-@size[i]) > oh
          @mask[i] = false
        else
          @mask[i] = true

  class Marker extends Glyph.Model

  return {
    "Model": Marker,
    "View": MarkerView,
  }

