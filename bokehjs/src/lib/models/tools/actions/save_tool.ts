import {ActionTool, ActionToolView} from "./action_tool"

export class SaveToolView extends ActionToolView {
  model: SaveTool

  doit(): void {
    this.plot_view.save("bokeh_plot")
  }
}

export namespace SaveTool {
  export interface Attrs extends ActionTool.Attrs {}

  export interface Props extends ActionTool.Props {}
}

export interface SaveTool extends SaveTool.Attrs {}

export class SaveTool extends ActionTool {

  properties: SaveTool.Props

  constructor(attrs?: Partial<SaveTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "SaveTool"
    this.prototype.default_view = SaveToolView
  }

  tool_name = "Save"
  icon = "bk-tool-icon-save"
}

SaveTool.initClass()
