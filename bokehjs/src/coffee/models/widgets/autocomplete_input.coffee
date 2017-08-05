import {TextInput, TextInputView} from "./text_input"
import {clear_menus} from "./common"

import {empty, ul, li, a, Keys} from "core/dom"
import * as p from "core/properties"

export class AutocompleteInputView extends TextInputView

  connect_signals: () ->
    super()
    clear_menus.connect(() => @_clear_menu())

  render: () ->
    super()

    @inputEl.classList.add("bk-autocomplete-input")

    @inputEl.addEventListener("keydown", (event) => @_keydown(event))
    @inputEl.addEventListener("keyup", (event) => @_keyup(event))

    @menuEl = ul({class: "bk-bs-dropdown-menu"})
    @menuEl.addEventListener("click", (event) => @_item_click(event))
    @el.appendChild(@menuEl)

    return @

  _render_items: (completions) ->
    empty(@menuEl)

    for text in completions
      itemEl = li({}, a({data: {text: text}}, text))
      @menuEl.appendChild(itemEl)

  _open_menu: () ->
    @el.classList.add("bk-bs-open")

  _clear_menu: () ->
    @el.classList.remove("bk-bs-open")

  _item_click: (event) ->
    event.preventDefault()

    if event.target != event.currentTarget
      el = event.target
      text = el.dataset.text
      @model.value = text
      #@inputEl.value = text

  _keydown: (event) ->
    #

  _keyup: (event) ->
    switch event.keyCode
      when Keys.Enter
        console.log("enter")
      when Keys.Esc
        @_clear_menu()
      when Keys.Up, Keys.Down
        console.log("up/down")
      else
        value = @inputEl.value

        if value.length <= 1
          @_clear_menu()
          return

        completions = []
        for text in @model.completions
          if text.indexOf(value) != -1
            completions.push(text)

        if completions.length == 0
          @_clear_menu()
        else
          @_render_items(completions)
          @_open_menu()

export class AutocompleteInput extends TextInput
  type: "AutocompleteInput"
  default_view: AutocompleteInputView

  @define {
    completions: [ p.Array, [] ]
  }

  @internal {
    active: [p.Boolean, true]
  }
