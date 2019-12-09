import {Callback} from "./callback"
import * as p from "core/properties"
import {keys, values} from "core/util/object"
import {use_strict} from "core/util/string"

export namespace CustomJS {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Callback.Props & {
    args: p.Property<{[key: string]: unknown}>
    code: p.Property<string>
  }
}

export interface CustomJS extends CustomJS.Attrs {}

export class CustomJS extends Callback {
  properties: CustomJS.Props

  constructor(attrs?: Partial<CustomJS.Attrs>) {
    super(attrs)
  }

  static init_CustomJS(): void {
    this.define<CustomJS.Props>({
      args:       [ p.Any,     {}    ], // TODO (bev) better type
      code:       [ p.String,  ''    ],
    })
  }

  get names(): string[] {
    return keys(this.args)
  }

  get values(): any[] {
    return values(this.args)
  }

  get func(): Function {
    const code = use_strict(this.code)
    return new Function(...this.names, "cb_obj", "cb_data", code)
  }

  execute(cb_obj: unknown, cb_data: {[key: string]: unknown} = {}): unknown {
    return this.func.apply(cb_obj, this.values.concat(cb_obj, cb_data))
  }
}
