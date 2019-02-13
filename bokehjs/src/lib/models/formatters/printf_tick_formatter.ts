import {sprintf} from "sprintf-js"

import {TickFormatter} from "./tick_formatter"
import * as p from "core/properties"

export namespace PrintfTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
    format: p.Property<string>
  }
}

export interface PrintfTickFormatter extends PrintfTickFormatter.Attrs {}

export class PrintfTickFormatter extends TickFormatter {
  properties: PrintfTickFormatter.Props

  constructor(attrs?: Partial<PrintfTickFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'PrintfTickFormatter'

    this.define<PrintfTickFormatter.Props>({
      format: [ p.String, '%s' ],
    })
  }

  doFormat(ticks: number[], _opts: {loc: number}): string[] {
    return ticks.map((tick) => sprintf(this.format, tick))
  }
}
PrintfTickFormatter.initClass()
