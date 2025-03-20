import type {GroupTotals} from "@bokeh/slickgrid"
import {Data} from "@bokeh/slickgrid"
const {Avg, Min, Max, Sum} = Data.Aggregators

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

  constructor(attrs?: Partial<RowAggregator.Attrs>) {
    super(attrs)
    this.maybe_initialize(RowAggregator.__name__, attrs)
  }

  static {
    this.define<RowAggregator.Props>(({Str}) => ({
      field_: [ Str, "" ],
    }))
  }

  abstract init(): void
  abstract accumulate(item: { [key: string]: any }): void
  abstract storeResult(totals: GroupTotals<number>): void
}

const avg = new Avg()
export class AvgAggregator extends RowAggregator {
  constructor(attrs?: Partial<RowAggregator.Attrs>) {
    super(attrs)
    this.maybe_initialize(AvgAggregator.__name__, attrs)
  }

  override readonly key = "avg"

  init = avg.init
  accumulate = avg.accumulate
  storeResult = avg.storeResult
}

const min = new Min()
export class MinAggregator extends RowAggregator {
  constructor(attrs?: Partial<RowAggregator.Attrs>) {
    super(attrs)
    this.maybe_initialize(MinAggregator.__name__, attrs)
  }

  override readonly key = "min"

  init = min.init
  accumulate = min.accumulate
  storeResult = min.storeResult
}

const max = new Max()
export class MaxAggregator extends RowAggregator {
  constructor(attrs?: Partial<RowAggregator.Attrs>) {
    super(attrs)
    this.maybe_initialize(MaxAggregator.__name__, attrs)
  }

  override readonly key = "max"

  init = max.init
  accumulate = max.accumulate
  storeResult = max.storeResult
}

const sum = new Sum()
export class SumAggregator extends RowAggregator {
  constructor(attrs?: Partial<RowAggregator.Attrs>) {
    super(attrs)
    this.maybe_initialize(SumAggregator.__name__, attrs)
  }

  override readonly key = "sum"

  init = sum.init
  accumulate = sum.accumulate
  storeResult = sum.storeResult
}
