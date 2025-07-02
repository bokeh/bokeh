import {ActionTool, ActionToolView} from "./action_tool"
import type * as p from "core/properties"
import {tool_icon_csv} from "styles/icons.css"
import { GlyphRendererView } from "models/renderers/glyph_renderer"
import type { ColumnarDataSource } from "models/sources/columnar_data_source"

export class CsvToolView extends ActionToolView {
  declare model: CsvTool

  protected async _get_data_sources(): Promise<Set<ColumnarDataSource>> {
    const data_sources = new Set<ColumnarDataSource>()
    for (const view of this.parent.children()) {
      if (view instanceof GlyphRendererView) {
        if (view.data_source) {
          data_sources.add(view.data_source.get_value())
        }
      }
    }
    return data_sources
  }

  // async copy(): Promise<void> {
  //   const blob = await this._export()
  //   const item = new ClipboardItem({[blob.type]: blob})
  //   await navigator.clipboard.write([item])
  // }

  async save(): Promise<void> {
    const data_sources = await this._get_data_sources()
    let count = 0
    for (const data_source of data_sources) {
      const blob = new Blob([data_source.to_csv()], { type: 'text/plain' })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      // TODO: use plot title (or other metadata) to name the CSV file if available
      link.download = `bokeh_plot_data_${count++}.csv` // + ".png" | "svg" (inferred from MIME type)
      link.target = "_blank"
      link.dispatchEvent(new MouseEvent("click"))
    }
  }

  // async open(): Promise<void> {
  //   const blob = await this._export()
  //   const url = URL.createObjectURL(blob)
  //   open(url)
  // }

  doit(): void {
    this.save()
  }
}

export namespace CsvTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props & {
    filename: p.Property<string | null>
  }
}

export interface CsvTool extends CsvTool.Attrs {}

export class CsvTool extends ActionTool {
  declare properties: CsvTool.Props
  declare __view_type__: CsvToolView

  constructor(attrs?: Partial<CsvTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CsvToolView

    this.register_alias("csv", () => new CsvTool())
  }

  override tool_name = "Download CSV"
  override tool_icon = tool_icon_csv
}
