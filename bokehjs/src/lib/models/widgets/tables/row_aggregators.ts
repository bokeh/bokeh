import type {SlickGroupTotals} from "slickgrid"
import {Aggregators} from "slickgrid"
import type {Aggregator} from "slickgrid"
const {Avg, Min, Max, Sum} = Aggregators

import type * as p from "core/properties"
import {Model} from "model"

export namespace RowAggregator {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    field_: p.Property<string>
  }
}

export interface RowAggregator extends RowAggregator.Attrs {
  readonly key: string
}

export abstract class RowAggregator extends Model {
  declare properties: RowAggregator.Props

  // This holds the actual SlickGrid aggregator instance (Avg, Sum, etc.)
  protected _aggregator: Aggregator

  protected abstract readonly aggregator_cls: new (field: string) => Aggregator

  constructor(attrs?: Partial<RowAggregator.Attrs>) {
    super(attrs)
  }

  static {
    this.define<RowAggregator.Props>(({Str}) => ({
      field_: [ Str, "" ],
    }))
  }

  init(): void {
    this._aggregator = new this.aggregator_cls(this.field_)
    this._aggregator.init()
  }

  accumulate(item: {[key: string]: unknown}): void {
    this._aggregator.accumulate!(item)
  }

  storeResult(totals: SlickGroupTotals): void {
    this._aggregator.storeResult(totals)
  }
}

export class AvgAggregator extends RowAggregator {
  override readonly key = "avg"
  protected readonly aggregator_cls = Avg
}

export class MinAggregator extends RowAggregator {
  override readonly key = "min"
  protected readonly aggregator_cls = Min
}

export class MaxAggregator extends RowAggregator {
  override readonly key = "max"
  protected readonly aggregator_cls = Max
}

export class SumAggregator extends RowAggregator {
  override readonly key = "sum"
  protected readonly aggregator_cls = Sum
}
