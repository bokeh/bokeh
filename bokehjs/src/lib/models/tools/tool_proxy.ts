import * as p from "core/properties"
import {EventType} from "core/ui_events"
import {Signal0} from "core/signaling"
import {Class} from "core/class"
import {Model} from "../../model"
import {Tool} from "./tool"
import {ToolButtonView} from "./tool_button"
import {InspectTool} from "./inspectors/inspect_tool"
import {Renderer} from "../renderers/renderer"
import {MenuItem} from "core/util/menus"
import {enumerate, flat_map, some} from "core/util/iterator"

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
  override properties: ToolProxy.Props<T>

  constructor(attrs?: Partial<ToolProxy.Attrs<T>>) {
    super(attrs)
  }

  static {
    this.define<ToolProxy.Props<Tool>>(({Boolean, Array, Ref}) => ({
      tools:    [ Array(Ref(Tool)), [] ],
      active:   [ Boolean, (self) => some((self as ToolProxy<Tool>).tools, (tool) => tool.active) ],
      disabled: [ Boolean, false ],
    }))
  }

  do: Signal0<this>

  // Operates all the tools given only one button

  get underlying(): Tool {
    return this.tools[0]
  }

  get button_view(): Class<ToolButtonView> {
    return this.tools[0].button_view
  }

  get event_type(): EventType | EventType[] {
    return this.tools[0].event_type!
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
    const tool = this.tools[0]
    return tool instanceof InspectTool && tool.toggleable
  }

  get computed_overlays(): Renderer[] {
    return [...flat_map(this.tools, (tool) => tool.computed_overlays)]
  }

  override initialize(): void {
    super.initialize()
    this.do = new Signal0(this, "do")
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
    if (menu == null)
      return null

    const items = []
    for (const [item, i] of enumerate(menu)) {
      if (item == null)
        items.push(null)
      else {
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

  /* XXX: this.model?
  protected _clicked(): void {
    const {active} = this.model
    this.model.active = !active
  }
  */
}
