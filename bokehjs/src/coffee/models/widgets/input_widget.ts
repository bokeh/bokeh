import {Widget, WidgetView} from "./widget"
import * as p from "core/properties"

export class InputWidgetView extends WidgetView

  change_input: () ->
    @model.callback?.execute(@model)

export class InputWidget extends Widget
  type: "InputWidget"
  default_view: InputWidgetView

  @define {
      callback: [ p.Instance   ]
      title:    [ p.String, '' ]
    }
