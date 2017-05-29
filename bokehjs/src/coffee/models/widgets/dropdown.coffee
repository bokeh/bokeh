import {dropdown} from "bootstrap/dropdown"

import {button, span, ul, li, a} from "core/dom"
import * as p from "core/properties"

import {AbstractButton, AbstractButtonView} from "./abstract_button"

export class DropdownView extends AbstractButtonView

  template: () ->
    el = button({
      type: "button",
      disabled: @model.disabled,
      value: @model.default_value,
      class: ["bk-bs-btn", "bk-bs-btn-#{@model.button_type}", "bk-bs-dropdown-toggle"],
    }, @model.label, " ", span({class: "bk-bs-caret"}))
    el.dataset.bkBsToggle = "dropdown"
    return el

  render: () ->
    super()

    @el.classList.add("bk-bs-dropdown")

    items = []
    for item in @model.menu
      if item?
        [label, value] = item
        link = a({}, label)
        link.dataset.value = value
        link.addEventListener("click", (e) => @set_value(event.currentTarget.dataset.value))
        itemEl = li({}, link)
      else
        itemEl = li({class: "bk-bs-divider"})
      items.push(itemEl)

    menuEl = ul({class: "bk-bs-dropdown-menu"}, items)
    @el.appendChild(menuEl)

    dropdown(@buttonEl)
    return @

  set_value: (value) ->
    @buttonEl.value = @model.value = value
    @change_input()

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
