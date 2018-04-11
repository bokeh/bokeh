import {Model} from "../../model"

export namespace Callback {
  export interface Attrs extends Model.Attrs {}

  export interface Props extends Model.Props {}
}

export interface Callback extends Callback.Attrs {}

export abstract class Callback extends Model {

  properties: Callback.Props

  constructor(attrs?: Partial<Callback.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Callback'
  }

  abstract execute(cb_obj: any, cb_data: {[key: string]: any}): any
}
Callback.initClass()
