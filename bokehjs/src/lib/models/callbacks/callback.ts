import {Model} from "../../model"

export type CallbackLike<T, R = void> = {
  execute: (obj: T, data?: {[key: string]: unknown}) => R
}

export namespace Callback {
  export interface Attrs extends Model.Attrs {}

  export interface Props extends Model.Props {}
}

export interface Callback extends Callback.Attrs {}

export abstract class Callback extends Model implements CallbackLike<unknown> {

  properties: Callback.Props

  constructor(attrs?: Partial<Callback.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Callback'
  }

  abstract execute(cb_obj: unknown, cb_data?: {[key: string]: unknown}): unknown
}
Callback.initClass()
