import type {Keys} from "core/dom"
import {div, canvas, empty, px} from "core/dom"
import type {StyleSheetLike} from "core/dom"
import {DropPane} from "core/util/panes"
import type * as p from "core/properties"
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

import {Tuple, Str, Arrayable, Color} from "core/kinds"

const Item = Tuple(Str, Arrayable(Color))
type Item = typeof Item["__type__"]

export class PaletteSelectView extends InputWidgetView {
  declare model: PaletteSelect

  declare input_el: HTMLSelectElement

  protected _value_el: HTMLElement
  protected _pane: DropPane

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), palette_select_css.default, item_css.default, icons_css.default]
  }

  override connect_signals(): void {
    super.connect_signals()
    const {value, items, ncols, swatch_width, swatch_height} = this.model.properties
    this.on_change([items, swatch_width, swatch_height], () => this.render())
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

  protected _render_image(item: Item): HTMLCanvasElement {
    const [_name, colors] = item
    const {swatch_width, swatch_height} = this.model

    const width = swatch_width
    const height = swatch_height == "auto" ? swatch_width : swatch_height

    const img = canvas({width, height})
    const ctx = img.getContext("2d")!

    const n = colors.length
    const dx = 100.0/n

    for (const [color, i] of enumerate(colors)) {
      ctx.beginPath()
      ctx.rect(i*dx, 0, dx, 20)
      const css_color = color2css(color)
      ctx.strokeStyle = css_color
      ctx.fillStyle = css_color
      ctx.fill()
      ctx.stroke()
    }

    return img
  }

  protected _render_item(item: Item): HTMLElement {
    const [name, colors] = item
    const {swatch_width, swatch_height} = this.model

    const n = colors.length
    const stops = linspace(0, 100, n + 1)
    const color_map: string[] = []

    for (const [color, i] of enumerate(colors)) {
      const [from, to] = [stops[i], stops[i + 1]]
      color_map.push(`${color2css(color)} ${from}% ${to}%`)
    }

    const img = div()
    img.style.background = `linear-gradient(to right, ${color_map.join(", ")})`
    img.style.width = px(swatch_width)
    if (swatch_height == "auto") {
      img.style.alignSelf = "stretch"
    } else {
      img.style.height = px(swatch_height)
    }

    const entry = div({class: item_css.entry}, img, name)
    return entry
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
      extra_stylesheets: [item_css.default, pane_css.default],
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
    swatch_width: p.Property<number>
    swatch_height: p.Property<number | "auto">
    ncols: p.Property<number>
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

    this.define<PaletteSelect.Props>(({Int, Str, List, NonNegative, Positive, Or, Auto}) => {
      return {
        value: [ Str ],
        items: [ List(Item) ],
        swatch_width: [ NonNegative(Int), 100 ],
        swatch_height: [ Or(Auto, NonNegative(Int)), "auto" ],
        ncols: [ Positive(Int), 1 ],
      }
    })
  }
}
