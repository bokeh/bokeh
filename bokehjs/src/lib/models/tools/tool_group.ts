import {ToolProxy} from "./tool_proxy"
import type {Tool, ToolView} from "./tool"
import type * as p from "core/properties"

export namespace ToolGroup {
  export type Attrs<T extends Tool> = p.AttrsOf<Props<T>>
  export type Props<T extends Tool> = ToolProxy.Props<T> & {
    show_count: p.Property<boolean>
  }
}

export interface ToolGroup<T extends Tool> extends ToolGroup.Attrs<T> {}

export class ToolGroup<T extends Tool> extends ToolProxy<T> {
  declare properties: ToolGroup.Props<T>
  declare __view_type__: ToolView

  constructor(attrs?: Partial<ToolGroup.Attrs<T>>) {
    super(attrs)
  }

  static {
    this.define<ToolGroup.Props<Tool>>(({Bool}) => ({
      show_count: [ Bool, false ],
    }))
  }

  override get tooltip(): string {
    return this.tools.map((tool) => tool.tooltip).join("\n")
  }
}
