import {Model} from "../../model"
import * as p from "core/properties"

export type CallbackLike<Obj, Args extends any[], Ret = void> = {
  execute: (obj: Obj, ...args: Args) => Ret
}

export type CallbackLike0<Obj, Ret = void> = CallbackLike<Obj, [], Ret>
export type CallbackLike1<Obj, Arg, Ret = void> = CallbackLike<Obj, [Arg], Ret>

export namespace Callback {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface Callback extends Callback.Attrs {}

export abstract class Callback extends Model implements CallbackLike<unknown, any> {
  properties: Callback.Props

  constructor(attrs?: Partial<Callback.Attrs>) {
    super(attrs)
  }

  abstract execute(cb_obj: unknown, cb_data?: {[key: string]: unknown}): unknown
}
