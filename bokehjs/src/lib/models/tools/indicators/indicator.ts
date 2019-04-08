import * as p from "core/properties"
import { DOMView } from 'core/dom_view';
import { Class } from 'core/class'
import { Tool } from '../tool';

export abstract class IndicatorView extends DOMView {
  model: Indicator

  initialize(): void {
    super.initialize();
    this.connect(this.model.change, () => this.render())
    this.render()
  }

  css_classes(): string[] {
    return super.css_classes().concat("bk-toolbar-status")
  }

  abstract render(): void
}

export namespace Indicator {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Tool.Props
}


export interface Indicator extends Indicator.Attrs {}

export abstract class Indicator extends Tool {
  properties: Indicator.Props

  constructor(attrs?: Partial<Indicator.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Indicator"
  }

  tool_name: string
  indicator_view: Class<IndicatorView>

  get tooltip(): string {
    return this.tool_name
  }
}

Indicator.initClass()
