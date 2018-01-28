import {Axis, AxisView, Extents, TickCoords, Coords} from "./axis"

import {CategoricalTicker} from "../tickers/categorical_ticker"
import {CategoricalTickFormatter} from "../formatters/categorical_tick_formatter"
import {FactorRange, Factor} from "../ranges/factor_range"

import {Text, Line} from "core/visuals"
import {Context2d} from "core/util/canvas"
import {Color} from "core/types"
import {FontStyle, TextAlign, TextBaseline, LineJoin, LineCap} from "core/enums"

export type CategoricalTickCoords = TickCoords & {
  mids: Coords
  tops: Coords
}

export class CategoricalAxisView extends AxisView {
  model: CategoricalAxis
  visuals: CategoricalAxis.Visuals

  protected _render(ctx: Context2d, extents: Extents, tick_coords: TickCoords): void {
    this._draw_group_separators(ctx, extents, tick_coords)
  }

  protected _draw_group_separators(ctx: Context2d, _extents: Extents, _tick_coords: TickCoords): void {
    const [range,] = (this.model.ranges as any) as [FactorRange, FactorRange]
    const [start, end] = this.model.computed_bounds

    if (!range.tops || range.tops.length < 2 || !this.visuals.separator_line.doit)
      return

    const dim = this.model.dimension
    const alt = (dim + 1) % 2

    const coords: Coords = [[], []]

    let ind = 0
    for (let i = 0; i < range.tops.length - 1; i++) {
      let first: Factor, last: Factor

      for (let j = ind; j < range.factors.length; j++) {
        if (range.factors[j][0] == range.tops[i+1]) {
          [first, last] = [range.factors[j-1], range.factors[j]]
          ind = j
          break
        }
      }

      const pt = (range.synthetic(first!) + range.synthetic(last!))/2
      if (pt > start && pt < end) {
        coords[dim].push(pt)
        coords[alt].push(this.model.loc)
      }
    }

    const tex = this._tick_label_extent()
    this._draw_ticks(ctx, coords, -3, (tex-6), this.visuals.separator_line)
  }

  protected _draw_major_labels(ctx: Context2d, extents: Extents, _tick_coords: TickCoords): void {
    const info = this._get_factor_info()

    let standoff = extents.tick + this.model.major_label_standoff
    for (let i = 0; i < info.length; i++) {
      const [labels, coords, orient, visuals] = info[i]
      this._draw_oriented_labels(ctx, labels, coords, orient, this.model.panel.side, standoff, visuals)
      standoff += extents.tick_label[i]
    }
  }

  protected _tick_label_extents(): number[] {
    const info = this._get_factor_info()

    const extents = []
    for (const [labels,, orient, visuals] of info) {
      const extent = this._oriented_labels_extent(labels, orient, this.model.panel.side, this.model.major_label_standoff, visuals)
      extents.push(extent)
    }

    return extents
  }

  protected _get_factor_info() {
    const [range,] = (this.model.ranges as any) as [FactorRange, FactorRange]
    const [start, end] = this.model.computed_bounds
    const loc = this.model.loc

    const ticks = this.model.ticker.get_ticks(start, end, range, loc, {})
    const coords = this.model.tick_coords

    const info = []

    if (range.levels == 1) {
      const labels = this.model.formatter.doFormat(ticks.major, this)
      info.push([labels, coords.major, this.model.major_label_orientation, this.visuals.major_label_text])
    } else if (range.levels == 2) {
      const labels = this.model.formatter.doFormat(ticks.major.map((x) => x[1]), this)
      info.push([labels, coords.major, this.model.major_label_orientation, this.visuals.major_label_text])
      info.push([ticks.tops, coords.tops, 'parallel', this.visuals.group_text])
    } else if (range.levels == 3) {
      const labels = this.model.formatter.doFormat(ticks.major.map((x) => x[2]), this)
      const mid_labels = ticks.mids.map((x) => x[1])
      info.push([labels, coords.major, this.model.major_label_orientation, this.visuals.major_label_text])
      info.push([mid_labels, coords.mids, 'parallel', this.visuals.subgroup_text])
      info.push([ticks.tops, coords.tops, 'parallel', this.visuals.group_text])
    }

    return info
  }
}

export namespace CategoricalAxis {
  // line:separator_
  export interface SeparatorLine {
    separator_line_color: Color
    separator_line_width: number
    separator_line_alpha: number
    separator_line_join: LineJoin
    separator_line_cap: LineCap
    separator_line_dash: number[]
    separator_line_dash_offset: number
  }

  // text:group_
  export interface GroupText {
    group_text_font: string
    group_text_font_size: string
    group_text_font_style: FontStyle
    group_text_color: Color
    group_text_alpha: number
    group_text_align: TextAlign
    group_text_baseline: TextBaseline
    group_text_line_height: number
  }

  // text:subgroup_
  export interface SubgroupText {
    subgroup_text_font: string
    subgroup_text_font_size: string
    subgroup_text_font_style: FontStyle
    subgroup_text_color: Color
    subgroup_text_alpha: number
    subgroup_text_align: TextAlign
    subgroup_text_baseline: TextBaseline
    subgroup_text_line_height: number
  }

  export interface Mixins extends SeparatorLine, GroupText, SubgroupText {}

  export interface Attrs extends Axis.Attrs, Mixins {
    ticker: CategoricalTicker
    formatter: CategoricalTickFormatter
  }

  export type Visuals = Axis.Visuals & {
    separator_line: Line,
    group_text: Text,
    subgroup_text: Text,
  }

  export interface Opts extends Axis.Opts {}
}

export interface CategoricalAxis extends CategoricalAxis.Attrs {}

export class CategoricalAxis extends Axis {

  ticker: CategoricalTicker
  formatter: CategoricalTickFormatter

  constructor(attrs?: Partial<CategoricalAxis.Attrs>, opts?: CategoricalAxis.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "CategoricalAxis"
    this.prototype.default_view = CategoricalAxisView

    this.mixins([
      "line:separator_",
      "text:group_",
      "text:subgroup_",
    ])

    this.override({
      ticker: () => new CategoricalTicker(),
      formatter: () => new CategoricalTickFormatter(),
      separator_line_color: "lightgrey",
      separator_line_width: 2,
      group_text_font_style: "bold",
      group_text_font_size: "8pt",
      group_text_color: "grey",
      subgroup_text_font_style: "bold",
      subgroup_text_font_size: "8pt",
    })
  }

  get tick_coords(): CategoricalTickCoords {
    const i = this.dimension
    const j = (i + 1) % 2
    const [range,] = (this.ranges as any) as [FactorRange, FactorRange]
    const [start, end] = this.computed_bounds

    const ticks = this.ticker.get_ticks(start, end, range, this.loc, {})

    const coords: CategoricalTickCoords = {
      major: [[], []],
      mids:  [[], []],
      tops:  [[], []],
      minor: [[], []],
    }

    coords.major[i] = ticks.major as any
    coords.major[j] = ticks.major.map((_x) => this.loc)

    if (range.levels == 3)
      coords.mids[i] = ticks.mids as any
      coords.mids[j] = ticks.mids.map((_x) => this.loc)

    if (range.levels > 1)
      coords.tops[i] = ticks.tops as any
      coords.tops[j] = ticks.tops.map((_x) => this.loc)

    return coords
  }
}
CategoricalAxis.initClass()
