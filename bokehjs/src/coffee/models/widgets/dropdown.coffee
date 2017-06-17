import {button, span, ul, li, a} from "core/dom"
import * as p from "core/properties"

import {AbstractButton, AbstractButtonView} from "./abstract_button"
import {Signal} from "core/signaling"

clear_menus = new Signal(this, "clear_menus")

document.addEventListener("click", (event) -> clear_menus.emit())

export class DropdownView extends AbstractButtonView

  connect_signals: () ->
    super()
    clear_menus.connect(() => @_clear_menu())

  template: () ->
    el = button({
      type: "button",
      disabled: @model.disabled,
      value: @model.default_value,
      class: ["bk-bs-btn", "bk-bs-btn-#{@model.button_type}", "bk-bs-dropdown-toggle"],
    }, @model.label, " ", span({class: "bk-bs-caret"}))
    return el

  render: () ->
    super()

    @el.classList.add("bk-bs-dropdown")
    if @model.active
      @el.classList.add("bk-bs-open")

    items = []
    for item in @model.menu
      if item?
        [label, value] = item
        link = a({}, label)
        link.dataset.value = value
        link.addEventListener("click", (event) => @_item_click(event))
        itemEl = li({}, link)
      else
        itemEl = li({class: "bk-bs-divider"})
      items.push(itemEl)

    menuEl = ul({class: "bk-bs-dropdown-menu"}, items)
    @el.appendChild(menuEl)

    return @

  _clear_menu: () ->
    @model.active = false

  _toggle_menu: () ->
    active = @model.active
    clear_menus.emit()
    if not active
      @model.active = true

  _button_click: (event) ->
    event.preventDefault()
    event.stopPropagation()
    @_toggle_menu()

  _item_click: (event) ->
    event.preventDefault()
    @_toggle_menu()
    @set_value(event.currentTarget.dataset.value)

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

  @internal {
    active: [p.Boolean, false]
  }
