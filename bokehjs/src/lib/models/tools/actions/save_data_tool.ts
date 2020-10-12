import {ColumnDataSource} from "models/sources"
import * as p from "core/properties"
import {ActionTool, ActionToolView} from "models/tools/actions/action_tool"
import {FormatterType, replace_placeholders} from "core/util/templating"
import {bk_tool_icon_save_data} from "styles/icons"

export class SaveDataToolView extends ActionToolView {
    model: SaveDataTool

    doit(): void {

      let selectedIndices = null
      if (this.model.download_selected)
        selectedIndices = this.model.source.selected.indices
      else {
        if (Object.keys(this.model.source.data).length == 0)
          return
        const len = this.model.source.data[Object.keys(this.model.source.data)[0]].length
        selectedIndices = Array.from(Array(len).keys())
      }

      if (selectedIndices.length == 0)
        return

      const headers: Array<string> = Object.getOwnPropertyNames(this.model.source.data)
      const colSep = this.model.separator
      const rowSep = "\n"

      const format_map: { [key: string]: any } = {}
      const formatters: { [key: string]: any } = {}
      const self = this

      headers.forEach(function(h) {

        format_map[h] = `@{${h}}`
        if (h in self.model.column_formatters) {
          let formatter = self.model.column_formatters[h]
          const col_id = format_map[h]
          if (formatter instanceof Array) {
            format_map[h] += `{${(formatter as [FormatterType, string])[1]}}`
            formatter = formatter[0]
          }
          formatters[col_id] = formatter
        }
      })

      let csvContent = headers.join(colSep)

      for(let i=0; i < selectedIndices.length; i ++) {
        const idx = selectedIndices[i]
        csvContent += rowSep
        csvContent += headers.map(
          h => replace_placeholders(format_map[String(h)], this.model.source, Number(idx), formatters)
        ).join(colSep)
      }

      const a = document.createElement('a')
      a.href = 'data:attachment/csv,' + encodeURIComponent(csvContent)
      a.target = '_blank'
      a.download = 'downloaded_data.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
}

export namespace SaveDataTool {

    export type Attrs = p.AttrsOf<Props>
    export type Props = ActionTool.Props & {
        source: p.Property<ColumnDataSource>
        column_formatters: p.Property<{ [key: string]: FormatterType | [FormatterType, string] }>
        separator: p.String
        download_selected: p.Boolean
        // format: p.Property<SaveDataFormats>
    }
}

export interface SaveDataTool extends SaveDataTool.Attrs {
}

export class SaveDataTool extends ActionTool {
    properties: SaveDataTool.Props
    __view_type__: SaveDataToolView

    constructor(attrs?: Partial<SaveDataTool.Attrs>) {
      super(attrs)
    }

    tool_name = "Save Data"
    icon = bk_tool_icon_save_data

    static init_SaveDataTool(): void {
      this.prototype.default_view = SaveDataToolView

      this.define<SaveDataTool.Props>({
        source: [p.Instance],
        column_formatters: [p.Any, {}],
        separator: [p.String, ','],
        download_selected: [p.Boolean, true],
        // format: [ SaveDataFormatsProperty ],
      })
    }
}
