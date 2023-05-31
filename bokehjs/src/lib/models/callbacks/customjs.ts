import {Callback} from "./callback"
import type * as p from "core/properties"
import {entries} from "core/util/object"
import {unzip} from "core/util/array"
import {use_strict} from "core/util/string"

import type {Model} from "../../model"
import {logger} from "core/logging"
import {isFunction} from "core/util/types"

type KV = {[key: string]: unknown}

type ESFunc = (args: KV, obj: Model, data: KV) => Promise<unknown> | unknown
type JSFunc = (this: Model, obj: Model, data: KV) => Promise<unknown> | unknown

type ESState = {func: ESFunc, module: true}
type JSState = {func: JSFunc, module: false}

type State = ESState | JSState

export namespace CustomJS {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Callback.Props & {
    args: p.Property<{[key: string]: unknown}>
    code: p.Property<string>
    module: p.Property<"auto" | boolean>
  }
}

export interface CustomJS extends CustomJS.Attrs {}

export class CustomJS extends Callback {
  declare properties: CustomJS.Props

  constructor(attrs?: Partial<CustomJS.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CustomJS.Props>(({Unknown, String, Dict, Auto, Or, Boolean}) => ({
      args: [ Dict(Unknown), {} ],
      code: [ String ],
      module: [ Or(Auto, Boolean), "auto" ],
    }))
  }

  override connect_signals(): void {
    super.connect_signals()
    const {args, code, module} = this.properties
    this.on_change([args, code, module], () => this._state = null)
  }

  protected async _compile_module(): Promise<ESFunc> {
    const url = URL.createObjectURL(new Blob([this.code], {type: "text/javascript"}))
    try {
      // XXX: eval() to work around transpilation to require()
      // https://github.com/microsoft/TypeScript/issues/43329
      const module = await eval(`import("${url}")`)
      if (isFunction(module.default)) {
        return module.default as ESFunc
      } else {
        logger.warn("custom ES module didn't export a default function")
        return () => undefined
      }
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  protected async _compile_function(): Promise<JSFunc> {
    const [names=[], values=[]] = unzip(entries(this.args))
    const code = use_strict(this.code)
    const func = new Function(...names, "cb_obj", "cb_data", code)
    return func.bind(undefined, ...values)
  }

  protected _is_es_module(code: string): boolean {
    return code.split("\n").some((line) => line.trimStart().startsWith("export default"))
  }

  protected async _compile(): Promise<State> {
    const module = (() => {
      if (this.module == "auto") {
        return this._is_es_module(this.code)
      } else {
        return this.module
      }
    })()

    if (module) {
      return {func: await this._compile_module(), module}
    } else {
      return {func: await this._compile_function(), module}
    }
  }

  private _state: State | null = null
  async state(): Promise<State> {
    if (this._state == null) {
      this._state = await this._compile()
    }
    return this._state
  }

  async execute(obj: Model, data: KV = {}): Promise<unknown> {
    const {func, module} = await this.state()
    if (module) {
      return func(this.args, obj, data)
    } else {
      return func.call(obj, obj, data)
    }
  }
}
