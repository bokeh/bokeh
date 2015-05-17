_ = require "underscore"
if global._bokehTest?
  kiwi = {}  # TODO Make work
else
  kiwi = require "kiwi"
  {Variable, Expression, Constraint, Operator } = kiwi
  {Eq, Le, Ge} = Operator
HasProperties = require "./has_properties"
Range1d = require "../range/range1d"


class LayoutBox extends HasProperties
  type: 'LayoutBox'

  initialize: (attrs, options) ->
    super(attrs, options)
    @solver = @get('solver')

    @var_constraints = {}

    for v in ['top', 'left', 'width', 'height']
      name = '_'+v
      @[name] = new Variable(v)
      @register_property(v, @_get_var, false)
      @register_setter(v, @_set_var)
      @solver.add_edit_variable(@[name], kiwi.Strength.strong)

    for v in ['right', 'bottom']
      name = '_'+v
      @[name] = new Variable(v)
      @register_property(v, @_get_var, false)

    @solver.add_constraint(new Constraint(new Expression(@_top), Ge))
    @solver.add_constraint(new Constraint(new Expression(@_bottom), Ge))
    @solver.add_constraint(new Constraint(new Expression(@_left), Ge))
    @solver.add_constraint(new Constraint(new Expression(@_right), Ge))
    @solver.add_constraint(new Constraint(new Expression(@_width), Ge))
    @solver.add_constraint(new Constraint(new Expression(@_height), Ge))
    @solver.add_constraint(new Constraint(new Expression(@_left, @_width, [-1, @_right]), Eq))
    @solver.add_constraint(new Constraint(new Expression(@_bottom, @_height, [-1, @_top]), Eq))

    @_h_range = new Range1d.Model({
      start: @get('left'),
      end:   @get('left') + @get('width')
    })
    @register_property('h_range',
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
    @register_property('v_range',
        () =>
          @_v_range.set('start', @get('bottom'))
          @_v_range.set('end',   @get('bottom') + @get('height'))
          return @_v_range
      , false)
    @add_dependencies('v_range', this, ['bottom', 'height'])

    @_aspect_constraint = null
    @register_property('aspect',
        () => return @get('width') / @get('height')
      , true)
    @register_setter('aspect', @_set_aspect)
    @add_dependencies('aspect', this, ['width', 'height'])

  contains: (vx, vy) ->
    return (
      vx >= @get('left') and vx <= @get('right') and
      vy >= @get('bottom') and vy <= @get('top')
    )

  _set_var: (value, prop_name) ->
    v = @['_' + prop_name]
    if _.isNumber(value)
      @solver.suggest_value(v, value)
    else if _.isString(value)
        # handle namespaced later
    else
      c = new Constraint(new Expression(v, [-1, value]), Eq)
      if not @var_constraints[prop_name]?
        @var_constraints[prop_name] = []
      @var_constraints[prop_name].push(c)
      @solver.add_constraint(c)

  _get_var: (prop_name) ->
    return @['_' + prop_name].value()

  _set_aspect: (aspect) ->
    if @_aspect_constraint?
      @solver.remove_constraint(@aspect_constraint)
      c = new Constraint(new Expression([aspect, @_height], [-1, @_width]), Eq)
      @_aspect_constraint = c
      @solver.add_constraint(c)

  defaults: ->
    return _.extend {}, super(), {
      'top_strength': kiwi.Strength.strong,
      'bottom_strength': kiwi.Strength.strong,
      'left_strength': kiwi.Strength.strong,
      'right_strength': kiwi.Strength.strong,
      'width_strength': kiwi.Strength.strong,
      'height_strength': kiwi.Strength.strong
    }

module.exports =
  Model: LayoutBox