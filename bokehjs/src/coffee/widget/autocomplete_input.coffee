_ = require "underscore"
if global._bokehTest?
  $1 = undefined  # TODO Make work
else
  $1 = require "jquery-ui/autocomplete"
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

module.exports =
  View: AutocompleteInputView
  Model: AutocompleteInput