_ = require "underscore"
$1 = require "jquery-ui/autocomplete"

TextInput = require "./text_input"
p = require "../../core/properties"

class AutocompleteInputView extends TextInput.View

  render: () ->
    super()
    $input = @$el.find("input")
    $input.autocomplete(source: @mget("completions"))
    $input.autocomplete("widget").addClass("bk-autocomplete-input")
    return @

class AutocompleteInput extends TextInput.Model
  type: "AutocompleteInput"
  default_view: AutocompleteInputView

  @define {
      completions: [ p.Array, [] ]
    }

module.exports =
  View: AutocompleteInputView
  Model: AutocompleteInput
