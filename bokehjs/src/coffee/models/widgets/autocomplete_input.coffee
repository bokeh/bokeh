import "jquery-ui/autocomplete"

import {TextInput, TextInputView} from "./text_input"
import * as p from "core/properties"

export class AutocompleteInputView extends TextInputView

  render: () ->
    super()
    inputEl = @el.querySelector("input")
    inputEl.classList.add("bk-autocomplete-input")
    $(inputEl).autocomplete({source: @model.completions})
    $(inputEl).autocomplete("widget")
    return @

export class AutocompleteInput extends TextInput
  type: "AutocompleteInput"
  default_view: AutocompleteInputView

  @define {
      completions: [ p.Array, [] ]
    }
