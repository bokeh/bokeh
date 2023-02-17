import {Callback} from "./callback"
import {Model} from "../../model"
import {logger} from "core/logging"
import * as p from "core/properties"
import {isFunction} from "core/util/types"

type KV = {[key: string]: unknown}
type Func = (args: KV, obj: Model, data: KV) => Promise<unknown> | unknown

export namespace CustomESM {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Callback.Props & {
    args: p.Property<{[key: string]: unknown}>
    code: p.Property<string>
  }
}

export interface CustomESM extends CustomESM.Attrs {}

export class CustomESM extends Callback {
  declare properties: CustomESM.Props

  constructor(attrs?: Partial<CustomESM.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CustomESM.Props>(({Unknown, String, Dict}) => ({
      args: [ Dict(Unknown), {} ],
      code: [ String ],
    }))
  }

  private _func: Func | null = null
  async func(): Promise<Func> {
    if (this._func == null) {
      const url = URL.createObjectURL(new Blob([this.code], {type: "text/javascript"}))
      try {
        // XXX: eval() to work around transpilation to require()
        // https://github.com/microsoft/TypeScript/issues/43329
        const module = await eval(`import("${url}")`)
        if (isFunction(module.default)) {
          this._func = module.default as Func
        } else {
          logger.warn("custom ES module didn't export a default function")
          this._func = () => undefined
        }
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    return this._func
  }

  async execute(obj: Model, data: {[key: string]: unknown} = {}): Promise<unknown> {
    const func = await this.func()
    return await func(this.args, obj, data)
  }
}
