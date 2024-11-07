import {ActionTool, ActionToolView} from "./action_tool"
import type * as p from "core/properties"
import * as icons from "styles/icons.css"
import type {DialogView} from "../../ui/dialog"
import {Dialog} from "../../ui/dialog"
import {Examiner, HTMLPrinter} from "../../ui/examiner"
import {HTML} from "../../dom/html"
import type {IterViews} from "core/build_views"
import {build_view} from "core/build_views"
import {div} from "core/dom"

import pretty_css from "styles/pretty.css"

export class ExamineToolView extends ActionToolView {
  declare model: ExamineTool

  protected _dialog: DialogView

  override *children(): IterViews {
    yield* super.children()
    yield this._dialog
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const target = this.parent.model
    const printer = new HTMLPrinter()

    const dialog = new Dialog({
      stylesheets: [pretty_css],
      title: new HTML({html: div("Examine ", printer.to_html(target))}),
      content: new Examiner({target}),
      visible: false,
      close_action: "hide",
    })
    this._dialog = await build_view(dialog, {parent: this.parent})
  }

  override connect_signals(): void {
    super.connect_signals()
    this._dialog.displayed.connect((visible) => this.model.active = visible)
  }

  doit(): void {
    this._dialog.toggle()
  }
}

export namespace ExamineTool {
  export type Attrs = p.AttrsOf<Props>
  export type Props = ActionTool.Props
}

export interface ExamineTool extends ExamineTool.Attrs {}

export class ExamineTool extends ActionTool {
  declare properties: ExamineTool.Props
  declare __view_type__: ExamineToolView

  constructor(attrs?: Partial<ExamineTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ExamineToolView

    this.register_alias("examine", () => new ExamineTool())
  }

  override tool_name = "Examine"
  override tool_icon = icons.tool_icon_settings // TODO: better icon
}
