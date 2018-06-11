import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Model} from "../../model"
import {Arrayable} from "core/types"

export namespace Expression {
  export interface Attrs extends Model.Attrs {}

  export interface Props extends Model.Props {}
}

export interface Expression extends Expression.Attrs {}

export abstract class Expression extends Model {

  properties: Expression.Props

  constructor(attrs?: Partial<Expression.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Expression"
  }

  protected _connected: {[key: string]: boolean} = {}
  protected _result: {[key: string]: Arrayable} = {}

  initialize(): void {
    super.initialize()
    this._connected = {}
    this._result = {}
  }

  protected abstract _v_compute(source: ColumnarDataSource): Arrayable

  v_compute(source: ColumnarDataSource): Arrayable {
    if (this._connected[source.id] == null) {
      this.connect(source.change, () => delete this._result[source.id])
      this.connect(source.patching, () => delete this._result[source.id])
      this.connect(source.streaming, () => delete this._result[source.id])
      this._connected[source.id] = true
    }

    let result = this._result[source.id]

    if (result == null)
      this._result[source.id] = result = this._v_compute(source)

    return result
  }
}
Expression.initClass()
