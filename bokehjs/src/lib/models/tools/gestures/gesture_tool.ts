import {ButtonTool, ButtonToolView} from "../button_tool"
import {OnOffButtonView} from "../on_off_button"
import * as p from "core/properties"

export abstract class GestureToolView extends ButtonToolView {
  override model: GestureTool
}

export namespace GestureTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ButtonTool.Props
}

export interface GestureTool extends GestureTool.Attrs {}

export abstract class GestureTool extends ButtonTool {
  override properties: GestureTool.Props
  override __view_type__: GestureToolView

  constructor(attrs?: Partial<GestureTool.Attrs>) {
    super(attrs)
  }

  override button_view = OnOffButtonView

  default_order: number
}
