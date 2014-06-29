define [
  "underscore",
  "backbone",
  "./panel",
  "mapper/1d/linear_mapper",
  "mapper/1d/categorical_mapper",
  "mapper/2d/grid_mapper",
], (_, Backbone, Panel, LinearMapper, CategoricalMapper, GridMapper) ->

  class CartesianFrame extends Panel.Model
    type: 'CartesianFrame'

    initialize: (attrs, options) ->
      super(attrs, options)

      @register_property('x_ranges',
          () -> @_get_ranges('x')
        , true)
      @add_dependencies('x_ranges', this, ['x_range', 'extra_x_ranges'])

      @register_property('y_ranges',
          () -> @_get_ranges('y')
        , true)
      @add_dependencies('y_ranges', this, ['y_range', 'extra_y_ranges'])

      @register_property('x_mappers',
          () -> @_get_mappers(@get('x_ranges'), @get('inner_range_horizontal'))
        , true)
      @add_dependencies('x_ranges', this, ['x_ranges', 'inner_range_horizontal'])

      @register_property('y_mappers',
          () -> @_get_mappers(@get('y_ranges'), @get('inner_range_vertical'))
        , true)
      @add_dependencies('y_ranges', this, ['y_ranges', 'inner_range_vertical'])

      @register_property('mapper',
        () ->
          new GridMapper.Model({
            domain_mapper: @get('x_mapper')
            codomain_mapper: @get('y_mapper')
          })
        , true)
      @add_dependencies('mapper', this, ['x_mapper', 'y_mapper'])

    map_to_screen: (x, x_units, y, y_units, canvas, name='default') ->
      if x_units == 'screen'
        if _.isArray(x)
          vx = x[..]
        else
          vx = new Float64Array(x.length)
          vx.set(x)
      else
        vx = @get('x_mappers')[name].v_map_to_target(x)
      if y_units == 'screen'
        if _.isArray(y)
          vy = y[..]
        else
          vy = new Float64Array(y.length)
          vy.set(y)
      else
        vy = @get('y_mappers')[name].v_map_to_target(y)

      sx = canvas.v_vx_to_sx(vx)
      sy = canvas.v_vy_to_sy(vy)

      return [sx, sy]

    map_from_screen: (sx, sy, units, canvas) ->
      if _.isArray(sx)
        dx = sx[..]
      else
        dx = new Float64Array(sx.length)
        dx.set(sx)
      if _.isArray(sy)
        dy = sy[..]
      else
        dy = new Float64Array(sy.length)
        dy.set(sy)
      sx = canvas.v_sx_to_vx(dx)
      sy = canvas.v_sy_to_vy(dy)

      if units == 'screen'
        x = sx
        y = sy
      else
        [x, y] = @mapper.v_map_from_target(sx, sy)  # TODO: inplace?

      return [x, y]

    _get_ranges: (dim) ->
      ranges = {}
      ranges['default'] = @get("#{dim}_range")
      extra_ranges = @get("extra_#{dim}_ranges")
      if extra_ranges?
        for name, range of extra_ranges
          ranges[name] = range
      return ranges

    _get_mappers: (ranges, frame_range) ->
      mappers = {}
      for name, range of ranges
        if range.type == "Range1D" or range.type == "DataRange1d"
          mapper_type = LinearMapper.Model
        else if range.type == "FactorRange"
          mapper_type = CategoricalMapper.Model
        else
          console.log "Unknown range type: '#{name}':#{range}"
          return null
        mappers[name] = new mapper_type({
          source_range: range
          target_range: frame_range
        })
      return mappers

    defaults: () ->
      return {
        extra_x_ranges: {}
        extra_y_ranges: {}
      }

  class CartesianFrames extends Backbone.Collection
    model: CartesianFrame

  return {
    "Model": CartesianFrame,
    "Collection": new CartesianFrames(),
  }
