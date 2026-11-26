import {Model} from "../../model"
import type {Document} from "document"
import {Callback} from "../callbacks/callback"
import {CustomJS} from "../callbacks/customjs"
import type {ExecutableLike, SyncExecutableLike} from "core/util/callbacks"
import {KeyCombination, KeySequence} from "core/keyboard"
import type {InternalKeyBinding} from "core/keyboard"
import type {Dict} from "core/types"
import {isArray} from "core/util/types"
import type * as p from "core/properties"

export namespace KeyBinding {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    description: p.Property<string | null>
    keys: p.Property<KeyCombination | KeySequence>
    command: p.Property<string | null>
    args: p.Property<Dict<unknown>>
    when: p.Property<SyncExecutableLike<Model, [], boolean> | null>
    action: p.Property<ExecutableLike<Model, [], void> | null>
    priority: p.Property<number>
  }
}

export interface KeyBinding extends KeyBinding.Attrs {}

export class KeyBinding extends Model {
  declare properties: KeyBinding.Props

  constructor(attrs?: Partial<KeyBinding.Attrs>) {
    super(attrs)
  }

  static {
    this.define<KeyBinding.Props>(({Str, Or, Ref, Nullable, Int, Func, Dict, Unknown}) => ({
      description: [ Nullable(Str), null ],
      keys: [ Or(KeyCombination, KeySequence) ],
      command: [ Nullable(Str), null ],
      args: [ Dict(Unknown), {} ],
      when: [ Nullable(Or(Ref(CustomJS), Func<[], boolean>())), null ],
      action: [ Nullable(Or(Ref(Callback), Func<[], void | Promise<void>>())), null ],
      priority: [ Int, 0 ],
    }))
  }

  /**
   * Prepares callbacks that are executed synchronously, i.e. `when`.
   * This must be called before the binding is used.
   */
  async compile(): Promise<void> {
    const {when} = this
    if (when instanceof CustomJS) {
      await when.compile()
    }
  }

  to_internal(origin: Document | Model): InternalKeyBinding {
    const {description, keys, command, args, when, action, priority} = this
    return {
      description,
      keys: isArray(keys) ? keys : [keys],
      command,
      args,
      when,
      action,
      priority,
      origin,
    }
  }
}
