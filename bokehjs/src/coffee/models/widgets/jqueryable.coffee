import * as DOM from "core/dom"

# trait
export JQueryable = {

  _createElement: () ->
    el = DOM.createElement(@tagName, {id: @id, class: @className})
    if typeof $ == "function"
      @$el = $(el)
    return el
}
