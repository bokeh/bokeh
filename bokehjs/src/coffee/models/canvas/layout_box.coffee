_ = require "underscore"

{Variable, EQ, GE, Strength}  = require "../../core/layout/solver"
Model = require "../../model"
Range1d = require "../ranges/range1d"
p = require "../../core/properties"

class LayoutBox extends Model
  type: 'LayoutBox'

  @internal {
    layout_location: [ p.Any ]
  }

  _doc_attached: () ->
    solver = @document.solver()

    @var_constraints = {}

    for v in ['top', 'left', 'width', 'height']
      name = '_'+v
      @[name] = new Variable(v)
      @define_computed_property(v, @_get_var, false)
      solver.add_edit_variable(@[name], Strength.strong)

    for v in ['right', 'bottom']
      name = '_'+v
      @[name] = new Variable(v)
      @define_computed_property(v, @_get_var, false)

    solver.add_constraint(GE(@_top))
    solver.add_constraint(GE(@_bottom))
    solver.add_constraint(GE(@_left))
    solver.add_constraint(GE(@_right))
    solver.add_constraint(GE(@_width))
    solver.add_constraint(GE(@_height))
    solver.add_constraint(EQ(@_left, @_width, [-1, @_right]))
    solver.add_constraint(EQ(@_bottom, @_height, [-1, @_top]))

    @_h_range = new Range1d.Model({
      start: @get('left'),
      end:   @get('left') + @get('width')
    })
    @define_computed_property('h_range',
        () =>
          @_h_range.set('start', @get('left'))
          @_h_range.set('end',   @get('left') + @get('width'))
          return @_h_range
      , false)
    @add_dependencies('h_range', this, ['left', 'width'])

    @_v_range = new Range1d.Model({
      start: @get('bottom'),
      end:   @get('bottom') + @get('height')
    })
    @define_computed_property('v_range',
        () =>
          @_v_range.set('start', @get('bottom'))
          @_v_range.set('end',   @get('bottom') + @get('height'))
          return @_v_range
      , false)
    @add_dependencies('v_range', this, ['bottom', 'height'])

    @_aspect_constraint = null
    @define_computed_property('aspect',
        () => return @get('width') / @get('height')
      , true)
    @add_dependencies('aspect', this, ['width', 'height'])

  contains: (vx, vy) ->
    return (
      vx >= @get('left') and vx <= @get('right') and
      vy >= @get('bottom') and vy <= @get('top')
    )

  set_var: (name, value) ->
    v = @['_' + name]
    @document.solver().suggest_value(v, value)

  _get_var: (prop_name) ->
    return @['_' + prop_name].value()

module.exports =
  Model: LayoutBox
