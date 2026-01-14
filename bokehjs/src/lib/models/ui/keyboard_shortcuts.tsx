import {UIElement, UIElementView} from "./ui_element"
import type {StyleSheetLike} from "core/dom"
import type * as p from "core/properties"
import type {InternalKeyBinding} from "core/keyboard"
import {parse, is_upper_like} from "core/keyboard"

import * as key_css from "styles/keyboard_shortcuts.css"
import * as icons_css from "styles/icons.css"

import {render, Component} from "preact"
import type {VNode} from "preact"
//import {signal, computed} from "@preact/signals"

type KeyboardShortcutsProps = {
  bindings: InternalKeyBinding[]
  editable: boolean
}
class KeyboardShortcutsPanel extends Component<KeyboardShortcutsProps> {
  constructor(props: KeyboardShortcutsProps) {
    super(props)
  }

  override render(): VNode<HTMLElement> {
    const {bindings} = this.props

    const elements = bindings.map(({description, keys, command, origin}) => {
      const seq = keys.map((key_combination) => {
        const {key, modifiers} = parse(key_combination)

        const has_ctrl = modifiers.ctrl
        const has_shift = modifiers.shift && !is_upper_like(key)
        const has_alt = modifiers.alt

        const Key = (key: string) => <span class={key_css.key}>{key}</span>
        const Mod = (key: string) => <>{Key(key)}<span>+</span></>

        return (
          <div class={key_css.key_combination}>
            {has_ctrl  ? Mod("Ctrl")  : null}
            {has_shift ? Mod("Shift") : null}
            {has_alt   ? Mod("Alt")   : null}
            {Key(key)}
          </div>
        )
      })

      return (
        <tr class={key_css.key_binding}>
          <td class={key_css.description}>{description}</td>
          <td class={key_css.key_sequence}>{seq}</td>
          <td class={key_css.command}>{command != null ? `:${command}` : ""}</td>
          <td class={key_css.origin}>{origin.toString()}</td>
        </tr>
      )
    })

    return (
      <table class={key_css.key_bindings}>
        <tr class={key_css.key_binding}>
          <th>Description</th>
          <th>Key binding</th>
          <th>Command</th>
          <th>Origin</th>
        </tr>
        {elements}
      </table>
    )
  }
}

export class KeyboardShortcutsView extends UIElementView {
  declare model: KeyboardShortcuts

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), key_css.default, icons_css.default]
  }

  override render(): void {
    super.render()

    const {source} = this.model
    const {document} = source
    const source_view = this.owner.find_one(source)

    const bindings = [
      ...document?.computed_key_bindings ?? [],
      ...source_view?.computed_key_bindings ?? [],
    ]

    const panel = <KeyboardShortcutsPanel bindings={bindings} editable={this.model.editable}></KeyboardShortcutsPanel>
    render(panel, this.shadow_el)
  }
}

export namespace KeyboardShortcuts {
  export type Attrs = p.AttrsOf<Props>
  export type Props = UIElement.Props & {
    source: p.Property<UIElement>
    editable: p.Property<boolean>
  }
}

export interface KeyboardShortcuts extends KeyboardShortcuts.Attrs {}

export class KeyboardShortcuts extends UIElement {
  declare properties: KeyboardShortcuts.Props
  declare __view_type__: KeyboardShortcutsView

  constructor(attrs?: Partial<KeyboardShortcuts.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = KeyboardShortcutsView

    this.define<KeyboardShortcuts.Props>(({Bool, Ref}) => ({
      source: [ Ref(UIElement) ],
      editable: [ Bool, false ],
    }))
  }
}
