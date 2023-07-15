import {GridPlot, Plot} from "../models/plots"
import type {Tool} from "../models/tools/tool"
import type {ToolLike} from "../models/tools/tool_proxy"
import {ToolProxy} from "../models/tools/tool_proxy"
import {SaveTool} from "../models/tools/actions/save_tool"
import {CopyTool} from "../models/tools/actions/copy_tool"
import {ExamineTool} from "../models/tools/actions/examine_tool"
import {FullscreenTool} from "../models/tools/actions/fullscreen_tool"
import {Toolbar} from "../models/tools/toolbar"
import type {LayoutDOM} from "../models/layouts/layout_dom"
import type {SizingMode, Location} from "../core/enums"
import {Matrix} from "../core/util/matrix"
import {is_equal} from "../core/util/eq"
import type {Attrs} from "../core/types"

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
      if (values == null)
        by_type.set(proto, values=new Set())
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

      if (group.length == 1)
        computed.push(group[0])
      else {
        const merged = merge?.(cls, group)
        computed.push(merged ?? new ToolProxy({tools: group}))
      }
    }
  }

  return computed
}

export function gridplot(children: (LayoutDOM | null)[][] | Matrix<LayoutDOM | null>, options: GridPlotOpts = {}): GridPlot {
  const toolbar_location = options.toolbar_location
  const merge_tools      = options.merge_tools ?? true
  const sizing_mode      = options.sizing_mode

  const matrix = Matrix.from(children)

  const items: [LayoutDOM, number, number][] = []
  const tools: ToolLike<Tool>[] = []

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

  function merge(_cls: typeof Tool, group: Tool[]) {
    const tool = group[0]
    if (tool instanceof SaveTool)
      return new SaveTool()
    else if (tool instanceof CopyTool)
      return new CopyTool()
    else if (tool instanceof ExamineTool)
      return new ExamineTool()
    else if (tool instanceof FullscreenTool)
      return new FullscreenTool()
    else
      return null
  }

  const toolbar = new Toolbar({tools: !merge_tools ? tools : group_tools(tools, merge)})
  return new GridPlot({children: items, toolbar, toolbar_location, sizing_mode})
}
