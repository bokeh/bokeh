import { Indicator, IndicatorView } from "./indicator"
import * as p from "core/properties"
import { div, empty } from 'core/dom';
import * as enums from 'core/enums';

export class ServerStatusIndicatorView extends IndicatorView {
  model: ServerStatusIndicator

  css_classes(): string[] {
    return super.css_classes().concat("bk-toolbar-status")
  }

  render(): void {
    empty(this.el)
    this.el.appendChild(
      div({
        class: ["bk-server-status", `bk-server-status_${this.model.status.valueOf()}`],
        title: `${this.model.tooltip_prefix}${this.model.status.valueOf().toUpperCase()}`
      })
    )
  }
}


export namespace ServerStatusIndicator {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Indicator.Props & {
    status: p.EnumProperty<enums.ServerStatus>
    tooltip_prefix: p.Property<String>
  }
}

export interface ServerStatusIndicator
       extends ServerStatusIndicator.Attrs { }

export class ServerStatusIndicator extends Indicator {
  properties: ServerStatusIndicator.Props

  constructor(attrs?: Partial<ServerStatusIndicator.Attrs>) {
    super(attrs)
    
    window.document.addEventListener('bk-connection-status', (e: CustomEvent) =>  {
      this.status = e.detail.status as enums.ServerStatus;
    })
  }

  static initClass(): void {
    this.prototype.type = "ServerStatusIndicator"
    this.prototype.default_view = ServerStatusIndicatorView

    this.define<ServerStatusIndicator.Props>({
      tooltip_prefix: [ p.String,                   ""        ],
      status:         [ p.Enum(enums.ServerStatus), "unknown" ]
    })
  }

  indicator_name = "Server Status"
}

ServerStatusIndicator.initClass()
