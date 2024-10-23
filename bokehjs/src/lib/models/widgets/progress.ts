import {Widget, WidgetView} from "./widget"
import {HTML} from "../dom/html"
import type {StyleSheetLike} from "core/dom"
import {div} from "core/dom"
import type * as p from "core/properties"
import {Align, Location, Orientation} from "core/enums"
import {Enum, Or} from "../../core/kinds"
import {isString} from "core/util/types"
import {clamp} from "core/util/math"
import {process_placeholders} from "core/util/templating"
import * as progress_css from "styles/widgets/progress.css"

const LabelLocation = Or(Enum("none", "inline"), Location)
type LabelLocation = typeof LabelLocation["__type__"]

export class ProgressView extends WidgetView {
  declare model: Progress

  protected label_el: HTMLElement
  protected value_el: HTMLElement
  protected bar_el: HTMLElement

  override connect_signals(): void {
    super.connect_signals()
    const {value, min, max, reversed, orientation} = this.model.properties
    this.on_change([value, min, max], () => this._update_value())
    this.on_change(reversed, () => this._update_reversed())
    this.on_change(orientation, () => this._update_orientation())
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), progress_css.default]
  }

  override render(): void {
    super.render()

    this.label_el = div({class: progress_css.label})
    this.value_el = div({class: progress_css.value})
    this.bar_el = div({class: progress_css.bar}, this.value_el)

    this._update_value()
    this._update_reversed()
    this._update_orientation()

    this.shadow_el.append(this.bar_el)

    const {label_location} = this.model
    switch (label_location) {
      case "inline": {
        this.bar_el.append(this.label_el)
        break
      }
      default:
    }
  }

  protected _update_value(): void {
    const {value, min, max, label, disabled} = this.model

    const indeterminate = value == null
    const progress = (clamp(value ?? 0, min, max) - min)/(max - min)*100

    this.class_list.toggle(progress_css.indeterminate, indeterminate && !disabled)
    this.value_el.style.setProperty("--progress", !indeterminate ? `${progress}%` : "unset")

    if (isString(label)) {
      const text = process_placeholders(label, (_, name) => {
        if (name == "progress") {
          return `${progress}`
        } else {
          return null
        }
      })
      this.label_el.textContent = text
    }
  }

  protected _update_reversed(): void {
    this.class_list.toggle(progress_css.reversed, this.model.reversed)
  }

  protected _update_orientation(): void {
    this.class_list.toggle(progress_css.vertical, this.model.orientation == "vertical")
  }
}

export namespace Progress {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    value: p.Property<number | null>
    min: p.Property<number>
    max: p.Property<number>
    reversed: p.Property<boolean>
    orientation: p.Property<Orientation>
    label: p.Property<HTML | string>
    label_location: p.Property<LabelLocation>
    label_align: p.Property<Align>
  }
}

export interface Progress extends Progress.Attrs {}

export class Progress extends Widget {
  declare properties: Progress.Props
  declare __view_type__: ProgressView

  constructor(attrs?: Partial<Progress.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ProgressView

    this.define<Progress.Props>(({Boolean, Int, String, Ref, Or, Nullable}) => ({
      value: [ Nullable(Int), 0 ],
      min: [ Int, 0 ],
      max: [ Int, 100 ],
      reversed: [ Boolean, false ],
      orientation: [ Orientation, "horizontal" ],
      label: [ Or(Ref(HTML), String), "@{progress}%" ],
      label_location: [ LabelLocation, "none" ],
      label_align: [ Align, "center" ],
    }))
  }

  get finished(): boolean {
    return this.value == this.max
  }

  update(n: number): void {
    const {value} = this
    if (value != null) {
      const {min, max} = this
      this.value = clamp(value + n, min, max)
    }
  }

  increment(n: number = 1): void {
    this.update(n)
  }

  decrement(n: number = 1): void {
    this.update(-n)
  }
}
