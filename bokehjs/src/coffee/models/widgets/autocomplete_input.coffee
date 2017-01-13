import * as _ from "underscore"
import "jquery-ui/autocomplete"

import {TextInput, TextInputView} from "./text_input"
import * as p from "../../core/properties"

export class AutocompleteInputView extends TextInputView

  render: () ->
    super()
    $input = @$el.find("input")
    $input.autocomplete(source: @model.completions)
    $input.autocomplete("widget").addClass("bk-autocomplete-input")
    @_prefix_ui()
    return @

export class AutocompleteInput extends TextInput
  type: "AutocompleteInput"
  default_view: AutocompleteInputView

  @define {
      completions: [ p.Array, [] ]
    }
