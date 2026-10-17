import {BasicTickFormatter} from "./basic_tick_formatter"
import {TickFormatter} from "./tick_formatter"
import type {GraphicsBox} from "core/graphics"
import {InlineBox, TextBox} from "core/graphics"
import {engineering_si_prefixes} from "core/util/si"
import type {EngineeringSIPrefix, SIPrefixInfo} from "core/util/si"
import {tex_escape, tex_text} from "core/util/tex"
import {isString} from "core/util/types"
import {BaseText} from "../text/base_text"
import {TeX} from "../text/math_text"
import {parse_delimited_string} from "../text/utils"
import type * as p from "core/properties"

const {abs, max} = Math

const si_prefix_symbols = engineering_si_prefixes.map(({symbol}) => symbol)
const no_prefix = engineering_si_prefixes.find(({symbol}) => symbol == "")!
const prefix_tolerance = 8*Number.EPSILON
const math_label_cache_size = 128

type FixedSIPrefix = Exclude<EngineeringSIPrefix, "">
type TextLike = string | BaseText

export namespace SITickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
    formatter: p.Property<TickFormatter>
    input_scale: p.Property<number>
    unit: p.Property<TextLike>
    prefix: p.Property<FixedSIPrefix | "auto" | null>
    unit_style: p.Property<"always" | "except_zero">
  }
}

export interface SITickFormatter extends SITickFormatter.Attrs {}

export class SITickFormatter extends TickFormatter {
  declare properties: SITickFormatter.Props

  protected _unit_source: TextLike | undefined
  protected _unit_text: BaseText | undefined
  protected _math_labels = new WeakMap<TickFormatter.Context, Map<string, TeX>>()

  override get transform_kind(): "si" {
    return "si"
  }

  static {
    const fixed_prefixes = si_prefix_symbols.filter((symbol): symbol is FixedSIPrefix => symbol != "")
    this.define<SITickFormatter.Props>(({Float, Positive, Str, Ref, Or, Auto, Enum, Nullable}) => ({
      formatter:   [ Ref(TickFormatter), () => BasicTickFormatter.create() ],
      input_scale: [ Positive(Float), 1.0 ],
      unit:        [ Or(Str, Ref(BaseText)), "" ],
      prefix:      [ Nullable(Or(Auto, Enum(...fixed_prefixes))), "auto" ],
      unit_style:  [ Enum("always", "except_zero"), "always" ],
    }))
  }

  override connect_signals(): void {
    super.connect_signals()

    const invalidate_math_labels = () => {
      this._math_labels = new WeakMap()
    }
    this.connect(this.change, invalidate_math_labels)

    const emit_changed = () => {
      invalidate_math_labels()
      this.change.emit()
    }

    let formatter = this.formatter
    this.connect(formatter.change, emit_changed)
    this.on_change(this.properties.formatter, () => {
      this.disconnect(formatter.change, emit_changed)
      formatter = this.formatter
      this.connect(formatter.change, emit_changed)
    })

    let unit = this.unit
    if (!isString(unit)) {
      this.connect(unit.change, emit_changed)
    }
    this.on_change(this.properties.unit, () => {
      if (!isString(unit)) {
        this.disconnect(unit.change, emit_changed)
      }
      unit = this.unit
      if (!isString(unit)) {
        this.connect(unit.change, emit_changed)
      }
    })
  }

  protected text_value(text: TextLike): string {
    return isString(text) ? text : text.text
  }

  protected unit_model(): BaseText {
    const {unit} = this
    if (this._unit_text == null || this._unit_source !== unit) {
      this._unit_text = isString(unit) ? parse_delimited_string(unit) : unit
      this._unit_source = unit
    }
    return this._unit_text
  }

  protected has_rich_unit(): boolean {
    return !isString(this.unit) || this.unit_model().text != this.unit
  }

  override get_text_models(opts?: TickFormatter.Context): BaseText[] {
    if (!this.formatter_is_compatible(this.formatter)) {
      return this.formatter.get_text_models(opts)
    }
    const models = [...this.formatter.get_text_models(opts)]
    if (this.text_value(this.unit) != "") {
      const unit = this.unit_model()
      if (this.has_rich_unit()) {
        models.push(unit)
      }
    }
    if (opts != null) {
      models.push(...this.math_labels(opts).values())
    }
    return models
  }

  protected math_labels(opts: TickFormatter.Context): Map<string, TeX> {
    let labels = this._math_labels.get(opts)
    if (labels == null) {
      labels = new Map()
      this._math_labels.set(opts, labels)
    }
    return labels
  }

