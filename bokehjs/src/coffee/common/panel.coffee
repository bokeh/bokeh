
define [
  "underscore",
  "backbone",
  "kiwi",
  "./has_properties"
  "range/range1d",
], (_, Backbone, kiwi, HasProperties, Range1d) ->

  Var = kiwi.Variable
  Expr = kiwi.Expression
  Constraint = kiwi.Constraint
  EQ = kiwi.Operator.Eq
  LE = kiwi.Operator.Le
  GE = kiwi.Operator.Ge

  class Panel extends HasProperties
    type: 'Panel'

    initialize: (attrs, options) ->
      super(attrs, options)

      @solver = options.solver

      @var_constraints = {}

      vars = [
        'top',
        'bottom',
        'left',
        'right',
        'width',
        'height'
      ]

      for v in vars
        name = '_'+v
        @[name] = new Var()
        @register_property(v, @_get_var, false)
        @register_setter(v, @_set_var)
        @solver.add_edit_variable(@[name], kiwi.Strength.strong)

      @solver.add_constraint(new Constraint(new Expr(@_width), GE))
      @solver.add_constraint(new Constraint(new Expr(@_height), GE))
      @solver.add_constraint(new Constraint(new Expr(@_left, @_width, [-1, @_right]), EQ))
      @solver.add_constraint(new Constraint(new Expr(@_bottom, @_height, [-1, @_top]), EQ))

      @solver.update_variables()

      @_h_range = new Range1d.Model({
        start: @get('left'),
        end:   @get('left') + @get('width')
      })
      @register_property('inner_range_horizontal',
          () =>
            @_h_range.set('start', @get('left'))
            @_h_range.set('end',   @get('left') + @get('width'))
            return @_h_range
        , false)
      @add_dependencies('inner_range_horizontal', this, ['left', 'width'])

      @_v_range = new Range1d.Model({
        start: @get('bottom'),
        end:   @get('bottom') + @get('height')
      })
      @register_property('inner_range_vertical',
          () =>
            @_v_range.set('start', @get('bottom'))
            @_v_range.set('end',   @get('bottom') + @get('height'))
            return @_v_range
        , false)
      @add_dependencies('inner_range_vertical', this, ['bottom', 'height'])
      window.foo = @

      @_aspect_constraint = null
      @register_property('aspect',
          () => return @get('width') / @get('height')
        , true)
      @register_setter('aspect', @_set_aspect)
      @add_dependencies('aspect', this, ['width', 'height'])

    _set_var: (value, prop_name) ->
      v = @['_' + prop_name]
      if typeof value == 'number'
        @solver.suggest_value(v, value);
      else if typeof value == 'string'
          # handle namespaced later
      else
        c = new Constraint(new Expr(v, [-1, value]), EQ)
        if not @var_constraints[prop_name]?
          @var_constraints[prop_name] = []
        @var_constraints[prop_name].push(c)
        @solver.add_constraint(c)
      @solver.update_variables();

    _get_var: (prop_name) ->
      return @['_' + prop_name].value()

    _set_aspect: (aspect) ->
      if @_aspect_constraint?
        @solver.removeConstraint(@aspect_constraint)
        c = new Constraint(new Expr([aspect, @_height], [-1, @_width]), EQ)
        @_aspect_constraint = c
        @solver.add_constraint(c)
        @solver.update_variables()

    defaults: () ->
      return { }

  class Panels extends Backbone.Collection
    model: Panel

  return {
    "Model": Panel,
    "Collection": new Panels(),
  }
