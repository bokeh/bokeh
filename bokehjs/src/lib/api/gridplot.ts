import {GridPlot, Plot, ProxyToolbar, Toolbar, Tool, LayoutDOM} from "./models"
import {SizingMode, Location} from "../core/enums"
import {Matrix} from "../core/util/matrix"

export type GridPlotOpts = {
  toolbar_location?: Location | null
  merge_tools?: boolean
  sizing_mode?: SizingMode
  width?: number
  height?: number
}

export function gridplot(children: (LayoutDOM | null)[][] | Matrix<Plot | null>, options: GridPlotOpts = {}): GridPlot {
  const toolbar_location = options.toolbar_location
  const merge_tools      = options.merge_tools ?? true
  const sizing_mode      = options.sizing_mode

  const matrix = Matrix.from(children)

  const items: [LayoutDOM, number, number][] = []
  const tools: Tool[] = []

  for (const [item, row, col] of matrix) {
    if (item == null)
      continue

    if (item instanceof Plot) {
      if (merge_tools) {
        tools.push(...item.toolbar.tools)
        item.toolbar_location = null
      }
    }

    if (options.width != null)
      item.width = options.width
    if (options.height != null)
      item.height = options.height

    items.push([item, row, col])
  }

  const toolbar = (() => {
    if (!merge_tools)
      return new Toolbar({tools})
    else
      return new ProxyToolbar({tools})
  })()

  return new GridPlot({children: items, sizing_mode, toolbar, toolbar_location})
}
