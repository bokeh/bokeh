import {PlotActionTool, PlotActionToolView} from "./plot_action_tool"
import {build_view, type IterViews} from "core/build_views"
import type * as p from "core/properties"
import {GlyphRendererView} from "models/renderers/glyph_renderer"
import type {ColumnarDataSource} from "models/sources/columnar_data_source"
import {Dialog, type DialogView} from "models/ui/dialog"
import {HTML} from "models/dom"
import {div, p as p_, strong} from "core/dom"

import csv_dialog_css from "styles/csv_dialog.css"

// If there are multiple data sources for a single plot, we concatenate the
// plot title with the names of the first three columns to create a more
// unique file name for each CSV file.
function filename_for_data_source(
  plot_title: string,
  data_source: ColumnarDataSource,
  data_sources: Set<ColumnarDataSource>,
): string {
  if (data_sources.size > 1 && data_source.columns().length > 0) {
    return `${plot_title}_${data_source.columns().slice(0, 3).join("_")}.csv`
  } else {
    return `${plot_title}.csv`
  }
}

function make_download_link(source: ColumnarDataSource, filename: string): HTMLButtonElement {
  const downloadOnDemand = document.createElement("button")
  downloadOnDemand.textContent = `Download ${filename}`

  // When the user clicks the button, create a temporary download link and
  // programmatically click it to trigger the download. Why not just put the
  // download links directly on the page? Because then you have to clean up the
  // links (revokeObjectURL) when closing the dialog, plus it adds overhead in
  // memory (each CSV is stored in memory) and loading time (the time needed to
  // generate each CSV).
  downloadOnDemand.addEventListener("click", () => {
    const blob = new Blob([source.to_csv()], {type: "text/csv"})
    const url = URL.createObjectURL(blob)

    // Create and click download link
    const tmp = document.createElement("a")
    tmp.href = url
    tmp.download = filename
    tmp.click()

    // Revoke object URL to prevent memory leak
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  })

  return downloadOnDemand
}

export class CsvToolView extends PlotActionToolView {
  declare model: CsvTool

  // We have references to both the dialog and its promise because some methods
  // are async and others are not.
  dialog?: DialogView
  dialog_promise: Promise<DialogView>
  _resolve_dialog_promise: (dialog: DialogView) => void

  override initialize() {
    this.dialog_promise = new Promise(resolve => this._resolve_dialog_promise = resolve)
  }

  override *children(): IterViews {
    yield* super.children()
    if (this.dialog != null) {
      yield this.dialog
    }
  }

  protected async build_dialog() {
    const csv_download_links = this.create_download_links()
    const content = new HTML({
      html:
        div(
          p_(strong("This is an experimental feature.")),
          p_("Be wary of any CSV files that contain executable code cells. \
              Do not allow your spreadsheet app to execute them unless you are \
              sure that the CSV file is trustworthy!"),
          ...csv_download_links.map(link => p_(link)),
        ),
    })
    const dialog = new Dialog({
      title: "Download CSV",
      content,
      stylesheets: [csv_dialog_css],
      visible: false,
      close_action: "hide",
    })
    this.dialog = await build_view(dialog, {parent: this.parent})
    this.model.disabled = false
    this._resolve_dialog_promise(this.dialog)
  }

  override async connect_signals(): Promise<void> {
    super.connect_signals()
    await this.dialog_promise
    this.dialog!.displayed.connect((visible) => this.model.active = visible)
  }

  protected get_data_sources(): Set<ColumnarDataSource> {
    const data_sources = new Set<ColumnarDataSource>()
    for (const view of this.parent.children()) {
      if (view instanceof GlyphRendererView && view.data_source.get_value().length > 0) {
        data_sources.add(view.data_source.get_value())
      }
    }
    return data_sources
  }

  protected create_download_links() {
    const default_title = "bokeh_plot_data" // should this be a model property?
    let title = this.plot_view.title
    title = title === "" ? default_title : title
    title = title.trim().replaceAll(" ", "_")

    const data_sources = this.get_data_sources()
    const links = []
    for (const data_source of data_sources) {
      const filename = filename_for_data_source(title, data_source, data_sources)
      const link = make_download_link(data_source, filename)
      links.push(link)
    }
    return links
  }

  async doit(): Promise<void> {
    if (this.dialog == null) {
      // It would be nice to build the dialog as soon as the data sources are
      // available. But testing revealed that they are not available at
      // initialize() time. TODO: see if there is a method or some way to hook
      // into when the data sources are available.
      void this.build_dialog()
    }
    await this.dialog_promise
    this.dialog!.toggle()
  }
}

export namespace CsvTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = PlotActionTool.Props & {
    filename: p.Property<string | null>
  }
}

export interface CsvTool extends CsvTool.Attrs {}

export class CsvTool extends PlotActionTool {
  declare properties: CsvTool.Props
  declare __view_type__: CsvToolView

  constructor(attrs?: Partial<CsvTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CsvToolView

    this.override<CsvTool.Props>({
      // Hack: the toolbar uses the model's `visible` property to display or
      // hide the button view of the tool, but the context menu does not
      // currently use this property, so setting it to false effectively hides
      // it from the toolbar while allowing it to show in the context menu.
      // TODO: create a more long-term reliable solution.
      visible: false,
    })

    this.register_alias("csv", () => new CsvTool())
  }

  override tool_name = "Download CSV"
  // TODO: create icon for CSV tool
  override tool_icon = undefined
}
