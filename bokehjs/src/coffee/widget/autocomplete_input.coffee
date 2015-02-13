define [
  "jquery_ui/autocomplete"
  "common/collection"
  "./text_input"
], ($1, Collection, TextInput) ->

  class AutocompleteInputView extends TextInput.View
    render: () ->
      super()
      $input = @$el.find("input")
      $input.autocomplete(source: @mget("completions"))
      $input.autocomplete("widget").addClass("bk-autocomplete-input")

  class AutocompleteInput extends TextInput.Model
    type: "AutocompleteInput"
    default_view: AutocompleteInputView

    defaults: ->
      return _.extend {}, super(), {
        completions: []
      }

  class AutocompleteInputs extends Collection
    model: AutocompleteInput

  return {
    View: AutocompleteInputView
    Model: AutocompleteInput
    Collection: new AutocompleteInputs()
  }
