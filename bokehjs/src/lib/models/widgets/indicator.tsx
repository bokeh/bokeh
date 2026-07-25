import {Widget, WidgetView} from "./widget"
import type * as p from "core/properties"

export abstract class IndicatorView extends WidgetView {
  declare model: Indicator
}

export namespace Indicator {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Widget.Props
}

export interface Indicator extends Indicator.Attrs {}

export abstract class Indicator extends Widget {
  declare properties: Indicator.Props
  declare __view_type__: IndicatorView

  constructor(attrs?: Partial<Indicator.Attrs>) {
    super(attrs)
  }
}
