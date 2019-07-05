const {Aggregators: {Avg, Min, Max, Sum}} = require('slickgrid/slick.dataview')

import * as p from 'core/properties'
import {GroupTotals} from 'slickgrid'
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

  static initClass(): void {
    this.prototype.type = 'AvgAggregator'
  }

  abstract init(): void
  abstract accumulate(item: { [key: string]: any }): void
  abstract storeResult(totals: GroupTotals): void
}

const avg = new Avg()
export class AvgAggregator extends RowAggregator {
  readonly key = 'avg'

  static initClass(): void {
    this.prototype.type = 'AvgAggregator'
  }

  init = avg.init
  accumulate = avg.accumulate
  storeResult = avg.storeResult
}
AvgAggregator.initClass()

const min = new Min()
export class MinAggregator extends RowAggregator {
  properties: RowAggregator.Props
  readonly key = 'min'

  static initClass(): void {
    this.prototype.type = 'MinAggregator'
  }

  init = min.init
  accumulate = min.accumulate
  storeResult = min.storeResult
}
MinAggregator.initClass()

const max = new Max()
export class MaxAggregator extends RowAggregator {
  properties: RowAggregator.Props
  readonly key = 'max'

  static initClass(): void {
    this.prototype.type = 'MaxAggregator'
  }

  init = max.init
  accumulate = max.accumulate
  storeResult = max.storeResult
}
MaxAggregator.initClass()

const sum = new Sum()
export class SumAggregator extends RowAggregator {
  properties: RowAggregator.Props
  readonly key = 'sum'

  static initClass(): void {
    this.prototype.type = 'SumAggregator'
  }

  init = sum.init
  accumulate = sum.accumulate
  storeResult = sum.storeResult
}
SumAggregator.initClass()
