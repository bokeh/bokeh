import type {StyleSheetLike, Keys} from "core/dom"
import {px} from "core/dom"
import type {VNode} from "core/vdom"
import {UIComponent, cls} from "core/vdom"
import {DropPane} from "core/util/panes"
import type * as p from "core/properties"
import {bind} from "core/class"
import {enumerate} from "core/util/iterator"
import {color2css} from "core/util/color"
import {cycle} from "core/util/math"
import {linspace} from "core/util/array"

import {InputWidget, InputWidgetView} from "./input_widget"
import * as inputs_css from "styles/widgets/inputs.css"
import * as palette_select_css from "styles/widgets/palette_select.css"
import * as item_css from "styles/widgets/palette_select_item.css"
import * as pane_css from "styles/widgets/palette_select_pane.css"
import * as icons_css from "styles/icons.css"
import * as panes_css from "styles/panes.css"

import {Tuple, Str, Arrayable, Color} from "core/kinds"

import type {TargetedKeyboardEvent} from "preact"
import {signal} from "@preact/signals"

const Item = Tuple(Str, Arrayable(Color))
type Item = typeof Item["__type__"]

function gradient_of(colors: Item[1]): string {
  const n = colors.length
  const stops = linspace(0, 100, n + 1)
  const color_map: string[] = []
  for (const [color, i] of enumerate(colors)) {
    const [from, to] = [stops[i], stops[i + 1]]
    color_map.push(`${color2css(color)} ${from}% ${to}%`)
  }
  return `linear-gradient(to right, ${color_map.join(", ")})`
}

export class PaletteSelectView extends InputWidgetView {
  declare readonly model: PaletteSelect
  declare readonly signals: p.SignalsOf<PaletteSelect.Props>
  declare readonly values: PaletteSelect.Attrs

  declare input_el: HTMLSelectElement

  /// TODO remove
  protected override _render_input(): HTMLElement {
    return undefined as any
  }
  ///

  protected readonly _open = signal<boolean>(false)

  protected _item_els: (HTMLElement | null)[] = []

  get is_open(): boolean {
    return this._open.peek()
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), palette_select_css.default, item_css.default, panes_css.default, pane_css.default, icons_css.default]
  }

  @bind
  protected _input_ref(el: HTMLDivElement | null): void {
    if (el != null) {
      this.input_el = el as any // XXX Div is not an Input-like element
    }
  }

  protected _render_item(item: Item): VNode {
    const [name, colors] = item
    const {swatch_width, swatch_height} = this.values
    const style = {
      width: px(swatch_width),
      height: swatch_height == "auto" ? "auto" : px(swatch_height),
      background: gradient_of(colors),
    }
    return (
      <div class={item_css.entry}>
        <div class={item_css.swatch} style={style}/>
        <div>{name}</div>
      </div>
    )
  }

  protected _render_value(): VNode | null {
    const {value, items} = this.values
    const entry = items.find(([name]) => name == value)
    return entry != null ? this._render_item(entry) : null
  }

  protected _pane(): VNode {
    const {items, ncols} = this.values
    this._item_els = items.map(() => null)

    return (
      <DropPane
        open={this._open.value}
        on_dismiss={this.hide}
        ignore={this.input_el}
        class={cls(panes_css.drop_pane, pane_css.pane)}
        style={{"--number-of-columns": `${ncols}`}}
      >
        {items.map((item, i) => (
          <div
            class={item_css.item}
            tabIndex={0}
            ref={(el) => { this._item_els[i] = el }}
            onPointerUp={() => this.select(item)}
            onKeyUp={(event) => this._item_key_up(event, item)}
            onKeyDown={(event) => this._item_key_down(event, i)}
          >
            {this._render_item(item)}
          </div>
        ))}
      </DropPane>
    )
  }

  override component(): VNode {
    const disabled = this.signals.disabled.value
    const Title = this._title_el
    return (
      <UIComponent parent={this.resolved_props}>
        <Title></Title>
        <div class={inputs_css.outer}>
          <div class={inputs_css.inner}>
            <div
              ref={this._input_ref}
              id={this.input_id}
              class={cls(inputs_css.input, palette_select_css.value_input, disabled ? inputs_css.disabled : null)}
              tabIndex={disabled ? undefined : 0}
              onPointerUp={this._input_pointer_up}
              onKeyUp={this._input_key_up}
              onKeyDown={this._input_key_down}
            >
              <div class={cls(palette_select_css.value, item_css.entry)}>{this._render_value()}</div>
              <div class={palette_select_css.chevron}/>
            </div>
          </div>
        </div>
        {this._pane()}
      </UIComponent>
    )
  }

  @bind
  protected _input_pointer_up(): void {
    this.toggle()
  }

  @bind
  protected _input_key_up(event: TargetedKeyboardEvent<HTMLDivElement>): void {
    switch (event.key as Keys) {
      case "Enter": {
        this.toggle()
        break
      }
      case "Escape": {
        this.hide()
        break
      }
      default:
    }
  }

  @bind
  protected _input_key_down(event: TargetedKeyboardEvent<HTMLDivElement>): void {
    const offset = (() => {
      switch (event.key as Keys) {
        case "ArrowUp":   return -1
        case "ArrowDown": return +1
        default:          return null
      }
    })()
    if (offset != null) {
      event.preventDefault()
      const {items, value} = this.model
      const i = items.findIndex(([name]) => value == name)
      if (i != -1) {
        const j = cycle(i + offset, 0, items.length - 1)
        this.select(items[j])
      }
    }
  }

  protected _item_key_up(event: TargetedKeyboardEvent<HTMLDivElement>, item: Item): void {
    switch (event.key as Keys) {
      case "Enter": {
        this.select(item)
        break
      }
      case "Escape": {
        this.hide()
        break
      }
      default:
    }
  }

  protected _item_key_down(event: TargetedKeyboardEvent<HTMLDivElement>, i: number): void {
    const {ncols} = this.model
    const offset = (() => {
      switch (event.key as Keys) {
        case "ArrowUp":    return -ncols
        case "ArrowDown":  return +ncols
        case "ArrowLeft":  return -1
        case "ArrowRight": return +1
        default:           return null
      }
    })()
    if (offset != null) {
      event.preventDefault()
      const j = cycle(i + offset, 0, this.model.items.length - 1)
      this._item_els[j]?.focus()
    }
  }

  select(item: Item): void {
    this.hide()
    const [name] = item
    this.model.value = name
    super.change_input()
    this.input_el.focus()
  }

  toggle(): void {
    if (!this.model.disabled) {
      this._open.value = !this._open.peek()
    }
  }

  @bind
  hide(): void {
    this._open.value = false
  }
}

export namespace PaletteSelect {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    value: p.Property<string>
    items: p.Property<Item[]>
    ncols: p.Property<number>
    swatch_width: p.Property<number>
    swatch_height: p.Property<number | "auto">
  }
}

export interface PaletteSelect extends PaletteSelect.Attrs {}

export class PaletteSelect extends InputWidget {
  declare properties: PaletteSelect.Props
  declare __view_type__: PaletteSelectView

  static {
    this.prototype.default_view = PaletteSelectView

    this.define<PaletteSelect.Props>(({Int, Str, List, NonNegative, Positive, Or, Auto}) => ({
      value: [ Str ],
      items: [ List(Item) ],
      ncols: [ Positive(Int), 1 ],
      swatch_width: [ NonNegative(Int), 100 ],
      swatch_height: [ Or(Auto, NonNegative(Int)), "auto" ],
    }))
  }
}
