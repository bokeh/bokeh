import {LayoutDOM, Row, Column, Spacer, ToolbarBox, ProxyToolbar, Plot, Tool} from "./models"
import {SizingMode, Location} from "../core/enums"

export interface GridPlotOpts {
  toolbar_location?: Location | null
  sizing_mode?: SizingMode
  merge_tools?: boolean
}

function or_else<T>(value: T | undefined, default_value: T): T {
  if (value === undefined)
    return default_value
  else
    return value
}

function nope(): never {
  throw new Error("this shouldn't have happened")
}

export function gridplot(children: (LayoutDOM | null)[][], opts: GridPlotOpts = {}): LayoutDOM {
  const toolbar_location = or_else(opts.toolbar_location, "above")
  const sizing_mode      = or_else(opts.sizing_mode, "fixed")
  const merge_tools      = or_else(opts.merge_tools, true)

  const tools: Tool[] = []
  const rows: Row[] = []

  for (const row of children) {
    const row_tools: Tool[] = []
    const row_children: LayoutDOM[] = []

    for (let item of row) {
      if (item == null) {
        let width = 0
        let height = 0
        for (const neighbor of row) {
          if (neighbor instanceof Plot) {
            width = neighbor.plot_width
            height = neighbor.plot_height
            break
          }
        }
        item = new Spacer({width: width, height: height})
      } else if (item instanceof Plot) {
        row_tools.push(...item.toolbar.tools)
        item.toolbar_location = null
      }

      item.sizing_mode = sizing_mode
      row_children.push(item)
    }

    tools.push(...row_tools)
    rows.push(new Row({children: row_children, sizing_mode: sizing_mode}))
  }

  const grid = new Column({children: rows, sizing_mode: sizing_mode})

  if (!merge_tools || toolbar_location == null)
    return grid

  let toolbar_sizing_mode: SizingMode
  if (sizing_mode == "fixed") {
    if (toolbar_location == "above" || toolbar_location == "below")
      toolbar_sizing_mode = "scale_width"
    else
      toolbar_sizing_mode = "scale_height"
  } else
    toolbar_sizing_mode = sizing_mode

  const toolbar = new ToolbarBox({
    toolbar: new ProxyToolbar({tools: tools}),
    toolbar_location: toolbar_location,
    sizing_mode: toolbar_sizing_mode,
  })

  switch (toolbar_location) {
    case "above":
      return new Column({children: [toolbar, grid], sizing_mode: sizing_mode})
    case "below":
      return new Column({children: [grid, toolbar], sizing_mode: sizing_mode})
    case "left":
      return new Row({children: [toolbar, grid], sizing_mode: sizing_mode})
    case "right":
      return new Row({children: [grid, toolbar], sizing_mode: sizing_mode})
    default:
      return nope()
  }
}
