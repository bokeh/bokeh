import {Indicator, IndicatorView} from "./indicator"
import {Signal0} from "core/signaling"
import type {StyleSheetLike} from "core/dom"
import {div} from "core/dom"
import type * as p from "core/properties"
import {Orientation} from "core/enums"
import {Enum} from "../../core/kinds"
import {clamp} from "core/util/math"
import {process_placeholders, sprintf} from "core/util/templating"
import type {PlaceholderReplacer} from "core/util/templating"
import * as progress_css from "styles/widgets/progress.css"

const ProgressMode = Enum("determinate", "indeterminate")
type ProgressMode = typeof ProgressMode["__type__"]

const LabelLocation = Enum("none", "inline")
type LabelLocation = typeof LabelLocation["__type__"]

export class ProgressView extends IndicatorView {
  declare model: Progress

  protected label_el: HTMLElement
  protected value_el: HTMLElement
  protected bar_el: HTMLElement

  override connect_signals(): void {
    super.connect_signals()
    const {mode, value, min, max, label, reversed, orientation, disabled, label_location, description} = this.model.properties
    this.on_change([mode, value, min, max, label, description], () => this._update_value())
    this.on_change(reversed, () => this._update_reversed())
    this.on_change(orientation, () => this._update_orientation())
    this.on_change(disabled, () => this._update_disabled())
    this.on_change(label_location, () => this._update_label_location())
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), progress_css.default]
  }

  override render(): void {
    super.render()
    this.el.role = "progress"

    this.label_el = div({class: progress_css.label})
    this.value_el = div({class: progress_css.value})
    this.bar_el = div({class: progress_css.bar}, this.value_el, this.label_el)

    this._update_value()
    this._update_disabled()
    this._update_reversed()
    this._update_orientation()
    this._update_label_location()

    this.shadow_el.append(this.bar_el)
  }

  protected _update_value(): void {
    const {value, min, max, label} = this.model

    const total = Math.abs(max - min)
    const index = clamp(value, min, max) - min
    const percent = index/total*100
    const indeterminate = this.model.indeterminate || !isFinite(percent)

    this.class_list.toggle(progress_css.indeterminate, indeterminate)
    this.value_el.style.setProperty("--progress", `${indeterminate ? 0 : percent}%`)

    const replacer: PlaceholderReplacer = (_, name, format) => {
      const val = (() => {
        switch (name) {
          case "min": return min
          case "max": return max
          case "total": return total
          case "value": return value
          case "index": return index
          case "percent": return percent
          // TODO duration, throughput, ETA
          default: return null
        }
      })()

      if (val == null) {
        return val
      } else {
        return format != null ? sprintf(format, val) : val.toFixed(0)
      }
    }

    this.label_el.textContent = (() => {
      if (label != null && !indeterminate) {
        return process_placeholders(label, replacer)
      } else {
        return "0%"
      }
    })()

    this.bar_el.title = (() => {
      const {description} = this.model
      if (description != null && !indeterminate) {
        return process_placeholders(description, replacer)
      } else {
        return ""
      }
    })()
  }

  protected _update_disabled(): void {
    const {disabled} = this.model
    this.class_list.toggle(progress_css.disabled, disabled)
  }

  protected _update_reversed(): void {
    const {reversed} = this.model
    this.class_list.toggle(progress_css.reversed, reversed)
  }

  protected _update_orientation(): void {
    const {orientation} = this.model
    this.class_list.toggle(progress_css.horizontal, orientation == "horizontal")
    this.class_list.toggle(progress_css.vertical, orientation == "vertical")
  }

  protected _update_label_location(): void {
    const {label, label_location} = this.model
    this.label_el.classList.toggle(progress_css.hidden, label == null || label_location == "none")
  }
}

export namespace Progress {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Indicator.Props & {
    mode: p.Property<ProgressMode>
    value: p.Property<number>
    min: p.Property<number>
    max: p.Property<number>
    reversed: p.Property<boolean>
    orientation: p.Property<Orientation>
    label: p.Property<string | null>
    label_location: p.Property<LabelLocation>
    description: p.Property<string | null>
  }
}

export interface Progress extends Progress.Attrs {}

export class Progress extends Indicator {
  declare properties: Progress.Props
  declare __view_type__: ProgressView

  readonly finished = new Signal0(this, "finished")

  constructor(attrs?: Partial<Progress.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ProgressView

    this.define<Progress.Props>(({Bool, Int, Str, Nullable}) => ({
      mode: [ ProgressMode, "determinate" ],
      value: [ Int, 0 ],
      min: [ Int, 0 ],
      max: [ Int, 100 ],
      reversed: [ Bool, false ],
      orientation: [ Orientation, "horizontal" ],
      label: [ Nullable(Str), "@{percent}%" ],
      label_location: [ LabelLocation, "inline" ],
      description: [ Nullable(Str), null ],
    }))
  }

  get indeterminate(): boolean {
    return this.mode == "indeterminate"
  }

  get has_finished(): boolean {
    return !this.indeterminate && this.value == this.max
  }

  update(n: number): boolean {
    if (this.indeterminate) {
      return false
    }

    const {value, min, max} = this
    this.value = clamp(value + n, min, max)

    const {has_finished} = this
    if (has_finished) {
      this.finished.emit()
    }
    return has_finished
  }

  increment(n: number = 1): boolean {
    return this.update(n)
  }

  decrement(n: number = 1): void {
    this.update(-n)
  }
}
