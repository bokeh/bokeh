import {TickFormatter, TickFormatterView} from "./tick_formatter"
import {copy} from "core/util/array"
import * as p from "core/properties"

export class CategoricalTickFormatterView extends TickFormatterView {
  model: CategoricalTickFormatter

  format(ticks: string[]): string[] {
    return copy(ticks)
  }
}

export namespace CategoricalTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props
}

export interface CategoricalTickFormatter extends CategoricalTickFormatter.Attrs {}

export class CategoricalTickFormatter extends TickFormatter {
  properties: CategoricalTickFormatter.Props
  __view_type__: CategoricalTickFormatterView

  constructor(attrs?: Partial<CategoricalTickFormatter.Attrs>) {
    super(attrs)
  }

  static init_CategoricalTickFormatter(): void {
    this.prototype.default_view = CategoricalTickFormatterView
  }
}
