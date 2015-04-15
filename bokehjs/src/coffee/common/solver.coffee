_ = require "underscore"
Backbone = require "backbone"
kiwi = if global._bokehTest? then global._bokehTest.kiwi else require "kiwi"

class Solver

  constructor: () ->
    @solver = new kiwi.Solver()

  update_variables: (trigger=true) ->
    @solver.updateVariables()
    if trigger
      @trigger('layout_update')

  add_constraint: (constraint) ->
    @solver.addConstraint(constraint)

  remove_constraint: (constraint) ->
    @solver.removeConstraint(constraint)

  add_edit_variable: (variable, strength=kiwi.Strength.strong) ->
    @solver.addEditVariable(variable, strength)

  suggest_value: (variable, value) ->
    @solver.suggestValue(variable, value)

_.extend(Solver.prototype,  Backbone.Events)

module.exports = Solver
