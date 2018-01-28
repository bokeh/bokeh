/* XXX: partial */
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

  static initClass() {
    this.prototype.type = "Expression"
  }

  initialize(): void {
    super.initialize();
    this._connected= {};
    this._result = {};
  }

  _v_compute(source) {
    if ((this._connected[source.id] == null)) {
      this.connect(source.change, function() { return this._result[source.id] = null; });
      this._connected[source.id] = true;
    }

    if (this._result[source.id] != null) {
      return this._result[source.id];
    }

    this._result[source.id] = this.v_compute(source);
    return this._result[source.id];
  }
}
Expression.initClass()
