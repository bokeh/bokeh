import {ActionTool, ActionToolView} from "./action_tool"
import * as p from "core/properties"
import {tool_icon_save} from "styles/icons.css"
import {MenuItem} from "core/util/menus"

export class SaveToolView extends ActionToolView {
  override model: SaveTool

  async copy(): Promise<void> {
    const blob = await this.plot_view.to_blob()
    const item = new ClipboardItem({[blob.type]: Promise.resolve(blob)})
    await navigator.clipboard.write([item])
  }

  async save(name: string): Promise<void> {
    const blob = await this.plot_view.to_blob()
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = name // + ".png" | "svg" (inferred from MIME type)
    link.target = "_blank"
    link.dispatchEvent(new MouseEvent("click"))
  }

  doit(action: "save" | "copy" = "save"): void {
    switch (action) {
      case "save":
        this.save("bokeh_plot")
        break
      case "copy":
        this.copy()
        break
    }
  }
}

export namespace SaveTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props
}

export interface SaveTool extends SaveTool.Attrs {}

export class SaveTool extends ActionTool {
  override properties: SaveTool.Props
  override __view_type__: SaveToolView

  constructor(attrs?: Partial<SaveTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SaveToolView

    this.register_alias("save", () => new SaveTool())
  }

  override tool_name = "Save"
  override tool_icon = tool_icon_save

  override get menu(): MenuItem[] | null {
    return [
      {
        icon: "bk-tool-icon-copy-to-clipboard",
        tooltip: "Copy image to clipboard",
        if: () => typeof ClipboardItem !== "undefined",
        handler: () => {
          this.do.emit("copy")
        },
      },
    ]
  }
}
