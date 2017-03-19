import {Widget, WidgetView} from "./widget"
import * as p from "core/properties"

export class InputWidgetView extends WidgetView

  render: () ->
    super()
    @$el.find('input').prop("disabled", @model.disabled)

  change_input: () ->
    @model.callback?.execute(@model)


export class InputWidget extends Widget
  type: "InputWidget"
  default_view: InputWidgetView

  @define {
      callback: [ p.Instance   ]
      title:    [ p.String, '' ]
    }
