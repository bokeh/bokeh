import {ButtonTool, ButtonToolView} from "../button_tool"
import {OnOffButtonView} from "../on_off_button"
import {UIEvent} from "core/ui_events"
import {SelectionMode} from "core/enums"
import * as p from "core/properties"
import {unreachable} from "core/util/assert"

export abstract class GestureToolView extends ButtonToolView {
  model: GestureTool

  protected _select_mode(ev: UIEvent): SelectionMode {
    const {shiftKey, ctrlKey} = ev

    if (!shiftKey && !ctrlKey)
      return "replace"
    else if (shiftKey && !ctrlKey)
      return "append"
    else if (!shiftKey && ctrlKey)
      return "intersect"
    else if (shiftKey && ctrlKey)
      return "subtract"
    else
      unreachable()
  }
}

export namespace GestureTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ButtonTool.Props
}

export interface GestureTool extends GestureTool.Attrs {}

export abstract class GestureTool extends ButtonTool {
  properties: GestureTool.Props

  constructor(attrs?: Partial<GestureTool.Attrs>) {
    super(attrs)
  }

  button_view = OnOffButtonView

  default_order: number
}
