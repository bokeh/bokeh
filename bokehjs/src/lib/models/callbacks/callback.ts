import {Model} from "../../model"
import type * as p from "core/properties"
import type {Executable} from "core/util/callbacks"

export namespace Callback {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface Callback extends Callback.Attrs {}

export abstract class Callback extends Model implements Executable<unknown, any, unknown> {
  declare properties: Callback.Props

  constructor(attrs?: Partial<Callback.Attrs>) {
    super(attrs)
  }

  abstract execute(cb_obj: unknown, cb_data?: {[key: string]: unknown}): unknown | Promise<unknown>
}