  protected math_label(text: string, unit: TeX, opts: TickFormatter.Context): TeX {
    const labels = this.math_labels(opts)
    const key = JSON.stringify([text, unit.inline, unit.macros])
    const existing = labels.get(key)
    if (existing != null) {
      labels.delete(key)
      labels.set(key, existing)
      return existing
    }

    const model = TeX.create({text, inline: unit.inline, macros: unit.macros})
    labels.set(key, model)
    while (labels.size > math_label_cache_size) {
      const oldest = labels.keys().next()
      if (oldest.done == true) {
        break
      }
      labels.delete(oldest.value)
    }
    return model
  }

  protected prefix_info(ticks: number[]): SIPrefixInfo & {symbol: EngineeringSIPrefix} {
    if (this.prefix == null) {
      return no_prefix
    } else if (this.prefix != "auto") {
      return engineering_si_prefixes.find(({symbol}) => symbol == this.prefix)!
    }

    const magnitude = ticks.reduce((result, tick) => Number.isFinite(tick) ? max(result, abs(tick)) : result, 0)
    return magnitude == 0 ? no_prefix :
      engineering_si_prefixes.find(({factor}) => magnitude >= factor*(1 - prefix_tolerance)) ??
        engineering_si_prefixes[engineering_si_prefixes.length - 1]
  }

  protected scaled(ticks: number[]): {ticks: number[], prefix: SIPrefixInfo & {symbol: EngineeringSIPrefix}} {
    const base_ticks = ticks.map((tick) => tick*this.input_scale)
    const prefix = this.prefix_info(base_ticks)
    return {ticks: base_ticks.map((tick) => tick/prefix.factor), prefix}
  }

  protected tex_prefix(prefix: SIPrefixInfo): string {
    if (prefix.tex_symbol == "") {
      return ""
    } else if (prefix.symbol == "µ") {
      return "\\text{µ}"
    } else if (prefix.tex_symbol.startsWith("\\")) {
      return prefix.tex_symbol
    } else {
      return `\\mathrm{${tex_escape(prefix.tex_symbol)}}`
    }
  }

  protected tex_label(label: string, prefix: SIPrefixInfo, unit: TeX): string {
    return `${tex_text(label)}\\,${this.tex_prefix(prefix)}${unit.text}`
  }

  protected decorate(tick: number): boolean {
    return this.unit_style == "always" || tick != 0
  }

  doFormat(ticks: number[], opts: TickFormatter.Context): string[] {
    if (!this.check_formatter(this.formatter)) {
      return this.formatter.doFormat(ticks, opts)
    }
    const {ticks: scaled, prefix} = this.scaled(ticks)
    const labels = this.formatter.doFormat(scaled, opts)
    const suffix = `${prefix.symbol}${this.text_value(this.unit)}`
    return suffix == "" ? labels : labels.map((label, i) => this.decorate(ticks[i]) ? `${label} ${suffix}` : label)
  }

  override format_graphics(ticks: number[], opts: TickFormatter.Context): GraphicsBox[] {
    if (!this.check_formatter(this.formatter)) {
      return this.formatter.format_graphics(ticks, opts)
    }
    const {ticks: scaled, prefix} = this.scaled(ticks)
    const unit = this.text_value(this.unit)
    const unit_model = this.unit_model()
    const graphics = this.formatter.format_graphics(scaled, opts)

    if (unit != "" && unit_model instanceof TeX) {
      const labels = this.formatter.doFormat(scaled, opts)
      return labels.map((label, i) => {
        if (!this.decorate(ticks[i])) {
          return new TextBox({text: label})
        }
        const text = this.tex_label(label, prefix, unit_model)
        const model = this.math_label(text, unit_model, opts)
        const math_graphic = opts.resolve_text?.(model)
        if (math_graphic != null) {
          return math_graphic
        }
        const unit_graphic = opts.resolve_text?.(unit_model)
        if (unit_graphic != null) {
          return new InlineBox([graphics[i], new TextBox({text: ` ${prefix.symbol}`}), unit_graphic])
        }
        return new InlineBox([graphics[i], new TextBox({text: ` ${prefix.symbol}${unit}`})])
      })
    }

    if (`${prefix.symbol}${unit}` == "") {
      return graphics
    }

    return graphics.map((graphic, i) => {
      if (!this.decorate(ticks[i])) {
        return graphic
      }
      if (unit == "" || !this.has_rich_unit()) {
        return new InlineBox([graphic, new TextBox({text: ` ${prefix.symbol}${unit}`})])
      }
      const unit_graphic = opts.resolve_text?.(unit_model) ?? new TextBox({text: unit})
      return new InlineBox([graphic, new TextBox({text: ` ${prefix.symbol}`}), unit_graphic])
    })
  }
}
