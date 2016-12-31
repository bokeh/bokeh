import * as _ from "underscore"
# import "jquery-ui/autocomplete"

import {TextInput, TextInputView} from "models/widgets/text_input"
import * as p from "core/properties"

export class AutocompleteInputView extends TextInputView

  render: () ->
    super()
    $input = @$el.find("input")
    $input.autocomplete({source: @model.completions
                         minLength: @model.min_chars
                         autoFocus: @model.auto_first
                        })
    # TODO: add css?
    $input.autocomplete("widget").addClass("bk-ui-autocomplete")
    return @

export class AutocompleteInput extends TextInput
  type: "AutocompleteInput"
  default_view: AutocompleteInputView

  @define {
    completions: [ p.Array, [] ]
    min_chars: [ p.Number, 2 ]
    auto_first: [ p.Bool, false ]
  }
