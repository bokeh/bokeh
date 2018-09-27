import * as p from "core/properties"
import {EventType} from "core/ui_events"
import {Signal0} from "core/signaling"
import {Class} from "core/class"
import {Model} from "../../model"
import {ButtonTool, ButtonToolButtonView} from "./button_tool"

export namespace ToolProxy {
  export interface Attrs extends Model.Attrs {
    tools: ButtonTool[]
    active: boolean
    disabled: boolean
  }

  export interface Props extends Model.Props {
    tools: p.Property<ButtonTool[]>
    active: p.Property<boolean>
    disabled: p.Property<boolean>
  }
}

export interface ToolProxy extends ToolProxy.Attrs {}

export class ToolProxy extends Model {

  properties: ToolProxy.Props

  constructor(attrs?: Partial<ToolProxy.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "ToolProxy"

    this.define({
      tools:    [ p.Array, []    ],
      active:   [ p.Bool,  false ],
      disabled: [ p.Bool,  false ],
    })
  }

  do: Signal0<this>

  // Operates all the tools given only one button

  get button_view(): Class<ButtonToolButtonView> {
    return this.tools[0].button_view
  }

  get event_type(): undefined | EventType | EventType[] {
    return this.tools[0].event_type
  }

  get tooltip(): string {
    return this.tools[0].tooltip
  }

  get tool_name(): string {
    return this.tools[0].tool_name
  }

  get icon(): string {
    return this.tools[0].computed_icon
  }

  get computed_icon(): string {
    return this.icon
  }

  initialize(): void {
    super.initialize()
    this.do = new Signal0(this, "do")
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.do, () => this.doit())
    this.connect(this.properties.active.change, () => this.set_active())
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

  /* XXX: this.model?
  protected _clicked(): void {
    const {active} = this.model
    this.model.active = !active
  }
  */
}
ToolProxy.initClass()
