import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Model} from "../../model"

export namespace Expression {
  export interface Attrs extends Model.Attrs {}

  export interface Opts extends Model.Opts {}
}

export interface Expression extends Expression.Attrs {}

export abstract class Expression extends Model {

  constructor(attrs?: Partial<Expression.Attrs>, opts?: Expression.Opts) {
    super(attrs, opts)
  }

  static initClass(): void {
    this.prototype.type = "Expression"
  }

  protected _connected: {[key: string]: boolean} = {}
  protected _result: {[key: string]: ArrayLike<any>} = {}

  initialize(): void {
    super.initialize()
    this._connected = {}
    this._result = {}
  }

  abstract v_compute(source: ColumnarDataSource): ArrayLike<any>

  protected _v_compute(source: ColumnarDataSource): ArrayLike<any> {
    if (this._connected[source.id] == null) {
      this.connect(source.change, () => delete this._result[source.id])
      this._connected[source.id] = true
    }

    let result = this._result[source.id]

    if (result == null)
      this._result[source.id] = result = this.v_compute(source)

    return result
  }
}
Expression.initClass()
