import {BasicTickFormatter} from "./basic_tick_formatter"
import {TickFormatter} from "./tick_formatter"
import {ScaledTicker} from "../tickers/scaled_ticker"
import type {GraphicsBox} from "core/graphics"
import {InlineBox, TextBox} from "core/graphics"
import {Fraction} from "core/util/math"
import {tex_text} from "core/util/tex"
import {isString} from "core/util/types"
import {BaseText} from "../text/base_text"
import {MathText, TeX} from "../text/math_text"
import {parse_delimited_string} from "../text/utils"
import type {Dict} from "core/types"
import type * as p from "core/properties"

const {abs, max, round} = Math

type LabelInfo = {
  label: string
  fraction: Fraction | null
  is_zero: boolean
  is_negative: boolean
  is_one: boolean
  is_negative_one: boolean
  minus_sign: string
}

type TextLike = string | BaseText
type Decoration = "origin_label" | "prefix" | "unit"

type TeXTemplate = {
  origin_label: string
  prefix: string
  unit: string
  inline: boolean
  macros: Dict<string | [string, number]>
}

const math_label_cache_size = 128

export namespace ScaledTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
    ticker: p.Property<ScaledTicker | null>
    formatter: p.Property<TickFormatter>
    origin_label: p.Property<TextLike>
    prefix: p.Property<TextLike>
    unit: p.Property<TextLike>
    unit_style: p.Property<"always" | "except_zero" | "symbolic">
    use_fractions: p.Property<boolean>
    fraction_style: p.Property<"stacked" | "inline">
    max_denominator: p.Property<number>
  }
}

export interface ScaledTickFormatter extends ScaledTickFormatter.Attrs {}

export class ScaledTickFormatter extends TickFormatter {
  declare properties: ScaledTickFormatter.Props

  protected _origin_label_source: TextLike | undefined
  protected _origin_label_text: BaseText | undefined
  protected _prefix_source: TextLike | undefined
  protected _prefix_text: BaseText | undefined
  protected _unit_source: TextLike | undefined
  protected _unit_text: BaseText | undefined
  protected _math_labels = new WeakMap<TickFormatter.Context, Map<string, TeX>>()

  override get transform_kind(): "scaled" {
    return "scaled"
  }

