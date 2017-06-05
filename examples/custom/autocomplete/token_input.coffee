import * as _ from "underscore"
# Cannot import jquery here, otherwise it overwrites (?) the
# globally loaded jquery object with function plugins
# import * as $ from "jquery"

# import {TextInput, TextInputView} from "models/widgets/text_input"
import {InputWidget, InputWidgetView} from "models/widgets/input_widget"
import template from "./tag_input_template"
import * as p from "core/properties"

export class TokenInputView extends InputWidgetView
  tagName: "div"
  className: "bk-widget-form-group"
  template: template
  # events:
  #   "change input": "change_input"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    super()
    @$el.html(@template(@model.attributes))

    # TODO: using below hack to use globally loaded jquery, which has
    # the function plugin extensions, instead of saved @$el object
    $input = $(@$el.find("input.bk-widget-form-input"))
    if $input.tokenInput?
      completions = ({"name": val} for val in @model.completions)
      values = ({"name": val} for val in @model.values)
      this_wrap = @  # bind to closure?
      $input.tokenInput(completions, {
          prePopulate: values
          # propertyToSearch: "name"
          theme: "facebook"
          minChars: @model.min_chars
          onAdd:
            (item) -> this_wrap.change_tags()
          onDelete:
            (item) -> this_wrap.change_tags()
          # TODO
          # resultsLimit: @model.max_items
          })
    # TODO: listen to onAdd/onDelete to get triggers for when value changed?
    # And map value to selector.tokenInput("get"); ?
    # TODO: add css?
    # $input.autocomplete("widget").addClass("bk-ui-autocomplete")
    return @

  change_tags: () ->
    $input = $(@$el.find("input.bk-widget-form-input"))
    if $input.tokenInput?
      values = $input.tokenInput("get")
      console.log("widget/token_input: values #{values}", values)
      @model.values = (val["name"] for val in values)

export class TokenInput extends InputWidget
  type: "TokenInput"
  default_view: TokenInputView

  @define {
    values: [ p.Array, [] ]
    placeholder: [ p.String, "" ]
    completions: [ p.Array, [] ]
    min_chars: [ p.Number, 2 ]
    auto_first: [ p.Bool, false ]
  }
