_ = require "underscore"
kiwi = require "kiwi"
{Variable, Expression, Constraint, Operator } = kiwi
{Eq, Le, Ge} = Operator
Model = require "../model"
Range1d = require "../models/ranges/range1d"


class LayoutBox extends Model
  type: 'LayoutBox'

  nonserializable_attribute_names: () ->
    super().concat(['solver', 'layout_location'])

  constructor: (attrs, options) ->
    @solver = null
    @_initialized = false
    super(attrs, options)

  initialize: (attrs, options) ->
    super(attrs, options)
    @_initialized = true
    @_initialize_if_we_have_solver()

  set: (key, value, options) ->
    super(key, value, options)
    @_initialize_if_we_have_solver()

  _initialize_if_we_have_solver: () ->
    if not @_initialized
      # if someone sets the solver in the constructor, defer
      # until we get to initialize
      return

    if @solver?
      if @get('solver') != @solver
          throw new Error("We do not support changing the solver attribute on LayoutBox")
      # we already initialized
      return

    @solver = @get('solver')
    if not @solver?
      return # we don't have one yet

    @var_constraints = {}

    for v in ['top', 'left', 'width', 'height']
      name = '_'+v
      @[name] = new Variable(v)
      @register_property(v, @_get_var, false)
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
    @add_dependencies('aspect', this, ['width', 'height'])

  contains: (vx, vy) ->
    return (
      vx >= @get('left') and vx <= @get('right') and
      vy >= @get('bottom') and vy <= @get('top')
    )

  set_var: (name, value) ->
    v = @['_' + name]
    if _.isNumber(value)
      @solver.suggest_value(v, value)
    else if _.isString(value)
        # handle namespaced later
    else
      c = new Constraint(new Expression(v, [-1, value]), Eq)
      if not @var_constraints[name]?
        @var_constraints[name] = []
      @var_constraints[name].push(c)
      @solver.add_constraint(c)
      # TODO (bev) this is a bit of a hack, but let's us
      # remove property setters entirely
      @trigger('change:#{name}')

  _get_var: (prop_name) ->
    return @['_' + prop_name].value()

  set_aspect: (aspect) ->
    if @_aspect_constraint?
      @solver.remove_constraint(@aspect_constraint)
      c = new Constraint(new Expression([aspect, @_height], [-1, @_width]), Eq)
      @_aspect_constraint = c
      @solver.add_constraint(c)

module.exports =
  Model: LayoutBox
