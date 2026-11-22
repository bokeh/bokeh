import {Callback} from "./callback"
import type * as p from "core/properties"
import {entries, to_object} from "core/util/object"
import {unzip} from "core/util/array"
import {use_strict} from "core/util/string"

import type {Model} from "../../model"
import {logger} from "core/logging"
import type {Dict} from "core/types"
import {isFunction} from "core/util/types"
import type {ViewManager} from "core/view_manager"
import {index} from "embed/standalone"

type KV = {[key: string]: unknown}
type Context = {index: ViewManager}

type ESFunc = (args: KV, obj: Model, data: KV, context: Context) => Promise<unknown> | unknown
type JSFunc = (this: Model, obj: Model, data: KV, context: Context) => Promise<unknown> | unknown

type ESState = {func: ESFunc, module: true}
type JSState = {func: JSFunc, module: false}

type State = ESState | JSState

export namespace CustomJS {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Callback.Props & {
    args: p.Property<Dict<unknown>>
    code: p.Property<string>
    module: p.Property<"auto" | boolean>
  }
}

export interface CustomJS extends CustomJS.Attrs {}

export class CustomJS extends Callback {
  declare properties: CustomJS.Props

  static {
    this.define<CustomJS.Props>(({Unknown, Str, Dict, Auto, Or, Bool}) => ({
      args: [ Dict(Unknown), {} ],
      code: [ Str ],
      module: [ Or(Auto, Bool), "auto" ],
    }))
  }

  override connect_signals(): void {
    super.connect_signals()
    const {args, code, module} = this.properties
    this.on_change([args, code, module], () => {
      this._generation += 1
      this._state = null
      this._compiling = null
    })
  }

  protected async _compile_module(): Promise<ESFunc> {
    const url = URL.createObjectURL(new Blob([this.code], {type: "text/javascript"}))
    try {
      // Indirect eval keeps import() native when the classic bundle is transpiled to CommonJS.
      // https://github.com/microsoft/TypeScript/issues/43329
      const module = await globalThis.eval(`import("${url}")`)
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

  protected _compile_function(): JSFunc {
    const [names=[], values=[]] = unzip(entries(this.args))
    const code = use_strict(this.code)
    const func = new Function(...names, "cb_obj", "cb_data", "cb_context", code)
    return function(...args: unknown[]) {
      return func.call(this, ...values, ...args)
    }
  }

  protected _is_es_module(code: string): boolean {
    return code.split("\n").some((line) => line.trimStart().startsWith("export default"))
  }

  /**
   * Whether `code` is an ES module, which can only be compiled asynchronously.
   */
  get is_module(): boolean {
    if (this.module == "auto") {
      return this._is_es_module(this.code)
    } else {
      return this.module
    }
  }

  private _state: State | null = null
  private _compiling: Promise<ESState> | null = null
  private _generation: number = 0

  /** Whether this callback was compiled and can be executed synchronously. */
  get is_compiled(): boolean {
    return this._state != null
  }

  /**
   * Compiles this callback synchronously, unless it's an ES module, which
   * requires `compile()`. Returns whether this callback is compiled.
   */
  compile_sync(): boolean {
    return this._sync_state() != null
  }

  private _sync_state(): State | null {
    if (this._state == null && !this.is_module) {
      this._state = {func: this._compile_function(), module: false}
    }
    return this._state
  }

  /** Compiles this callback, which for ES modules is asynchronous. */
  async compile(): Promise<void> {
    await this.state()
  }

  async state(): Promise<State> {
    const state = this._sync_state()
    if (state != null) {
      return state
    }
    // concurrent calls share the compilation
    this._compiling ??= this._compile_module_state()
    return await this._compiling
  }

  /**
   * A compilation superseded by a change of code or args isn't stored, and
   * a failed one can be retried.
   */
  private async _compile_module_state(): Promise<ESState> {
    const generation = this._generation
    try {
      const state: ESState = {func: await this._compile_module(), module: true}
      if (generation == this._generation) {
        this._state = state
      }
      return state
    } finally {
      if (generation == this._generation) {
        this._compiling = null
      }
    }
  }

  async execute(obj: Model, data: KV = {}): Promise<unknown> {
    const {func, module} = await this.state()
    const context = {index}
    if (module) {
      return func(to_object(this.args), obj, data, context)
    } else {
      return func.call(obj, obj, data, context)
    }
  }

  /**
   * Executes this callback synchronously. ES modules have to be compiled
   * first (see `compile()` and `is_compiled`).
   */
  execute_sync(obj: Model, data: KV = {}): unknown {
    const state = this._sync_state()
    if (state == null) {
      throw new Error(`${this.type} with an ES module needs to be compiled first`)
    }
    const {func, module} = state
    const context = {index}
    if (module) {
      return func(to_object(this.args), obj, data, context)
    } else {
      return func.call(obj, obj, data, context)
    }
  }
}
