import {TextInput, TextInputView} from "models/widgets/text_input"
import * as p from "core/properties"


export class AwesompleteInputView extends TextInputView

  # initialize: (options) ->
  #   super(options)

  render: () ->
    super()
    $input = @$el.find("input")
    $input.addClass("dropdown-input")
    # NOTE: creating new Awesomplete object here, because render()
    # will cause the entire input element to be redrawn. Not sure
    # if there's significant performance penalty to this.
    @awesomplete = new Awesomplete($input[0])
    @awesomplete.list = @model.completions
    @awesomplete.minChars = @model.min_chars
    @awesomplete.maxItems = @model.max_items
    @awesomplete.autoFirst = @model.auto_first
    # Normalize label display to other textinput widgets
    @$el.find("div.awesomplete").css("display", "block")
    return @

export class AwesompleteInput extends TextInput
  type: "AwesompleteInput"
  default_view: AwesompleteInputView

  # defaults are from awesomplete
  @define {
    completions: [ p.Array, [] ]
    min_chars: [ p.Number, 2 ]
    max_items: [ p.Number, 10 ]
    auto_first: [ p.Bool, false ]
  }
