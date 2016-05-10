_ = require "underscore"
HasProps = require "./core/has_props"
p = require "./core/properties"

class Model extends HasProps
  type: "Model"

  @define {
    tags: [ p.Array, [] ]
    name: [ p.String    ]
  }

  select: (selector) ->
    if selector.prototype instanceof Model
      @references().filter((ref) -> ref instanceof selector)
    else if _.isString(selector)
      @references().filter((ref) -> ref.name == selector)
    else
      throw new Error("invalid selector")

  select_one: (selector) ->
    result = @select(selector)
    switch result.length
      when 0
        null
      when 1
        result[0]
      else
        throw new Error("found more than one object matching given selector")

  get_edit_variables: () ->
    []

  get_constraints: () ->
    []

  get_constrained_variables: () ->
    {}

module.exports = Model
