import {LayoutDOM, Row, Column, GridBox, ToolbarBox, ProxyToolbar, Plot, Tool, Toolbar} from "./models"
import {SizingMode, Location} from "../core/enums"
import {Matrix} from "../core/util/data_structures"

export interface GridPlotOpts {
  toolbar_location?: Location | null
  merge_tools?: boolean
  sizing_mode?: SizingMode
  plot_width?: number
  plot_height?: number
}

function or_else<T>(value: T | undefined, default_value: T): T {
  if (value === undefined)
    return default_value
  else
    return value
}

export function gridplot(children: (Plot | null)[][] | Matrix<Plot | null>, options: GridPlotOpts = {}): LayoutDOM {
  const toolbar_location = or_else(options.toolbar_location, "above")
  const merge_tools      = or_else(options.merge_tools, true)
  const sizing_mode      = or_else(options.sizing_mode, null)

  const matrix = Matrix.from(children)

  const items: [Plot, number, number][] = []
  const toolbars: Toolbar[] = []

  for (const [item, row, col] of matrix) {
    if (item == null)
      continue

    if (merge_tools) {
      toolbars.push(item.toolbar)
      item.toolbar_location = null
    }

    if (options.plot_width != null)
      item.plot_width = options.plot_width
    if (options.plot_height != null)
      item.plot_height = options.plot_height

    items.push([item, row, col])
  }

  const grid = new GridBox({children: items, sizing_mode})
  if (!merge_tools || toolbar_location == null)
    return grid

  const tools: Tool[] = []
  for (const toolbar of toolbars) {
    tools.push(...toolbar.tools)
  }
  const toolbar = new ToolbarBox({
    toolbar: new ProxyToolbar({toolbars, tools}),
    toolbar_location,
  })

  switch (toolbar_location) {
    case "above":
      return new Column({children: [toolbar, grid], sizing_mode})
    case "below":
      return new Column({children: [grid, toolbar], sizing_mode})
    case "left":
      return new Row({children: [toolbar, grid], sizing_mode})
    case "right":
      return new Row({children: [grid, toolbar], sizing_mode})
    default:
      throw new Error("unexpected")
  }
}
