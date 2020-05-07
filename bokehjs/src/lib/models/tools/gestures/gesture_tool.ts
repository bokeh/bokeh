import {ButtonTool, ButtonToolView} from "../button_tool"
import {OnOffButtonView} from "../on_off_button"
import * as p from "core/properties"

export abstract class GestureToolView extends ButtonToolView {
  model: GestureTool
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
