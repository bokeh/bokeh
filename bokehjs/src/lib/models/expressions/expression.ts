import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Model} from "../../model"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export namespace Expression {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface Expression<T = Arrayable> extends Expression.Attrs {}

export abstract class Expression<T = Arrayable> extends Model {
  override properties: Expression.Props

  constructor(attrs?: Partial<Expression.Attrs>) {
    super(attrs)
  }

  protected _result: Map<ColumnarDataSource, T>

  override initialize(): void {
    super.initialize()
    this._result = new Map()
  }

  protected abstract _v_compute(source: ColumnarDataSource): T

  v_compute(source: ColumnarDataSource): T {
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
  override properties: ScalarExpression.Props

  constructor(attrs?: Partial<ScalarExpression.Attrs>) {
    super(attrs)
  }

  protected _result: Map<ColumnarDataSource, T>

  override initialize(): void {
    super.initialize()
    this._result = new Map()
  }

  protected abstract _compute(source: ColumnarDataSource): T

  compute(source: ColumnarDataSource): T {
    let result = this._result.get(source)
    if (result === undefined || source.changed_for(this)) {
      result = this._compute(source)
      this._result.set(source, result)
    }
    return result
  }
}
