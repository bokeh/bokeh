_ = require "underscore"
HasProps = require "./core/has_props"
p = require "./core/properties"

class Model extends HasProps
  type: "Model"

  _coords: []

  @coords: (coords) ->
    _coords = this.prototype._coords.concat(coords)
    this.prototype._coords = _coords

    result = {}
    for [x, y] in coords
      result[x] = [ p.NumberSpec ]
      result[y] = [ p.NumberSpec ]

    @define(result)

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


module.exports = Model
