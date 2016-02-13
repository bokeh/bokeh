_ = require "underscore"

{Variable, EQ, GE, Strength}  = require "../core/layout/solver"
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
      @solver.add_edit_variable(@[name], Strength.strong)

    for v in ['right', 'bottom']
      name = '_'+v
      @[name] = new Variable(v)
      @register_property(v, @_get_var, false)

    @solver.add_constraint(GE(@_top))
    @solver.add_constraint(GE(@_bottom))
    @solver.add_constraint(GE(@_left))
    @solver.add_constraint(GE(@_right))
    @solver.add_constraint(GE(@_width))
    @solver.add_constraint(GE(@_height))
    @solver.add_constraint(EQ(@_left, @_width, [-1, @_right]))
    @solver.add_constraint(EQ(@_bottom, @_height, [-1, @_top]))

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
      c = EQ(v, [-1, value])
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
      c = EQ([aspect, @_height], [-1, @_width])
      @_aspect_constraint = c
      @solver.add_constraint(c)

module.exports =
  Model: LayoutBox
