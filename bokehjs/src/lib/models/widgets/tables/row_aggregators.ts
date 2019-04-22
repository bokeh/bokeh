const { Aggregators: { Avg, Min, Max, Sum } } = require('slickgrid/slick.dataview')

import * as p from 'core/properties'
import { Model } from 'model'

export type GroupTotals = {
  avg: { [field_: string]: number }
  min: { [field_: string]: number }
  max: { [field_: string]: number }
  sum: { [field_: string]: number }
}

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
    this.prototype.type = 'RowAggregator'
    
    this.define<RowAggregator.Props>({
      field_: [ p.String, '' ],
    })
  }

  abstract init(): void
  abstract accumulate(item: { [key: string]: any }): void
  abstract storeResult(totals: GroupTotals): void
}
RowAggregator.initClass()

export class AvgAggregator extends RowAggregator {
  readonly key = 'avg'

  static initClass(): void {
    this.prototype.type = 'AvgAggregator'
  }

  init = new Avg().init
  accumulate = new Avg().accumulate
  storeResult = new Avg().storeResult
}
AvgAggregator.initClass()

export class MinAggregator extends RowAggregator {
  readonly key = 'min'

  static initClass(): void {
    this.prototype.type = 'MinAggregator'
  }

  init = new Min().init
  accumulate = new Min().accumulate
  storeResult = new Min().storeResult
}
MinAggregator.initClass()

export class MaxAggregator extends RowAggregator {
  readonly key = 'max'

  static initClass(): void {
    this.prototype.type = 'MaxAggregator'
  }

  init = new Max().init
  accumulate = new Max().accumulate
  storeResult = new Max().storeResult
}
MaxAggregator.initClass()

export class SumAggregator extends RowAggregator {
  readonly key = 'sum'

  static initClass(): void {
    this.prototype.type = 'SumAggregator'
  }

  init = new Sum().init
  accumulate = new Sum().accumulate
  storeResult = new Sum().storeResult
}
SumAggregator.initClass()
