import * as _ from "underscore"
import "jquery-ui/autocomplete"

import * as TextInput from "./text_input"
import * as p from "../../core/properties"

class AutocompleteInputView extends TextInput.View

  render: () ->
    super()
    $input = @$el.find("input")
    $input.autocomplete(source: @model.completions)
    $input.autocomplete("widget").addClass("bk-autocomplete-input")
    return @

class AutocompleteInput extends TextInput.Model
  type: "AutocompleteInput"
  default_view: AutocompleteInputView

  @define {
      completions: [ p.Array, [] ]
    }

export {
  AutocompleteInputView as View
  AutocompleteInput as Model
}
