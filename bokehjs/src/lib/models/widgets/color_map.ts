import type {Keys} from "core/dom"
import {div, canvas} from "core/dom"
import type {StyleSheetLike} from "core/dom"
import {DropPane} from "core/util/panes"
import type * as p from "core/properties"
import {enumerate} from "core/util/iterator"
import {color2css} from "core/util/color"
import {cycle} from "core/util/math"

import {InputWidget, InputWidgetView} from "./input_widget"
import * as inputs from "styles/widgets/inputs.css"
import color_map_css, * as color_map from "styles/widgets/color_map.css"
import item_css, * as color_map_item from "styles/widgets/color_map_item.css"
import pane_css from "styles/widgets/color_map_pane.css"
import icons_css, * as icons from "styles/icons.css"

import {Tuple, String, Arrayable, Color} from "../../core/kinds"

const Item = Tuple(String, Arrayable(Color))
type Item = typeof Item["__type__"]

export class ColorMapView extends InputWidgetView {
  declare model: ColorMap

  declare input_el: HTMLSelectElement

  protected _pane: DropPane

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), icons_css, color_map_css, item_css]
  }

  override connect_signals(): void {
    super.connect_signals()
    const {value, items, swatch_width, swatch_height} = this.model.properties
    this.on_change([value, items, swatch_width, swatch_height], () => this.render())
  }

  protected _render_item(item: Item) {
    const [name, colors] = item
    const {swatch_width, swatch_height} = this.model

    const img = canvas({width: `${swatch_width}`, height: `${swatch_height}`})
    const ctx = img.getContext("2d")!

    const n = colors.length
    const dx = 100.0/n

    for (const [color, i] of enumerate(colors)) {
      ctx.beginPath()
      ctx.rect(i*dx, 0, dx, 20)
      ctx.fillStyle = color2css(color)
      ctx.fill()
    }

    const entry = div({class: color_map_item.entry}, img, name)
    return entry
  }

  override render(): void {
    super.render()

    const content = (() => {
      const {value, items} = this.model
      const entry = items.find(([name]) => name == value)
      if (entry != null) {
        return this._render_item(entry)
      } else {
        return null
      }
    })()

    const value = div({class: [color_map.value, color_map_item.entry]}, content)
    const chevron = div({class: [color_map.chevron, icons.tool_icon_chevron_down]})

    const input_el = div({class: [inputs.input, color_map.value_input]}, value, chevron)

    if (this.model.disabled) {
      input_el.classList.add(inputs.disabled)
    } else {
      input_el.tabIndex = 0
    }

    this.input_el = input_el as any // XXX
    this.group_el.appendChild(input_el)

    const item_els: HTMLElement[] = []

    const {ncols} = this.model
    for (const [item, i] of enumerate(this.model.items)) {
      const entry_el = this._render_item(item)
      const item_el = div({class: color_map_item.item, tabIndex: 0}, entry_el)

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
        switch (event.key as Keys) {
          case "ArrowUp": {
            move_focus(-ncols)
            break
          }
          case "ArrowDown": {
            move_focus(+ncols)
            break
          }
          case "ArrowLeft": {
            move_focus(-1)
            break
          }
          case "ArrowRight": {
            move_focus(+1)
            break
          }
          default:
        }
      })

      item_els.push(item_el)
    }

    this._pane = new DropPane(item_els, {
      target: this.group_el,
      prevent_hide: this.input_el,
      extra_stylesheets: [item_css, pane_css],
    })

    this._pane.el.style.setProperty("--number-of-columns", `${ncols}`)

    input_el.addEventListener("pointerup", () => {
      this.toggle()
    })

    input_el.addEventListener("keyup", (event) => {
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
    input_el.addEventListener("keydown", (event) => {
      switch (event.key as Keys) {
        case "ArrowUp": {
          const {items, value} = this.model
          const i = items.findIndex(([name]) => value == name)
          if (i != -1) {
            const j = cycle(i - 1, 0, items.length - 1)
            this.select(items[j])
          }
          break
        }
        case "ArrowDown": {
          const {items, value} = this.model
          const i = items.findIndex(([name]) => value == name)
          if (i != -1) {
            const j = cycle(i + 1, 0, items.length - 1)
            this.select(items[j])
          }
          break
        }
        default:
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

export namespace ColorMap {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    value: p.Property<string>
    items: p.Property<Item[]>
    swatch_width: p.Property<number>
    swatch_height: p.Property<number>
    ncols: p.Property<number>
  }
}

export interface ColorMap extends ColorMap.Attrs {}

export class ColorMap extends InputWidget {
  declare properties: ColorMap.Props
  declare __view_type__: ColorMapView

  constructor(attrs?: Partial<ColorMap.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ColorMapView

    this.define<ColorMap.Props>(({Int, String, Array, NonNegative, Positive}) => {
      return {
        value: [ String ],
        items: [ Array(Item) ],
        swatch_width: [ NonNegative(Int), 100 ],
        swatch_height: [ NonNegative(Int), 20 ],
        ncols: [ Positive(Int), 1 ],
      }
    })
  }
}
