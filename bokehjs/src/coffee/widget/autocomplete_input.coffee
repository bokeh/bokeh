$1 = require "jquery_ui/autocomplete"
Collection = require "../common/collection"
TextInput = require "./text_input"

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

  defaults: () ->
    return _.extend {}, super(), {
      completions: []
    }

class AutocompleteInputs extends Collection
  model: AutocompleteInput

module.exports =
  View: AutocompleteInputView
  Model: AutocompleteInput
  Collection: new AutocompleteInputs()