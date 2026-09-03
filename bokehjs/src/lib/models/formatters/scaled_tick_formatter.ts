import {BasicTickFormatter} from "./basic_tick_formatter"
import {TickFormatter} from "./tick_formatter"
import {ScaledTicker} from "../tickers/scaled_ticker"
import type {GraphicsBox} from "core/graphics"
import {InlineBox, TextBox} from "core/graphics"
import {logger} from "core/logging"
import {isString} from "core/util/types"
import {BaseText} from "../text/base_text"
import {TeX} from "../text/math_text"
import {parse_delimited_string} from "../text/utils"
import type {Dict} from "core/types"
import type * as p from "core/properties"

const {abs, max, round} = Math

type Fraction = {
  numerator: number
  denominator: number
}

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
type Decoration = "base_label" | "prefix" | "suffix"

type TeXTemplate = {
  base_label: string
  prefix: string
  suffix: string
  inline: boolean
  macros: Dict<string | [string, number]>
}

export namespace ScaledTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
    ticker: p.Property<ScaledTicker | null>
    formatter: p.Property<TickFormatter>
    base_label: p.Property<TextLike>
    prefix: p.Property<TextLike>
    suffix: p.Property<TextLike>
    unit_style: p.Property<"always" | "except_zero" | "symbolic">
    use_fractions: p.Property<boolean>
    fraction_style: p.Property<"stacked" | "inline">
    max_denominator: p.Property<number>
  }
}

export interface ScaledTickFormatter extends ScaledTickFormatter.Attrs {}

export class ScaledTickFormatter extends TickFormatter {
  declare properties: ScaledTickFormatter.Props

  protected _warned_missing_ticker = false
  protected _base_label_source: TextLike | undefined
  protected _base_label_text: BaseText | undefined
  protected _prefix_source: TextLike | undefined
  protected _prefix_text: BaseText | undefined
  protected _suffix_source: TextLike | undefined
  protected _suffix_text: BaseText | undefined
  protected _math_labels: Map<string, TeX> = new Map()

  static {
    this.define<ScaledTickFormatter.Props>(({Bool, Int, Str, Ref, Or, Nullable, Positive, Enum}) => ({
      ticker:          [ Nullable(Ref(ScaledTicker)), null ],
      formatter:       [ Ref(TickFormatter), () => BasicTickFormatter.create() ],
      base_label:      [ Or(Str, Ref(BaseText)), "" ],
      prefix:          [ Or(Str, Ref(BaseText)), "" ],
      suffix:          [ Or(Str, Ref(BaseText)), "" ],
      unit_style:      [ Enum("always", "except_zero", "symbolic"), "always" ],
      use_fractions:   [ Bool, false ],
      fraction_style:  [ Enum("stacked", "inline"), "stacked" ],
      max_denominator: [ Positive(Int), 16 ],
    }))
  }

  override connect_signals(): void {
    super.connect_signals()

    const emit_changed = () => this.change.emit()

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
  }

  protected get_ticker(opts: TickFormatter.Context): ScaledTicker | null {
    if (opts.ticker instanceof ScaledTicker) {
      return opts.ticker
    }
    if (this.ticker != null) {
      return this.ticker
    }

    if (!this._warned_missing_ticker) {
      logger.warn("ScaledTickFormatter has no ScaledTicker; formatting ticks without scaling")
      this._warned_missing_ticker = true
    }
    return null
  }

  protected normalized(ticks: number[], opts: TickFormatter.Context): number[] {
    const ticker = this.get_ticker(opts)
    return ticker == null ? ticks : ticks.map((tick) => tick/ticker.scale)
  }

  protected text_value(text: TextLike): string {
    return isString(text) ? text : text.text
  }

  protected has_text(text: TextLike): boolean {
    return this.text_value(text) != ""
  }

  protected text_model(kind: Decoration): BaseText {
    const text = this[kind]
    const source_key = kind == "base_label" ? "_base_label_source" : kind == "prefix" ? "_prefix_source" : "_suffix_source"
    const text_key = kind == "base_label" ? "_base_label_text" : kind == "prefix" ? "_prefix_text" : "_suffix_text"
    let model = this[text_key]
    if (model == null || this[source_key] !== text) {
      model = isString(text) ? parse_delimited_string(text) : text
      this[source_key] = text
      this[text_key] = model
    }
    return model
  }

  override get_text_models(): BaseText[] {
    const models = this.formatter.get_text_models()
    if (this.has_text(this.base_label)) {
      models.push(this.text_model("base_label"))
    }
    if (this.has_text(this.prefix)) {
      models.push(this.text_model("prefix"))
    }
    if (this.has_text(this.suffix)) {
      models.push(this.text_model("suffix"))
    }
    return models
  }

