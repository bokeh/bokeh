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

  override connect_signals(): void {
    super.connect_signals()
    // Cached results also depend on this expression's own properties (e.g. `field`),
    // so drop them when any of those change, not only when the data source changes.
    // Property signals fire before `change`, which is what users of the expression
    // listen to, so this doesn't depend on the order in which signals were connected.
    this.on_change([...this], () => this._result.clear())
    // The same for expressions and transforms used in this expression's own specs.
    const invalidate = () => {
      this._result.clear()
      this.change.emit()
    }
    this.connect(this.exprchange, invalidate)
    this.connect(this.transformchange, invalidate)
  }

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

  override connect_signals(): void {
    super.connect_signals()
    // See Expression.connect_signals().
    this.on_change([...this], () => this._result.clear())
    const invalidate = () => {
      this._result.clear()
      this.change.emit()
    }
    this.connect(this.exprchange, invalidate)
    this.connect(this.transformchange, invalidate)
  }

  compute(source: IndexedDataSource): T {
    let result = this._result.get(source)
    if (result === undefined || source.changed_for(this)) {
      result = this._compute(source)
      this._result.set(source, result)
    }
    return result
  }
}
