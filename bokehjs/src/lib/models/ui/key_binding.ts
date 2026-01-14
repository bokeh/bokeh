import {Model} from "../../model"
import type {Document} from "document"
import {CustomJS} from "../callbacks/customjs"
import type {ExecutableLike, SyncExecutableLike} from "core/util/callbacks"
import {KeyCombination, KeySequence} from "core/keyboard"
import type {InternalKeyBinding} from "core/keyboard"
import {isArray} from "core/util/types"
import type * as p from "core/properties"

export namespace KeyBinding {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    description: p.Property<string>
    keys: p.Property<KeyCombination | KeySequence>
    command: p.Property<string | null>
    when: p.Property<SyncExecutableLike<Model, [], boolean> | null>
    action: p.Property<ExecutableLike<Model, [], void>>
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
    this.define<KeyBinding.Props>(({Str, Or, Ref, Nullable, Int, Func}) => ({
      description: [ Str ],
      keys: [ Or(KeyCombination, KeySequence) ],
      command: [ Nullable(Str), null ],
      when: [ Nullable(Or(Ref(CustomJS), Func<[], boolean>())), null ],
      action: [ Or(Ref(CustomJS), Func<[], void | Promise<void>>()) ],
      priority: [ Int, 0 ],
    }))
  }

  to_internal(origin: Document | Model): InternalKeyBinding {
    const {description, keys, command, when, action, priority} = this
    return {
      description,
      keys: isArray(keys) ? keys : [keys],
      command,
      when,
      action,
      priority,
      origin,
    }
  }
}
