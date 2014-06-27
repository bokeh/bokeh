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
          () -> @_get_mappers(@get('x_ranges'), @get('h_range'))
        , true)
      @add_dependencies('x_ranges', this, ['x_ranges', 'h_range'])

      @register_property('y_mappers',
          () -> @_get_mappers(@get('y_ranges'), @get('v_range'))
        , true)
      @add_dependencies('y_ranges', this, ['y_ranges', 'v_range'])

      @register_property('mapper',
        () ->
          new GridMapper.Model({
            domain_mapper: @get('x_mapper')
            codomain_mapper: @get('y_mapper')
          })
        , true)
      @add_dependencies('mapper', this, ['x_mapper', 'y_mapper'])

    _get_ranges: (dim) ->
      ranges = {}
      ranges['default'] = @get('#{dim}_range')
      extra_ranges = @get('extra_#{dim}_ranges')
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
