import {Model} from "../../model"
import {CustomJS} from "../callbacks/customjs"
import type {ExecutableLike, SyncExecutableLike} from "core/util/callbacks"
import {KeyCombination, KeySequence} from "core/keyboard"
import type * as p from "core/properties"

export namespace KeyBinding {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    key: p.Property<KeyCombination | KeySequence>
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
    this.define<KeyBinding.Props>(({Or, Ref, Nullable, Int, Func}) => ({
      key: [ Or(KeyCombination, KeySequence) ],
      when: [ Nullable(Or(Ref(CustomJS), Func<[], boolean>())), null ],
      action: [ Or(Ref(CustomJS), Func<[], void | Promise<void>>()) ],
      priority: [ Int, 0 ],
    }))
  }
}
