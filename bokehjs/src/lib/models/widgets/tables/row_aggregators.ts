const {Aggregators: {Avg, Min, Max, Sum}} = require('slickgrid/slick.dataview')

import * as p from 'core/properties'
import {Aggregator} from 'external/slickgrid'
import {Model} from 'model'

export type GroupTotals = {
  avg: {[field_: string]: number}
  min: {[field_: string]: number}
  max: {[field_: string]: number}
  sum: {[field_: string]: number}
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
  abstract accumulate(item: {[key: string]: any}): void
  abstract storeResult(totals: GroupTotals): void
}
RowAggregator.initClass()

function aggregatorFactory(type: string, key: string, {init, accumulate, storeResult}: Aggregator) {
  return class extends RowAggregator {
    key = key

    static initClass(): void {
      this.prototype.type = type
    }

    init = init
    accumulate = accumulate
    storeResult = storeResult
  }
}

export class AvgAggregator extends aggregatorFactory('AvgAggregator', 'avg', new Avg()) {}
AvgAggregator.initClass()

export class MinAggregator extends aggregatorFactory('MinAggregator', 'min', new Min()) {}
MinAggregator.initClass()

export class MaxAggregator extends aggregatorFactory('MaxAggregator', 'max', new Max()) {}
MaxAggregator.initClass()

export class SumAggregator extends aggregatorFactory('SumAggregator', 'sum', new Sum()) {}
SumAggregator.initClass()
