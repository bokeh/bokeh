_ = require "underscore"

CategoricalMapper = require "../mappers/categorical_mapper"
GridMapper = require "../mappers/grid_mapper"
LinearMapper = require "../mappers/linear_mapper"
LogMapper = require "../mappers/log_mapper"
Range1d = require "../ranges/range1d"

{EQ, GE}  = require "../../core/layout/solver"
LayoutCanvas = require "../../core/layout/layout_canvas"
{logging} = require "../../core/logging"
p = require "../../core/properties"

class CartesianFrame extends LayoutCanvas.Model
  type: 'CartesianFrame'

  @getters {
    x_ranges: () -> @_get_ranges('x')
    y_ranges: () -> @_get_ranges('y')

    x_mappers: () -> @_get_mappers('x', @x_ranges, @h_range)
    y_mappers: () -> @_get_mappers('y', @y_ranges, @v_range)

    mapper: () ->
      new GridMapper.Model({
        domain_mapper: @x_mapper
        codomain_mapper: @y_mapper
      })

    h_range: () ->
      @_h_range.set('start', @left)
      @_h_range.set('end',   @left + @width)
      return @_h_range
    v_range: () ->
      @_v_range.set('start', @bottom)
      @_v_range.set('end',   @bottom + @height)
      return @_v_range
  }

  initialize: (attrs, options) ->
    super(attrs, options)
    @panel = @

    @_h_range = new Range1d.Model({
      start: @left,
      end:   @left + @width
    })

    @_v_range = new Range1d.Model({
      start: @bottom,
      end:   @bottom + @height
    })
    return null

  _doc_attached: () ->
    @listenTo(@document.solver(), 'layout_update', @_update_mappers)
    return null

  contains: (vx, vy) ->
    return (
      vx >= @left and vx <= @right and
      vy >= @bottom and vy <= @top
    )

  map_to_screen: (x, y, canvas, x_name='default', y_name='default') ->
    vx = @x_mappers[x_name].v_map_to_target(x)
    sx = canvas.v_vx_to_sx(vx)

    vy = @y_mappers[y_name].v_map_to_target(y)
    sy = canvas.v_vy_to_sy(vy)
    return [sx, sy]

  _get_ranges: (dim) ->
    ranges = {}
    ranges['default'] = @get("#{dim}_range")
    extra_ranges = @get("extra_#{dim}_ranges")
    if extra_ranges?
      for name, range of extra_ranges
        ranges[name] = range
    return ranges

  _get_mappers: (dim, ranges, frame_range) ->
    mappers = {}
    for name, range of ranges
      if range.type == "Range1d" or range.type == "DataRange1d"
        if @get("#{dim}_mapper_type") == "log"
          mapper_type = LogMapper.Model
        else
          mapper_type = LinearMapper.Model
      else if range.type == "FactorRange"
        mapper_type = CategoricalMapper.Model
      else
        logger.warn("unknown range type for range '#{name}': #{range}")
        return null
      mappers[name] = new mapper_type({
        source_range: range
        target_range: frame_range
      })
    return mappers

  _update_mappers: () ->
    for name, mapper of @x_mappers
      mapper.set('target_range', @h_range)
    for name, mapper of @y_mappers
      mapper.set('target_range', @v_range)
    return null

  @internal {
    extra_x_ranges: [ p.Any, {} ]
    extra_y_ranges: [ p.Any, {} ]
    x_range: [ p.Instance ]
    y_range: [ p.Instance ]
    x_mapper_type: [ p.Any ]
    y_mapper_type: [ p.Any ]
  }

  get_constraints: () ->
    constraints = []
    constraints.push(GE(@_top))
    constraints.push(GE(@_bottom))
    constraints.push(GE(@_left))
    constraints.push(GE(@_right))
    constraints.push(GE(@_width))
    constraints.push(GE(@_height))
    constraints.push(EQ(@_left, @_width, [-1, @_right]))
    constraints.push(EQ(@_bottom, @_height, [-1, @_top]))
    return constraints

module.exports =
  Model: CartesianFrame