  static {
    this.define<ScaledTickFormatter.Props>(({Bool, Int, Str, Ref, Or, Nullable, Positive, Enum}) => ({
      ticker:          [ Nullable(Ref(ScaledTicker)), null ],
      formatter:       [ Ref(TickFormatter), () => BasicTickFormatter.create() ],
      origin_label:    [ Or(Str, Ref(BaseText)), "" ],
      prefix:          [ Or(Str, Ref(BaseText)), "" ],
      unit:            [ Or(Str, Ref(BaseText)), "" ],
      unit_style:      [ Enum("always", "except_zero", "symbolic"), "always" ],
      use_fractions:   [ Bool, false ],
      fraction_style:  [ Enum("stacked", "inline"), "inline" ],
      max_denominator: [ Positive(Int), 16 ],
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

    let ticker = this.ticker
    if (ticker != null) {
      this.connect(ticker.change, emit_changed)
    }
    this.on_change(this.properties.ticker, () => {
      if (ticker != null) {
        this.disconnect(ticker.change, emit_changed)
      }
      ticker = this.ticker
      if (ticker != null) {
        this.connect(ticker.change, emit_changed)
      }
    })

    let origin_label = this.origin_label
    if (!isString(origin_label)) {
      this.connect(origin_label.change, emit_changed)
    }
    this.on_change(this.properties.origin_label, () => {
      if (!isString(origin_label)) {
        this.disconnect(origin_label.change, emit_changed)
      }
      origin_label = this.origin_label
      if (!isString(origin_label)) {
        this.connect(origin_label.change, emit_changed)
      }
    })

    let prefix = this.prefix
    if (!isString(prefix)) {
      this.connect(prefix.change, emit_changed)
    }
    this.on_change(this.properties.prefix, () => {
      if (!isString(prefix)) {
        this.disconnect(prefix.change, emit_changed)
      }
      prefix = this.prefix
      if (!isString(prefix)) {
        this.connect(prefix.change, emit_changed)
      }
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

  protected get_ticker(opts: TickFormatter.Context): ScaledTicker | null {
    if (opts.ticker instanceof ScaledTicker) {
      return opts.ticker
    }
    if (this.ticker != null) {
      return this.ticker
    }

    return null
  }

  protected normalized(ticks: number[], opts: TickFormatter.Context): number[] {
    const ticker = this.get_ticker(opts)
    return ticker == null ? ticks : ticks.map((tick) => (tick - ticker.origin)/ticker.scale)
  }

  protected text_value(text: TextLike): string {
    return isString(text) ? text : text.text
  }

  protected has_text(text: TextLike): boolean {
    return this.text_value(text) != ""
  }

  protected text_model(kind: Decoration): BaseText {
    const text = this[kind]
    const source_key = kind == "origin_label" ? "_origin_label_source" : kind == "prefix" ? "_prefix_source" : "_unit_source"
    const text_key = kind == "origin_label" ? "_origin_label_text" : kind == "prefix" ? "_prefix_text" : "_unit_text"
    let model = this[text_key]
    if (model == null || this[source_key] !== text) {
      model = isString(text) ? parse_delimited_string(text) : text
      this[source_key] = text
      this[text_key] = model
    }
    return model
  }

  override get_text_models(opts?: TickFormatter.Context): BaseText[] {
    if (!this.formatter_is_compatible(this.formatter)) {
      return this.formatter.get_text_models(opts)
    }
    const models = [...this.formatter.get_text_models(opts)]
    if (this.has_text(this.origin_label)) {
      models.push(this.text_model("origin_label"))
    }
    if (this.has_text(this.prefix)) {
      models.push(this.text_model("prefix"))
    }
    if (this.has_text(this.unit)) {
      models.push(this.text_model("unit"))
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

  protected math_label(text: string, template: TeXTemplate, opts: TickFormatter.Context): TeX {
    const labels = this.math_labels(opts)
    const key = JSON.stringify([text, template.inline, template.macros])
    const existing = labels.get(key)
    if (existing != null) {
      labels.delete(key)
      labels.set(key, existing)
      return existing
    }

    const model = TeX.create({text, inline: template.inline, macros: template.macros})
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

  protected text_graphic(kind: Decoration, opts: TickFormatter.Context): GraphicsBox {
    const text = this[kind]
    const model = this.text_model(kind)
    return opts.resolve_text?.(model) ?? new TextBox({text: this.text_value(text)})
  }

  protected inline(children: GraphicsBox[]): GraphicsBox {
    return children.length == 1 ? children[0] : new InlineBox(children)
  }

  protected tex_fragment(kind: Decoration, macros: Dict<string | [string, number]>): string {
    if (!this.has_text(this[kind])) {
      return ""
    }
    const model = this.text_model(kind)
    if (model instanceof TeX) {
      Object.assign(macros, model.macros)
      return model.text
    }
    return tex_text(this.text_value(this[kind]))
  }

  protected tex_template(): TeXTemplate | null {
    const origin_label = this.has_text(this.origin_label) ? this.text_model("origin_label") : null
    const prefix = this.has_text(this.prefix) ? this.text_model("prefix") : null
    const unit = this.has_text(this.unit) ? this.text_model("unit") : null
    const models = [origin_label, prefix, unit].filter((model): model is BaseText => model != null)
    const tex_models = models.filter((model): model is TeX => model instanceof TeX)
    if (tex_models.length == 0) {
      return null
    }
    if (models.some((model) => model instanceof MathText && !(model instanceof TeX))) {
      return null
    }

    const macros: Dict<string | [string, number]> = {}
    return {
      origin_label: this.tex_fragment("origin_label", macros),
      prefix: this.tex_fragment("prefix", macros),
      unit: this.tex_fragment("unit", macros),
      inline: tex_models.every((model) => model.inline),
      macros,
    }
  }

  protected tex_coefficient(label: string): string {
    const normalized = label.replaceAll("\u2212", "-")
    const sign = normalized.startsWith("-") ? "-" : ""
    const unsigned = sign == "" ? normalized : normalized.slice(1)
    return `${sign}${tex_text(unsigned)}`
  }

  protected unsigned_label(info: LabelInfo): string {
    return info.is_negative ? info.label.replace(/^[-\u2212]/, "") : info.label
  }

  protected tex_label(info: LabelInfo, template: TeXTemplate): string {
    const {origin_label, prefix, unit} = template
    const relative = origin_label != ""
    if (info.is_zero && relative) {
      return origin_label
    }
    if (info.is_zero && this.unit_style != "always") {
      return this.tex_coefficient(info.label)
    }

    if (info.fraction != null && info.fraction.denom != 1) {
      const {numer, denom} = info.fraction
      const sign = numer < 0 ? "-" : relative ? "+" : ""
      const magnitude = abs(numer)
      const head = relative ? `${origin_label}${sign}${prefix}` : `${prefix}${sign}`
      if (this.unit_style == "symbolic" && this.has_text(this.unit)) {
        const coefficient = magnitude == 1 ? "" : `${magnitude}`
        const numerator = `${coefficient}${unit}`
        const fraction = this.fraction_style == "stacked" ? `\\frac{${numerator}}{${denom}}` : `${numerator}/${denom}`
        return `${head}${fraction}`
      }
      const fraction = this.fraction_style == "stacked" ? `\\frac{${magnitude}}{${denom}}` : `${magnitude}/${denom}`
      return `${head}${fraction}${unit}`
    }

    const sign = relative ? info.is_negative ? "-" : "+" : ""
    let coefficient = this.tex_coefficient(relative ? this.unsigned_label(info) : info.label)
    if (this.unit_style == "symbolic" && this.has_text(this.unit)) {
      if (info.is_one) {
        coefficient = ""
      } else if (info.is_negative_one) {
        coefficient = relative ? "" : "-"
      }
    }
    const head = relative ? `${origin_label}${sign}${prefix}` : prefix
    return `${head}${coefficient}${unit}`
  }

  protected tolerance(values: number[], opts: TickFormatter.Context): number {
    const finite = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b)
    let magnitude = 1
    let spacing = 0
    for (let i = 0; i < finite.length; i++) {
      magnitude = max(magnitude, abs(finite[i]))
      if (i != 0) {
        spacing = max(spacing, abs(finite[i] - finite[i - 1]))
      }
    }
    const ticker = this.get_ticker(opts)
    if (ticker != null) {
      magnitude = max(magnitude, abs(ticker.origin)/ticker.scale)
    }
    return 8*Number.EPSILON*max(1, magnitude, spacing)
  }

  protected is_close(value: number, target: number, tolerance: number): boolean {
    return abs(value - target) <= tolerance
  }

  protected fraction(value: number, tolerance: number): Fraction | null {
    if (!Number.isFinite(value)) {
      return null
    }

    let numerator = round(value)
    let denominator = 1
    let error = abs(value - numerator)
    for (let candidate = 2; candidate <= this.max_denominator; candidate++) {
      const candidate_numerator = round(value*candidate)
      const candidate_error = abs(value - candidate_numerator/candidate)
      if (candidate_error < error) {
        numerator = candidate_numerator
        denominator = candidate
        error = candidate_error
      }
    }

    if (error > tolerance) {
      return null
    }

    return new Fraction(numerator, denominator)
  }

  protected label_info(values: number[], opts: TickFormatter.Context): LabelInfo[] {
    const labels = this.formatter.doFormat(values, opts)
    const [zero, one, negative_one] = this.formatter.doFormat([0, 1, -1], opts)
    const minus_sign = negative_one.startsWith("-") ? "-" : "\u2212"
    const tolerance = this.tolerance(values, opts)
    const fractions = this.use_fractions ? values.map((value) => this.fraction(value, tolerance)) : []
    const use_fractions = fractions.length != 0 && fractions.every((fraction) => fraction != null)

    return labels.map((label, i) => {
      const value = values[i]
      return {
        label,
        fraction: use_fractions ? fractions[i] : null,
        is_zero: this.is_close(value, 0, tolerance) || label == zero,
        is_negative: value < -tolerance,
        is_one: this.is_close(value, 1, tolerance) || label == one,
        is_negative_one: this.is_close(value, -1, tolerance) || label == negative_one,
        minus_sign,
      }
    })
  }

  protected fraction_label({numer, denom}: Fraction, minus_sign: string): string {
    const origin_label = this.text_value(this.origin_label)
    const relative = origin_label != ""
    const sign = numer < 0 ? minus_sign : relative ? "+" : ""
    const magnitude = abs(numer)
    const head = relative ? `${origin_label}${sign}${this.text_value(this.prefix)}` : `${this.text_value(this.prefix)}${sign}`
    if (this.unit_style == "symbolic" && this.has_text(this.unit)) {
      const coefficient = magnitude == 1 ? "" : `${magnitude}`
      return `${head}${coefficient}${this.text_value(this.unit)}/${denom}`
    }
    return `${head}${magnitude}/${denom}${this.text_value(this.unit)}`
  }

  protected format_label(info: LabelInfo): string {
    const origin_label = this.text_value(this.origin_label)
    const relative = origin_label != ""
    if (info.is_zero && relative) {
      return origin_label
    }
    if (info.is_zero && this.unit_style != "always") {
      return info.label
    }

    if (info.fraction != null && info.fraction.denom != 1) {
      return this.fraction_label(info.fraction, info.minus_sign)
    }

    const sign = relative ? info.is_negative ? info.minus_sign : "+" : ""
    let label = relative ? this.unsigned_label(info) : info.label
    if (this.unit_style == "symbolic" && this.has_text(this.unit)) {
      if (info.is_one || relative && info.is_negative_one) {
        label = ""
      } else if (info.is_negative_one) {
        label = info.minus_sign
      }
    }
    const head = relative ? `${origin_label}${sign}${this.text_value(this.prefix)}` : this.text_value(this.prefix)
    return `${head}${label}${this.text_value(this.unit)}`
  }

  doFormat(ticks: number[], opts: TickFormatter.Context): string[] {
    if (!this.check_formatter(this.formatter)) {
      return this.formatter.doFormat(ticks, opts)
    }
    const normalized = this.normalized(ticks, opts)
    return this.label_info(normalized, opts).map((info) => this.format_label(info))
  }

  override format_graphics(ticks: number[], opts: TickFormatter.Context): GraphicsBox[] {
    if (!this.check_formatter(this.formatter)) {
      return this.formatter.format_graphics(ticks, opts)
    }
    const normalized = this.normalized(ticks, opts)
    const graphics = this.formatter.format_graphics(normalized, opts)
    const info = this.label_info(normalized, opts)
    const template = this.tex_template()
    const labels = graphics.map((graphic, i) => {
      const label = info[i]
      if (template != null) {
        const text = this.tex_label(label, template)
        const model = this.math_label(text, template, opts)
        const math_graphic = opts.resolve_text?.(model)
        if (math_graphic != null) {
          return math_graphic
        }
      }

      const relative = this.has_text(this.origin_label)
      if (label.is_zero && relative) {
        return this.text_graphic("origin_label", opts)
      }
      if (label.is_zero && this.unit_style != "always") {
        return graphic
      }

      if (label.fraction != null && label.fraction.denom != 1) {
        const {numer, denom} = label.fraction
        const sign = numer < 0 ? label.minus_sign : relative ? "+" : ""
        const magnitude = abs(numer)
        const children: GraphicsBox[] = []
        if (relative) {
          children.push(this.text_graphic("origin_label", opts))
          children.push(new TextBox({text: sign}))
        }
        if (this.has_text(this.prefix)) {
          children.push(this.text_graphic("prefix", opts))
        }
        if (this.unit_style == "symbolic" && this.has_text(this.unit)) {
          if (!relative && sign != "" || magnitude != 1) {
            children.push(new TextBox({text: `${relative ? "" : sign}${magnitude == 1 ? "" : magnitude}`}))
          }
          children.push(this.text_graphic("unit", opts))
          children.push(new TextBox({text: `/${denom}`}))
        } else {
          children.push(new TextBox({text: `${relative ? "" : sign}${magnitude}/${denom}`}))
          if (this.has_text(this.unit)) {
            children.push(this.text_graphic("unit", opts))
          }
        }
        return this.inline(children)
      }

      const children: GraphicsBox[] = []
      if (relative) {
        children.push(this.text_graphic("origin_label", opts))
        children.push(new TextBox({text: label.is_negative ? label.minus_sign : "+"}))
      }
      if (this.has_text(this.prefix)) {
        children.push(this.text_graphic("prefix", opts))
      }
      if (this.unit_style == "symbolic" && this.has_text(this.unit) && label.is_one) {
        // Omit the unit coefficient.
      } else if (this.unit_style == "symbolic" && this.has_text(this.unit) && label.is_negative_one) {
        if (!relative) {
          children.push(new TextBox({text: label.minus_sign}))
        }
      } else if (relative) {
        children.push(new TextBox({text: this.unsigned_label(label)}))
      } else {
        children.push(graphic)
      }
      if (this.has_text(this.unit)) {
        children.push(this.text_graphic("unit", opts))
      }

      return this.inline(children)
    })
    return labels
  }
}