  protected text_graphic(kind: Decoration, opts: TickFormatter.Context): GraphicsBox {
    const text = this[kind]
    const model = this.text_model(kind)
    return opts.resolve_text?.(model) ?? new TextBox({text: this.text_value(text)})
  }

  protected inline(children: GraphicsBox[]): GraphicsBox {
    return children.length == 1 ? children[0] : new InlineBox(children)
  }

  protected tex_escape(text: string): string {
    const substitutions: Dict<string> = {
      "\\": "\\backslash{}",
      "{": "\\{",
      "}": "\\}",
      "#": "\\#",
      $: "\\$",
      "%": "\\%",
      "&": "\\&",
      _: "\\_",
      "^": "\\^{}",
      "~": "\\~{}",
    }
    return text.replace(/[\\{}#$%&_^~]/g, (value) => substitutions[value])
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
    return `\\text{${this.tex_escape(this.text_value(this[kind]))}}`
  }

  protected tex_template(): TeXTemplate | null {
    const base_label = this.has_text(this.base_label) ? this.text_model("base_label") : null
    const prefix = this.has_text(this.prefix) ? this.text_model("prefix") : null
    const suffix = this.has_text(this.suffix) ? this.text_model("suffix") : null
    const tex_models = [base_label, prefix, suffix].filter((model): model is TeX => model instanceof TeX)
    if (tex_models.length == 0) {
      return null
    }

    const macros: Dict<string | [string, number]> = {}
    return {
      base_label: this.tex_fragment("base_label", macros),
      prefix: this.tex_fragment("prefix", macros),
      suffix: this.tex_fragment("suffix", macros),
      inline: tex_models.every((model) => model.inline),
      macros,
    }
  }

  protected tex_coefficient(label: string): string {
    return label.replaceAll("\u2212", "-")
  }

  protected unsigned_label(info: LabelInfo): string {
    return info.is_negative ? info.label.replace(/^[-\u2212]/, "") : info.label
  }

  protected tex_label(info: LabelInfo, template: TeXTemplate): string {
    const {base_label, prefix, suffix} = template
    const relative = base_label != ""
    if (info.is_zero && relative) {
      return base_label
    }
    if (info.is_zero && this.unit_style != "always") {
      return this.tex_coefficient(info.label)
    }

    if (info.fraction != null && info.fraction.denominator != 1) {
      const {numerator, denominator} = info.fraction
      const sign = numerator < 0 ? "-" : relative ? "+" : ""
      const magnitude = abs(numerator)
      const head = relative ? `${base_label}${sign}${prefix}` : `${prefix}${sign}`
      if (this.unit_style == "symbolic" && this.has_text(this.suffix)) {
        const coefficient = magnitude == 1 ? "" : `${magnitude}`
        const numerator = `${coefficient}${suffix}`
        const fraction = this.fraction_style == "stacked" ? `\\frac{${numerator}}{${denominator}}` : `${numerator}/${denominator}`
        return `${head}${fraction}`
      }
      const fraction = this.fraction_style == "stacked" ? `\\frac{${magnitude}}{${denominator}}` : `${magnitude}/${denominator}`
      return `${head}${fraction}${suffix}`
    }

    const sign = relative ? info.is_negative ? "-" : "+" : ""
    let coefficient = this.tex_coefficient(relative ? this.unsigned_label(info) : info.label)
    if (this.unit_style == "symbolic" && this.has_text(this.suffix)) {
      if (info.is_one) {
        coefficient = ""
      } else if (info.is_negative_one) {
        coefficient = relative ? "" : "-"
      }
    }
    const head = relative ? `${base_label}${sign}${prefix}` : prefix
    return `${head}${coefficient}${suffix}`
  }

  protected tolerance(values: number[]): number {
    const finite = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b)
    let magnitude = 1
    let spacing = 0
    for (let i = 0; i < finite.length; i++) {
      magnitude = max(magnitude, abs(finite[i]))
      if (i != 0) {
        spacing = max(spacing, abs(finite[i] - finite[i - 1]))
      }
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

    const gcd = (a: number, b: number): number => {
      while (b != 0) {
        const remainder = a % b
        a = b
        b = remainder
      }
      return a
    }
    const divisor = gcd(abs(numerator), denominator)
    return {numerator: numerator/divisor, denominator: denominator/divisor}
  }

  protected label_info(values: number[], opts: TickFormatter.Context): LabelInfo[] {
    const labels = this.formatter.doFormat(values, opts)
    const [zero, one, negative_one] = this.formatter.doFormat([0, 1, -1], opts)
    const minus_sign = negative_one.startsWith("-") ? "-" : "\u2212"
    const tolerance = this.tolerance(values)
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

  protected fraction_label({numerator, denominator}: Fraction, minus_sign: string): string {
    const base_label = this.text_value(this.base_label)
    const relative = base_label != ""
    const sign = numerator < 0 ? minus_sign : relative ? "+" : ""
    const magnitude = abs(numerator)
    const head = relative ? `${base_label}${sign}${this.text_value(this.prefix)}` : `${this.text_value(this.prefix)}${sign}`
    if (this.unit_style == "symbolic" && this.has_text(this.suffix)) {
      const coefficient = magnitude == 1 ? "" : `${magnitude}`
      return `${head}${coefficient}${this.text_value(this.suffix)}/${denominator}`
    }
    return `${head}${magnitude}/${denominator}${this.text_value(this.suffix)}`
  }

  protected format_label(info: LabelInfo): string {
    const base_label = this.text_value(this.base_label)
    const relative = base_label != ""
    if (info.is_zero && relative) {
      return base_label
    }
    if (info.is_zero && this.unit_style != "always") {
      return info.label
    }

    if (info.fraction != null && info.fraction.denominator != 1) {
      return this.fraction_label(info.fraction, info.minus_sign)
    }

    const sign = relative ? info.is_negative ? info.minus_sign : "+" : ""
    let label = relative ? this.unsigned_label(info) : info.label
    if (this.unit_style == "symbolic" && this.has_text(this.suffix)) {
      if (info.is_one || relative && info.is_negative_one) {
        label = ""
      } else if (info.is_negative_one) {
        label = info.minus_sign
      }
    }
    const head = relative ? `${base_label}${sign}${this.text_value(this.prefix)}` : this.text_value(this.prefix)
    return `${head}${label}${this.text_value(this.suffix)}`
  }

  doFormat(ticks: number[], opts: TickFormatter.Context): string[] {
    const normalized = this.normalized(ticks, opts)
    return this.label_info(normalized, opts).map((info) => this.format_label(info))
  }

  override format_graphics(ticks: number[], opts: TickFormatter.Context): GraphicsBox[] {
    const normalized = this.normalized(ticks, opts)
    const graphics = this.formatter.format_graphics(normalized, opts)
    const info = this.label_info(normalized, opts)
    const template = this.tex_template()
    const previous_math_labels = this._math_labels
    const current_math_labels = new Map<string, TeX>()

    const labels = graphics.map((graphic, i) => {
      const label = info[i]
      if (template != null) {
        const text = this.tex_label(label, template)
        const key = JSON.stringify([text, template.inline, template.macros])
        const model = previous_math_labels.get(key) ?? TeX.create({
          text,
          inline: template.inline,
          macros: template.macros,
        })
        current_math_labels.set(key, model)
        const math_graphic = opts.resolve_text?.(model)
        if (math_graphic != null) {
          return math_graphic
        }
      }

      const relative = this.has_text(this.base_label)
      if (label.is_zero && relative) {
        return this.text_graphic("base_label", opts)
      }
      if (label.is_zero && this.unit_style != "always") {
        return graphic
      }

      if (label.fraction != null && label.fraction.denominator != 1) {
        const {numerator, denominator} = label.fraction
        const sign = numerator < 0 ? label.minus_sign : relative ? "+" : ""
        const magnitude = abs(numerator)
        const children: GraphicsBox[] = []
        if (relative) {
          children.push(this.text_graphic("base_label", opts))
          children.push(new TextBox({text: sign}))
        }
        if (this.has_text(this.prefix)) {
          children.push(this.text_graphic("prefix", opts))
        }
        if (this.unit_style == "symbolic" && this.has_text(this.suffix)) {
          if (!relative && sign != "" || magnitude != 1) {
            children.push(new TextBox({text: `${relative ? "" : sign}${magnitude == 1 ? "" : magnitude}`}))
          }
          children.push(this.text_graphic("suffix", opts))
          children.push(new TextBox({text: `/${denominator}`}))
        } else {
          children.push(new TextBox({text: `${relative ? "" : sign}${magnitude}/${denominator}`}))
          if (this.has_text(this.suffix)) {
            children.push(this.text_graphic("suffix", opts))
          }
        }
        return this.inline(children)
      }

      const children: GraphicsBox[] = []
      if (relative) {
        children.push(this.text_graphic("base_label", opts))
        children.push(new TextBox({text: label.is_negative ? label.minus_sign : "+"}))
      }
      if (this.has_text(this.prefix)) {
        children.push(this.text_graphic("prefix", opts))
      }
      if (this.unit_style == "symbolic" && this.has_text(this.suffix) && label.is_one) {
        // Omit the unit coefficient.
      } else if (this.unit_style == "symbolic" && this.has_text(this.suffix) && label.is_negative_one) {
        if (!relative) {
          children.push(new TextBox({text: label.minus_sign}))
        }
      } else if (relative) {
        children.push(new TextBox({text: this.unsigned_label(label)}))
      } else {
        children.push(graphic)
      }
      if (this.has_text(this.suffix)) {
        children.push(this.text_graphic("suffix", opts))
      }

      return this.inline(children)
    })
    this._math_labels = current_math_labels
    return labels
  }
}
