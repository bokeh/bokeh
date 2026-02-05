import {Indicator, IndicatorView} from "./indicator"
import {Signal0} from "core/signaling"
import type {StyleSheetLike} from "core/stylesheets"
import type * as p from "core/properties"
import {Orientation} from "core/enums"
import {Enum} from "../../core/kinds"
import {clamp} from "core/util/math"
import {process_placeholders, sprintf} from "core/util/templating"
import type {PlaceholderReplacer} from "core/util/templating"
import * as progress_css from "styles/widgets/progress.css"

import type {VNode} from "core/vdom"
import {ShadowComponent, cls} from "core/vdom"

const ProgressMode = Enum("determinate", "indeterminate")
type ProgressMode = typeof ProgressMode["__type__"]

const LabelLocation = Enum("none", "inline")
type LabelLocation = typeof LabelLocation["__type__"]

export class ProgressView extends IndicatorView {
  declare readonly model: Progress
  declare readonly signals: p.SignalsOf<Progress.Props>

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), progress_css.default]
  }

  override component(): VNode {
    const classes = [...this._css_classes()]
    const stylesheets = this.resolved_stylesheets

    const {mode, label, reversed, orientation, disabled, label_location, description} = this.signals

    const min = this.signals.min.value
    const max = this.signals.max.value
    const value = this.signals.value.value

    const total = Math.abs(max - min)
    const index = clamp(value, min, max) - min
    const percent = index/total*100
    const indeterminate = mode.value == "indeterminate" || !isFinite(percent)

    const disabled_cls = disabled.value ? progress_css.disabled : null
    const reversed_cls = reversed.value ? progress_css.reversed : null
    const horizontal_cls = orientation.value == "horizontal" ? progress_css.horizontal : null
    const vertical_cls = orientation.value == "vertical" ? progress_css.vertical : null
    const indeterminate_cls = indeterminate ? progress_css.indeterminate : null

    const has_label = label.value != null && label_location.value != "none" && !indeterminate

    const progress = `${indeterminate ? 0 : percent}%`
    const replacements: {[key: string]: number} = {min, max, total, value, index, percent}

    const replacer: PlaceholderReplacer = (_, name, format) => {
      if (name in replacements) {
        const val = replacements[name]
        return format != null ? sprintf(format, val) : val.toFixed(0)
      } else {
        return null
      }
    }

    const label_text = (() => {
      if (label.value != null && !indeterminate) {
        return process_placeholders(label.value, replacer)
      } else {
        return "0%"
      }
    })()

    const bar_title = (() => {
      if (description.value != null && !indeterminate) {
        return process_placeholders(description.value, replacer)
      } else {
        return ""
      }
    })()

    const all_classes = cls(classes, disabled_cls, reversed_cls, horizontal_cls, vertical_cls, indeterminate_cls)
    return (
      <ShadowComponent stylesheets={stylesheets} class={all_classes} role="progressbar">
        <div class={progress_css.bar} title={bar_title}>
          <div class={progress_css.value} style={{"--progress": progress}}></div>
          {has_label ? <div class={progress_css.label}>{label_text}</div> : null}
        </div>
      </ShadowComponent>
    )
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
