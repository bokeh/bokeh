import * as _ from "underscore"

import {Widget, WidgetView} from "./widget"
import * as p from "../../core/properties"

export class InputWidgetView extends WidgetView

  render: () ->
    super()
    @$el.find('input').prop("disabled", @model.disabled)

  change_input: () ->
    @model.callback?.execute(@model)

  make_html_label: () ->
    # Render html tags in label, should not have any need for an option
    # to render as raw text?
    @$el.find('label').first().html(@model.title)

export class InputWidget extends Widget
  type: "InputWidget"
  default_view: InputWidgetView

  @define {
      callback: [ p.Instance   ]
      title:    [ p.String, '' ]
    }
