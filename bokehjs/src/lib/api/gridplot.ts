import {GridPlot, Plot} from "../models/plots"
import type {Tool} from "../models/tools/tool"
import type {ToolLike} from "../models/tools/tool_proxy"
import {ToolProxy} from "../models/tools/tool_proxy"
import {SaveTool} from "../models/tools/actions/save_tool"
import {CopyTool} from "../models/tools/actions/copy_tool"
import {ExamineTool} from "../models/tools/actions/examine_tool"
import {FullscreenTool} from "../models/tools/actions/fullscreen_tool"
import {Toolbar} from "../models/tools/toolbar"
import {UIElement} from "../models/ui/ui_element"
import {LayoutDOM} from "../models/layouts/layout_dom"
import type {SizingMode, Location} from "../core/enums"
import {Matrix} from "../core/util/matrix"
import {is_equal} from "../core/util/eq"
import {last} from "../core/util/array"
import type {Attrs} from "../core/types"
import {isArrayOf} from "../core/util/types"

export type GridPlotOpts = {
  toolbar_location?: Location | null
  merge_tools?: boolean
  sizing_mode?: SizingMode
  width?: number
  height?: number
}

export type MergeFn = (cls: typeof Tool, group: Tool[]) => Tool | ToolProxy<Tool> | null

export function group_tools(tools: ToolLike<Tool>[], merge?: MergeFn,
    ignore: Set<string> = new Set(["overlay", "renderers"])): ToolLike<Tool>[] {

  type ToolEntry = {tool: Tool, attrs: Attrs}
  const by_type: Map<typeof Tool, Set<ToolEntry>> = new Map()

  const computed: ToolLike<Tool>[] = []

  for (const tool of tools) {
    if (tool instanceof ToolProxy) {
      computed.push(tool)
    } else {
      const attrs = tool.attributes
      for (const attr of ignore) {
        if (attr in attrs) {
          delete attrs[attr]
        }
      }

      const proto = tool.constructor.prototype
      let values = by_type.get(proto)
      if (values == null) {
        by_type.set(proto, values=new Set())
      }
      values.add({tool, attrs})
    }
  }

  for (const [cls, entries] of by_type.entries()) {
    if (merge != null) {
      const merged = merge(cls, [...entries].map((entry) => entry.tool))
      if (merged != null) {
        computed.push(merged)
        continue
      }
    }

    while (entries.size != 0) {
      const [head, ...tail] = entries
      entries.delete(head)

      const group = [head.tool]
      for (const item of tail) {
        if (is_equal(item.attrs, head.attrs)) {
          group.push(item.tool)
          entries.delete(item)
        }
      }

      if (group.length == 1) {
        computed.push(group[0])
      } else {
        const merged = merge?.(cls, group)
        computed.push(merged ?? new ToolProxy({tools: group}))
      }
    }
  }

  return computed
}

export type GridPlotItem = UIElement | null | undefined

export function gridplot(children: GridPlotItem[], options: GridPlotOpts & {ncols: number}): GridPlot
export function gridplot(children: GridPlotItem[][], options?: GridPlotOpts): GridPlot

export function gridplot(children: GridPlotItem[] | GridPlotItem[][] | Matrix<GridPlotItem>, options: GridPlotOpts & {ncols?: number} = {}): GridPlot {
  const toolbar_location = options.toolbar_location
  const merge_tools      = options.merge_tools ?? true
  const sizing_mode      = options.sizing_mode
  const ncols            = options.ncols

  const matrix = (() => {
    const has_array = isArrayOf(children, (c) => c == null || c instanceof UIElement)
    const has_ncols = ncols != null
    if (has_array && has_ncols) {
      return Matrix.from(children, ncols)
    } else if (!has_array && !has_ncols) {
      return Matrix.from(children)
    } else {
      throw new Error("gridplot() expects an array of UIElement | null when ncols is set")
    }
  })()

  const items: [UIElement, number, number][] = []
  const toolbars: Toolbar[] = []

  for (const [item, row, col] of matrix) {
    if (item == null) {
      continue
    }

    if (item instanceof Plot) {
      if (merge_tools) {
        toolbars.push(item.toolbar)
        item.toolbar_location = null
      }
    }

    if (item instanceof LayoutDOM) {
      if (options.width != null) {
        item.width = options.width
      }
      if (options.height != null) {
        item.height = options.height
      }
    }

    items.push([item, row, col])
  }

  function merge(_cls: typeof Tool, group: Tool[]) {
    const tool = group[0]
    if (tool instanceof SaveTool) {
      return new SaveTool()
    } else if (tool instanceof CopyTool) {
      return new CopyTool()
    } else if (tool instanceof ExamineTool) {
      return new ExamineTool()
    } else if (tool instanceof FullscreenTool) {
      return new FullscreenTool()
    } else {
      return null
    }
  }

  const tools = (() => {
    const tools: ToolLike<Tool>[] = []

    for (const toolbar of toolbars) {
      tools.push(...toolbar.tools)
    }

    if (merge_tools) {
      return group_tools(tools, merge)
    } else {
      return tools
    }
  })()

  const logos = toolbars.map((toolbar) => toolbar.logo)
  const autohides = toolbars.map((toolbar) => toolbar.autohide)
  const active_drags = toolbars.map((toolbar) => toolbar.active_drag)
  const active_inspects = toolbars.map((toolbar) => toolbar.active_inspect)
  const active_scrolls = toolbars.map((toolbar) => toolbar.active_scroll)
  const active_taps = toolbars.map((toolbar) => toolbar.active_tap)
  const active_multis = toolbars.map((toolbar) => toolbar.active_multi)

  function assert_unique<T>(values: T[], name: string): T | undefined {
    const n = new Set(values).size
    if (n == 0) {
      return undefined
    } else if (n > 1) {
      console.warn(`found multiple competing values for 'toolbar.${name}' property; using the latest value`)
    }
    return last(values)
  }

  const logo = assert_unique(logos, "logo")
  const autohide = assert_unique(autohides, "autohide")
  const active_drag = assert_unique(active_drags, "active_drag")
  const active_inspect = assert_unique(active_inspects, "active_inspect")
  const active_scroll = assert_unique(active_scrolls, "active_scroll")
  const active_tap = assert_unique(active_taps, "active_tap")
  const active_multi = assert_unique(active_multis, "active_multi")

  const toolbar = new Toolbar({
    tools,
    logo,
    autohide,
    active_drag,
    active_inspect,
    active_scroll,
    active_tap,
    active_multi,
    // TODO ...toolbar_options,
  })

  const gp = new GridPlot({
    children: items,
    toolbar,
    toolbar_location,
    sizing_mode,
  })

  return gp
}
