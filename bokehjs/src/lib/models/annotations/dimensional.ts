import {Model} from "../../model"
import type * as p from "core/properties"

export namespace Dimensional {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface Dimensional extends Dimensional.Attrs {}

export abstract class Dimensional extends Model {
  declare properties: Dimensional.Props

  constructor(attrs?: Partial<Dimensional.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Dimensional.Props>(({}) => ({
    }))
  }
}

export namespace Metric {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Dimensional.Props
}

export interface Metric extends Metric.Attrs {}

export abstract class Metric extends Dimensional {
  declare properties: Metric.Props

  constructor(attrs?: Partial<Metric.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Metric.Props>(({}) => ({
    }))
  }
}

export namespace MetricLength {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Metric.Props
}

export interface MetricLength extends MetricLength.Attrs {}

export class MetricLength extends Metric {
  declare properties: MetricLength.Props

  constructor(attrs?: Partial<MetricLength.Attrs>) {
    super(attrs)
  }

  static {
    this.define<MetricLength.Props>(({}) => ({
    }))
  }
}
