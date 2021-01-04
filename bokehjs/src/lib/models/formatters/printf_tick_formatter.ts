import {TickFormatter, TickFormatterView} from "./tick_formatter"
import {sprintf} from "core/util/templating"
import * as p from "core/properties"

export class PrintfTickFormatterView extends TickFormatterView {
  model: PrintfTickFormatter

  format(ticks: number[]): string[] {
    const {format} = this.model
    return ticks.map((tick) => sprintf(format, tick))
  }
}

export namespace PrintfTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
    format: p.Property<string>
  }
}

export interface PrintfTickFormatter extends PrintfTickFormatter.Attrs {}

export class PrintfTickFormatter extends TickFormatter {
  properties: PrintfTickFormatter.Props
  __view_type__: PrintfTickFormatterView

  constructor(attrs?: Partial<PrintfTickFormatter.Attrs>) {
    super(attrs)
  }

  static init_PrintfTickFormatter(): void {
    this.prototype.default_view = PrintfTickFormatterView

    this.define<PrintfTickFormatter.Props>(({String}) => ({
      format: [ String, "%s" ],
    }))
  }
}
