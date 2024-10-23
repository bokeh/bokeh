import {div, empty, px, InlineStyleSheet} from "core/dom"
import type {StyleSheetLike, Keys} from "core/dom"
import {DropPane} from "core/util/panes"
import type * as p from "core/properties"
import {enumerate} from "core/util/iterator"
import {color2css} from "core/util/color"
import {cycle} from "core/util/math"
import {linspace} from "core/util/array"
import {assert} from "core/util/assert"

import {InputWidget, InputWidgetView} from "./input_widget"
import * as inputs_css from "styles/widgets/inputs.css"
import * as palette_select_css from "styles/widgets/palette_select.css"
import * as item_css from "styles/widgets/palette_select_item.css"
import * as pane_css from "styles/widgets/palette_select_pane.css"
import * as icons_css from "styles/icons.css"

import {Tuple, Str, Arrayable, Color} from "core/kinds"

const Item = Tuple(Str, Arrayable(Color))
type Item = typeof Item["__type__"]

export class PaletteSelectView extends InputWidgetView {
  declare model: PaletteSelect

  declare input_el: HTMLSelectElement

  protected _value_el: HTMLElement
  protected _pane: DropPane

  protected readonly _style = new InlineStyleSheet()
  protected readonly _style_menu = new InlineStyleSheet()

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), palette_select_css.default, item_css.default, icons_css.default, this._style]
  }

  override connect_signals(): void {
    super.connect_signals()
    const {value, items, ncols, swatch_width, swatch_height} = this.model.properties
    this.on_change([items, swatch_width, swatch_height], () => this.rerender())
    this.on_change(value, () => this._update_value())
    this.on_change(ncols, () => this._update_ncols())
  }

  protected _update_value(): void {
    empty(this._value_el)
    const content = this._render_value()
    if (content != null) {
      this._value_el.append(content)
    }
  }

  protected _update_ncols(): void {
    const {ncols} = this.model
    this._pane.el.style.setProperty("--number-of-columns", `${ncols}`)
  }

  protected _render_item(item: Item): HTMLElement {
    const [name] = item
    const i = this.model.items.indexOf(item)
    assert(i != -1)
    const swatch = div({class: item_css.swatch, id: `item_${i}`})
    return div({class: item_css.entry}, swatch, div(name))
  }

  protected _render_value(): HTMLElement | null {
    const {value, items} = this.model
    const entry = items.find(([name]) => name == value)
    if (entry != null) {
      return this._render_item(entry)
    } else {
      return null
    }
  }

  protected _render_input(): HTMLElement {
    this._value_el = div({class: [palette_select_css.value, item_css.entry]}, this._render_value())
    const chevron_el = div({class: [palette_select_css.chevron, icons_css.tool_icon_chevron_down]})

    const input_el = div({class: [inputs_css.input, palette_select_css.value_input]}, this._value_el, chevron_el)

    if (this.model.disabled) {
      input_el.classList.add(inputs_css.disabled)
    } else {
      input_el.tabIndex = 0
    }

    this.input_el = input_el as any // XXX Div is not an Input-like element
    return this.input_el
  }

  override render(): void {
    super.render()

    const {swatch_width, swatch_height} = this.model
    this._style.replace(`
      .${item_css.swatch} {
        width: ${swatch_width}px;
        height: ${swatch_height == "auto" ? "auto" : px(swatch_height)};
      }
    `)

    for (const [item, i] of enumerate(this.model.items)) {
      const [, colors] = item

      const n = colors.length
      const stops = linspace(0, 100, n + 1)
      const color_map: string[] = []

      for (const [color, i] of enumerate(colors)) {
        const [from, to] = [stops[i], stops[i + 1]]
        color_map.push(`${color2css(color)} ${from}% ${to}%`)
      }

      const gradient = color_map.join(", ")
      this._style.append(`
        #item_${i} {
          background: linear-gradient(to right, ${gradient});
        }
      `)
    }

    // The widget and its menu are independent components, so they need
    // to have their own stylesheets.
    this._style_menu.replace(this._style.css)

    const item_els: HTMLElement[] = []
    for (const [item, i] of enumerate(this.model.items)) {
      const entry_el = this._render_item(item)
      const item_el = div({class: item_css.item, tabIndex: 0}, entry_el)

      item_el.addEventListener("pointerup", () => {
        this.select(item)
      })
      item_el.addEventListener("keyup", (event) => {
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
      })
      const move_focus = (offset: number): void => {
        const {items} = this.model
        const j = cycle(i + offset, 0, items.length - 1)
        item_els[j].focus()
      }
      item_el.addEventListener("keydown", (event) => {
        const offset = (() => {
          switch (event.key as Keys) {
            case "ArrowUp":    return -this.model.ncols
            case "ArrowDown":  return +this.model.ncols
            case "ArrowLeft":  return -1
            case "ArrowRight": return +1
            default:           return null
          }
        })()
        if (offset != null) {
          event.preventDefault()
          move_focus(offset)
        }
      })

      item_els.push(item_el)
    }

    this._pane = new DropPane(item_els, {
      target: this.group_el,
      prevent_hide: this.input_el,
      extra_stylesheets: [item_css.default, pane_css.default, this._style_menu],
    })

    this._update_ncols()

    this.input_el.addEventListener("pointerup", () => {
      this.toggle()
    })

    this.input_el.addEventListener("keyup", (event) => {
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
    })
    const move_selection = (offset: number) => {
      const {items, value} = this.model
      const i = items.findIndex(([name]) => value == name)
      if (i != -1) {
        const j = cycle(i + offset, 0, items.length - 1)
        this.select(items[j])
      }
    }
    this.input_el.addEventListener("keydown", (event) => {
      const offset = (() => {
        switch (event.key as Keys) {
          case "ArrowUp":   return -1
          case "ArrowDown": return +1
          default:          return null
        }
      })()
      if (offset != null) {
        event.preventDefault()
        move_selection(offset)
      }
    })
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
      this._pane.toggle()
    }
  }

  hide(): void {
    this._pane.hide()
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

  constructor(attrs?: Partial<PaletteSelect.Attrs>) {
    super(attrs)
  }

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
