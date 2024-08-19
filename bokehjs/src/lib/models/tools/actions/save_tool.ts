import {ActionTool, ActionToolView} from "./action_tool"
import type * as p from "core/properties"
import * as icons from "styles/icons.css"
import type {MenuItem} from "core/util/menus"

export class SaveToolView extends ActionToolView {
  declare model: SaveTool

  protected async _export(): Promise<Blob> {
    return this.parent.export().to_blob()
  }

  async copy(): Promise<void> {
    const blob = await this._export()
    const item = new ClipboardItem({[blob.type]: blob})
    await navigator.clipboard.write([item])
  }

  async save(name: string): Promise<void> {
    const blob = await this._export()
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = name // + ".png" | "svg" (inferred from MIME type)
    link.target = "_blank"
    link.dispatchEvent(new MouseEvent("click"))
  }

  async open(): Promise<void> {
    const blob = await this._export()
    const url = URL.createObjectURL(blob)
    open(url)
  }

  doit(action: "save" | "copy" | "open" = "save"): void {
    switch (action) {
      case "save": {
        const filename = this.model.filename ?? prompt("Enter filename", "bokeh_plot")
        if (filename != null) {
          void this.save(filename)
        }
        break
      }
      case "copy": {
        void this.copy()
        break
      }
      case "open": {
        void this.open()
        break
      }
    }
  }
}

export namespace SaveTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props & {
    filename: p.Property<string | null>
  }
}

export interface SaveTool extends SaveTool.Attrs {}

export class SaveTool extends ActionTool {
  declare properties: SaveTool.Props
  declare __view_type__: SaveToolView

  constructor(attrs?: Partial<SaveTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SaveToolView

    this.define<SaveTool.Props>(({Str, Nullable}) => ({
      filename: [ Nullable(Str), null ],
    }))

    this.register_alias("save", () => new SaveTool())
  }

  override tool_name = "Save"
  override tool_icon = icons.tool_icon_save

  override get menu(): MenuItem[] | null {
    return [
      {
        icon: icons.tool_icon_copy,
        tooltip: "Copy image to clipboard",
        if: () => typeof ClipboardItem !== "undefined",
        handler: () => {
          this.do.emit("copy")
        },
      },
      {
        icon: icons.tool_icon_open,
        tooltip: "Open image in a new tab",
        handler: () => {
          this.do.emit("open")
        },
      },
    ]
  }
}
