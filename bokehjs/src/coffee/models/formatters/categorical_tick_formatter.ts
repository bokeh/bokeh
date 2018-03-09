/* XXX: partial */
import {TickFormatter} from "./tick_formatter"

export namespace CategoricalTickFormatter {
  export interface Attrs extends TickFormatter.Attrs {}

  export interface Props extends TickFormatter.Props {}
}

export interface CategoricalTickFormatter extends CategoricalTickFormatter.Attrs {}

export class CategoricalTickFormatter extends TickFormatter {

  properties: CategoricalTickFormatter.Props

  constructor(attrs?: Partial<CategoricalTickFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'CategoricalTickFormatter';
  }

  doFormat(ticks, _axis) {
    return ticks;
  }
}
CategoricalTickFormatter.initClass();
