
define [
  "underscore",
  "rbush",
  "renderer/properties",
  "./glyph",
], (_, rbush, Properties, Glyph) ->

  class MarkerView extends Glyph.View

    _fields: ['x', 'y', 'size']

    _set_data: () ->
      @max_size = _.max(@size)
      @index = rbush()
      @index.load(
        ([@x[i], @y[i], @x[i], @y[i], {'i': i}] for i in [0..@x.length-1])
      )

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)

    _mask_data: () ->
      # dilate the inner screen region by max_size and map back to data space for use in
      # spatial query
      hr = @plot_view.view_state.get('inner_range_horizontal')
      sx0 = hr.get('start') - @max_size
      sx1 = hr.get('end') - @max_size
      [x0, x1] = @plot_view.xmapper.v_map_from_target([sx0, sx1])

      vr = @plot_view.view_state.get('inner_range_vertical')
      sy0 = vr.get('start') - @max_size
      sy1 = vr.get('end') - @max_size
      [y0, y1] = @plot_view.ymapper.v_map_from_target([sy0, sy1])

      @mask = (x[4].i for x in @index.search([x0, y0, x1, y1]))

  class Marker extends Glyph.Model

  return {
    "Model": Marker,
    "View": MarkerView,
  }

