import {ButtonTool, ButtonToolView} from "../button_tool"
import {OnOffButtonView} from "../on_off_button"

export abstract class GestureToolView extends ButtonToolView {
  model: GestureTool
}

export namespace GestureTool {
  export interface Attrs extends ButtonTool.Attrs {}

  export interface Props extends ButtonTool.Props {}
}

export interface GestureTool extends GestureTool.Attrs {}

export abstract class GestureTool extends ButtonTool {

  properties: GestureTool.Props

  constructor(attrs?: Partial<GestureTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "GestureTool"
  }

  button_view = OnOffButtonView

  default_order: number
}

GestureTool.initClass()
