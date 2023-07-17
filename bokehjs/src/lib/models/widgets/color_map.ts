import {div, canvas} from "core/dom"
import type {Arrayable, Color} from "core/types"
import type {StyleSheetLike} from "core/dom"
import type {MenuItem} from "core/util/menus"
import {ContextMenu} from "core/util/menus"
import type * as p from "core/properties"
import {enumerate} from "core/util/iterator"
import {color2css} from "core/util/color"

import {InputWidget, InputWidgetView} from "./input_widget"
import * as inputs from "styles/widgets/inputs.css"
import icons_css, * as icons from "styles/icons.css"

const colormap_css = `
.bk-value-input {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 1em;
  cursor: pointer;
}
.bk-value {
  flex-grow: 1;
}
.bk-chevron {
  width: 16px;
  height: 16px;

  mask-size: 100% 100%;
  mask-position: center center;
  mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
  -webkit-mask-position: center center;
  -webkit-mask-repeat: no-repeat;
}
`

const entry_css = `
:host {
  padding: 5px;
}
.bk-entry {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.5em;
}
`

export class ColorMapView extends InputWidgetView {
  declare model: ColorMap

  declare input_el: HTMLSelectElement

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), icons_css, colormap_css, entry_css]
  }

  override connect_signals(): void {
    super.connect_signals()
    const {value, items, swatch_width, swatch_height} = this.model.properties
    this.on_change([value, items, swatch_width, swatch_height], () => this.render())
  }

  protected _render_entry(name: string, colors: Arrayable<Color>) {
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

    const entry = div({class: "bk-entry"}, img, name)
    return entry
  }

  override render(): void {
    super.render()

    const content = (() => {
      const {value, items} = this.model
      const entry = items.find(([name]) => name == value)
      if (entry != null) {
        const [name, colors] = entry
        return this._render_entry(name, colors)
      } else {
        return null
      }
    })()

    const value = div({class: ["bk-value", "bk-entry"]}, content)
    const chevron = div({class: ["bk-chevron", icons.tool_icon_chevron_down]})

    const input_el = div({class: [inputs.input, "bk-value-input"]}, value, chevron)
    this.group_el.appendChild(input_el)

    if (this.model.disabled) {
      input_el.classList.add(inputs.disabled)
    }

    const items: MenuItem[] = []

    for (const [name, colors] of this.model.items) {
      const entry = this._render_entry(name, colors)
      items.push({content: entry})
    }

    const menu = new ContextMenu(items, {
      target: this.root.el,
      orientation: "vertical",
      extra_styles: [entry_css],
      prevent_hide: (event) => {
        return event.composedPath().includes(input_el)
      },
      entry_handler: (_entry, i) => {
        const [name] = this.model.items[i]
        this.model.value = name
        super.change_input()
      },
    })

    input_el.addEventListener("pointerup", (e) => {
      if (e.composedPath().includes(input_el)) {
        menu.toggle({below: input_el})
      }
    })
  }
}

export namespace ColorMap {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    value: p.Property<string>
    items: p.Property<[string, Arrayable<Color>][]>
    swatch_width: p.Property<number>
    swatch_height: p.Property<number>
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

    this.define<ColorMap.Props>(({Int, String, Arrayable, Color, Tuple, Array}) => {
      const Item = Tuple(String, Arrayable(Color))
      return {
        value: [ String ],
        items: [ Array(Item) ],
        swatch_width: [ Int, 100 ],
        swatch_height: [ Int, 20 ],
      }
    })
  }
}
