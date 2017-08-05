import {span, ul, li, a} from "core/dom"
import * as p from "core/properties"

import {AbstractButton, AbstractButtonView} from "./abstract_button"
import {clear_menus} from "./common"

export class DropdownView extends AbstractButtonView

  connect_signals: () ->
    super()
    clear_menus.connect(() => @_clear_menu())

  render: () ->
    super()

    if not @model.is_split_button
      @el.classList.add("bk-bs-dropdown")
      @buttonEl.classList.add("bk-bs-dropdown-toggle")
      @buttonEl.appendChild(span({class: "bk-bs-caret"}))
    else
      @el.classList.add("bk-bs-btn-group")
      caretEl = @_render_button(span({class: "bk-bs-caret"}))
      caretEl.classList.add("bk-bs-dropdown-toggle")
      caretEl.addEventListener("click", (event) => @_caret_click(event))
      @el.appendChild(caretEl)

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

    if not @model.is_split_button
      @_toggle_menu()
    else
      @_clear_menu()
      @set_value(@model.default_value)

  _caret_click: (event) ->
    event.preventDefault()
    event.stopPropagation()
    @_toggle_menu()

  _item_click: (event) ->
    event.preventDefault()
    @_clear_menu()
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

  @getters {
    is_split_button: () -> @default_value?
  }
