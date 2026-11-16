import type {IndexedDataSource} from "../sources/indexed_data_source"
import {Model} from "../../model"
import type {Arrayable} from "core/types"
import type * as p from "core/properties"

export namespace Expression {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface Expression<T = Arrayable> extends Expression.Attrs {}

export abstract class Expression<T = Arrayable> extends Model {
  declare properties: Expression.Props

  protected readonly _result: Map<IndexedDataSource, T> = new Map()

  protected abstract _v_compute(source: IndexedDataSource): T

  v_compute(source: IndexedDataSource): T {
    let result = this._result.get(source)
    if (result === undefined || source.changed_for(this)) {
      result = this._v_compute(source)
      this._result.set(source, result)
    }
    return result
  }
}

export namespace ScalarExpression {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface ScalarExpression<T> extends ScalarExpression.Attrs {}

export abstract class ScalarExpression<T> extends Model {
  declare properties: ScalarExpression.Props

  protected readonly _result: Map<IndexedDataSource, T> = new Map()

  protected abstract _compute(source: IndexedDataSource): T

  compute(source: IndexedDataSource): T {
    let result = this._result.get(source)
    if (result === undefined || source.changed_for(this)) {
      result = this._compute(source)
      this._result.set(source, result)
    }
    return result
  }
}
