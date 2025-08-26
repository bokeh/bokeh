import {ActionTool, ActionToolView} from "./action_tool"
import {CsvTool} from "./csv_tool"
import {MenuItem} from "../../ui/menus"
import type {MenuItemLike} from "../../ui/menus"
import type * as p from "core/properties"
import * as icons from "styles/icons.css"
import {PlotView} from "models/plots/plot"
import {build_view} from "core/build_views"

export class SaveToolView extends ActionToolView {
  declare model: SaveTool

  override async lazy_initialize() {
    if (this.parent instanceof PlotView) {
      const csv_tool = this.parent.model.toolbar.tools.find(tool => tool instanceof CsvTool)
      if (csv_tool != null) {
        this.model.csv_tool = csv_tool
      } else {
        const csv_tool = new CsvTool()
        await build_view(csv_tool, {parent: this.parent})
        this.model.csv_tool = csv_tool
      }
    }
  }

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
    csv_tool: p.Property<CsvTool | null>
  }
}

export interface SaveTool extends SaveTool.Attrs {}

export class SaveTool extends ActionTool {
  declare properties: SaveTool.Props
  declare __view_type__: SaveToolView
  _menu?: MenuItemLike[]

  constructor(attrs?: Partial<SaveTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SaveToolView

    this.define<SaveTool.Props>(({Str, Nullable, Ref}) => ({
      filename: [ Nullable(Str), null ],
      csv_tool: [ Nullable(Ref(CsvTool)), null ],
    }))

    this.register_alias("save", () => new SaveTool())
  }

  override tool_name = "Save"
  override tool_icon = icons.tool_icon_save

  override get menu(): MenuItemLike[] {
    if (this._menu == null) {
      this._menu = [
        new MenuItem({
          icon: `.${icons.tool_icon_save}`,
          label: "Save",
          tooltip: "Save image as a local file",
          action: () => {
            this.do.emit("save")
          },
        }),
        new MenuItem({
          icon: `.${icons.tool_icon_copy}`,
          label: "Copy",
          tooltip: "Copy image to clipboard",
          disabled: () => typeof ClipboardItem === "undefined",
          action: () => {
            this.do.emit("copy")
          },
        }),
        new MenuItem({
          icon: `.${icons.tool_icon_open}`,
          label: "Open",
          tooltip: "Open image in a new tab",
          action: () => {
            this.do.emit("open")
          },
        }),
      ]
    }
    if (this._menu.length === 3 && this.csv_tool != null) {
      this._menu.push(this.csv_tool.menu_item())
    }
    return this._menu
  }
}
