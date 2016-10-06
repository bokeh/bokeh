import * as _ from "underscore"
import * as HasProps from "./core/has_props"
import * as p from "./core/properties"

export class Model extends HasProps
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
