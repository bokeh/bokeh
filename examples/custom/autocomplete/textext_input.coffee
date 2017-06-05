import * as _ from "underscore"
# Cannot import jquery here, otherwise it overwrites (?) the
# globally loaded jquery object with function plugins
# import * as $ from "jquery"

import {TextInput, TextInputView} from "models/widgets/text_input"
import * as p from "core/properties"

export class TextExtInputView extends TextInputView

  render: () ->
    super()
    # TODO: using below hack to use globally loaded jquery, which has
    # the function plugin extensions, instead of saved @$el object
    $input = $(@$el.find("input"))
    completions = @model.completions
    if $input.textext?
      # TODO: implement contains instead of match from start:
      # https://github.com/alexgorbatchev/jquery-textext/issues/168
      # http://stackoverflow.com/questions/29688035/jquery-textext-set-autocomplete-suggestions-to-filter-based-on-contains-rather
      $input.textext(
        # TODO: is using tags plugin too complicated?
        # For one, need to retrieve value correctly:
        # http://stackoverflow.com/questions/34007494/get-textext-tags-in-javascript
        plugins: 'arrow tags autocomplete'
      ).bind('getSuggestions',
        (e, data) ->
          $(this).trigger(
            'setSuggestions',
            result: $(e.target).textext()[0].itemManager().filter(
              completions, (if data then data.query else '') || ''
            )
         )
      )
    # # TODO: add css?
    # $input.autocomplete("widget").addClass("bk-ui-autocomplete")
    return @

export class TextExtInput extends TextInput
  type: "TextExtInput"
  default_view: TextExtInputView

  @define {
    completions: [ p.Array, [] ]
    min_chars: [ p.Number, 2 ]
    auto_first: [ p.Bool, false ]
  }
