import {ActionTool, ActionToolView} from "./action_tool"
import type * as p from "core/properties"
import {tool_icon_copy} from "styles/icons.css"

export class CopyToolView extends ActionToolView {
  declare model: CopyTool

  async copy(): Promise<void> {
    const blob = await this.parent.export().to_blob()
    const item = new ClipboardItem({[blob.type]: blob})
    await navigator.clipboard.write([item])
  }

  doit(): void {
    void this.copy()
  }
}

export namespace CopyTool {
  export type Attrs = p.AttrsOf<Props>
  export type Props = ActionTool.Props
}

export interface CopyTool extends CopyTool.Attrs {}

export class CopyTool extends ActionTool {
  declare properties: CopyTool.Props
  declare __view_type__: CopyToolView

  constructor(attrs?: Partial<CopyTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CopyToolView

    this.register_alias("copy", () => new CopyTool())
  }

  override tool_name = "Copy"
  override tool_icon = tool_icon_copy
}
