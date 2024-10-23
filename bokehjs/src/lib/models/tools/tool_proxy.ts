import type * as p from "core/properties"
import type {EventType} from "core/ui_events"
import {Signal0} from "core/signaling"
import {Model} from "../../model"
import type {ToolView, EventRole} from "./tool"
import {Tool} from "./tool"
import type {ToolButton} from "./tool_button"
import type {InspectTool} from "./inspectors/inspect_tool"
import type {MenuItem} from "core/util/menus"
import {enumerate, some} from "core/util/iterator"

export type ToolLike<T extends Tool> = T | ToolProxy<T>

export namespace ToolProxy {
  export type Attrs<T extends Tool> = p.AttrsOf<Props<T>>

  export type Props<T extends Tool> = Model.Props & {
    tools: p.Property<T[]>
    active: p.Property<boolean>
    disabled: p.Property<boolean>
  }
}

export interface ToolProxy<T extends Tool> extends ToolProxy.Attrs<T> {}

export class ToolProxy<T extends Tool> extends Model {
  declare properties: ToolProxy.Props<T>
  declare __view_type__: ToolView

  constructor(attrs?: Partial<ToolProxy.Attrs<T>>) {
    super(attrs)
  }

  static {
    this.define<ToolProxy.Props<Tool>>(({Bool, List, Ref}) => ({
      tools:    [ List(Ref(Tool)), [] ],
      active:   [ Bool, (self) => some((self as ToolProxy<Tool>).tools, (tool) => tool.active) ],
      disabled: [ Bool, false ],
    }))
  }

  readonly do = new Signal0(this, "do")

  // Operates all the tools given only one button
  get underlying(): Tool {
    return this.tools[0]
  }

  tool_button(): ToolButton {
    const button = this.tools[0].tool_button()
    button.tool = this
    return button
  }

  get event_type(): EventType | EventType[] | undefined {
    return this.tools[0].event_type
  }

  get event_role(): EventRole {
    return this.tools[0].event_role
  }

  get event_types(): EventType[] {
    return this.tools[0].event_types
  }

  get default_order(): number {
    return (this.tools[0] as any).default_order // only gestures etc.
  }

  get tooltip(): string {
    return this.tools[0].tooltip
  }

  get tool_name(): string {
    return this.tools[0].tool_name
  }

  get computed_icon(): string | undefined {
    return this.tools[0].computed_icon
  }

  get toggleable(): boolean {
    const tool = this.tools[0] as Tool
    return "toggleable" in tool && (tool as InspectTool).toggleable
  }

  get visible(): boolean {
    const tool = this.tools[0] as Tool
    return tool.visible
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.do, () => this.doit())
    this.connect(this.properties.active.change, () => this.set_active())
    for (const tool of this.tools) {
      this.connect(tool.properties.active.change, () => {
        this.active = tool.active
      })
    }
  }

  doit(): void {
    for (const tool of this.tools) {
      (tool as any).do.emit()
    }
  }

  set_active(): void {
    for (const tool of this.tools) {
      tool.active = this.active
    }
  }

  get menu(): MenuItem[] | null {
    const {menu} = this.tools[0]
    if (menu == null) {
      return null
    }

    const items = []
    for (const [item, i] of enumerate(menu)) {
      if (item == null) {
        items.push(null)
      } else {
        const handler = () => {
          for (const tool of this.tools) {
            tool.menu?.[i]?.handler?.()
          }
        }
        items.push({...item, handler})
      }
    }
    return items
  }

  supports_auto(): boolean {
    return this.tools[0].supports_auto()
  }

  /* XXX: this.model?
  protected _clicked(): void {
    const {active} = this.model
    this.model.active = !active
  }
  */
}
