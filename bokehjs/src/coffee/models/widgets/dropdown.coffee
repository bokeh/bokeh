import * as $ from "jquery"
import "bootstrap/dropdown"

import * as p from "core/properties"

import {AbstractButton, AbstractButtonView} from "./abstract_button"
import template from "./dropdown_template"

export class DropdownView extends AbstractButtonView
  template: template

  render: () ->
    super()

    items = []
    for item in @model.menu
      $item = if item?
        [label, value] = item
        $a = $("<a data-value='#{value}'>#{label}</a>")
        that = this
        $a.click((e) -> that.set_value($(this).data('value')))
        $('<li></li>').append($a)
      else
        $('<li class="bk-bs-divider"></li>')
      items.push($item)

    @$el.find('.bk-bs-dropdown-menu').append(items)
    @$el.find('button').val(@model.default_value)
    @$el.find('button').dropdown()
    return @

  set_value: (value) ->
    # Set the bokeh model to value
    @model.value = value
    # Set the html button value to value
    @$el.find('button').val(value)



export class Dropdown extends AbstractButton
  type: "Dropdown"
  default_view: DropdownView

  @define {
      value:         [ p.String    ]
      default_value: [ p.String    ]
      menu:          [ p.Array, [] ]
    }

  @override {
    label: "Dropdown"
  }
