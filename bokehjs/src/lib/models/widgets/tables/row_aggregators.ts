import {Data, GroupTotals} from "slickgrid"
const {Avg, Min, Max, Sum} = Data.Aggregators

import * as p from 'core/properties'
import {Model} from 'model'

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
  properties: RowAggregator.Props

  constructor(attrs?: Partial<RowAggregator.Attrs>) {
    super(attrs)
  }

  static init_RowAggregator(): void {
    this.prototype.type = 'RowAggregator'
    this.define<RowAggregator.Props>({
      field_: [ p.String, '' ],
    })
  }

  abstract init(): void
  abstract accumulate(item: { [key: string]: any }): void
  abstract storeResult(totals: GroupTotals<number>): void
}

const avg = new Avg()
export class AvgAggregator extends RowAggregator {
  readonly key = 'avg'

  static init_AvgAggregator(): void {
    this.prototype.type = 'AvgAggregator'
  }

  init = avg.init
  accumulate = avg.accumulate
  storeResult = avg.storeResult
}

const min = new Min()
export class MinAggregator extends RowAggregator {
  readonly key = 'min'

  static init_MinAggregator(): void {
    this.prototype.type = 'MinAggregator'
  }

  init = min.init
  accumulate = min.accumulate
  storeResult = min.storeResult
}

const max = new Max()
export class MaxAggregator extends RowAggregator {
  readonly key = 'max'

  static init_MaxAggregator(): void {
    this.prototype.type = 'MaxAggregator'
  }

  init = max.init
  accumulate = max.accumulate
  storeResult = max.storeResult
}

const sum = new Sum()
export class SumAggregator extends RowAggregator {
  readonly key = 'sum'

  static init_SumAggregator(): void {
    this.prototype.type = 'SumAggregator'
  }

  init = sum.init
  accumulate = sum.accumulate
  storeResult = sum.storeResult
}
