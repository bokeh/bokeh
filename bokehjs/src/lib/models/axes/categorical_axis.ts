import {Axis, AxisView, Extents, TickCoords, Coords} from "./axis"

import {CategoricalTicker} from "../tickers/categorical_ticker"
import {CategoricalTickFormatter} from "../formatters/categorical_tick_formatter"
import {FactorRange, Factor, L1Factor, L2Factor, L3Factor} from "../ranges/factor_range"

import * as visuals from "core/visuals"
import * as mixins from "core/property_mixins"
import * as p from "core/properties"
import {TickLabelOrientation} from "core/enums"
import {Context2d} from "core/util/canvas"
import {Orient} from "core/layout/side_panel"

export type CategoricalTickCoords = TickCoords & {
  mids: Coords
  tops: Coords
}

export class CategoricalAxisView extends AxisView {
  model: CategoricalAxis
  visuals: CategoricalAxis.Visuals

  protected _paint(ctx: Context2d, extents: Extents, tick_coords: TickCoords): void {
    this._draw_group_separators(ctx, extents, tick_coords)
  }

  protected _draw_group_separators(ctx: Context2d, _extents: Extents, _tick_coords: TickCoords): void {
    const [range] = (this.ranges as any) as [FactorRange, FactorRange]
    const [start, end] = this.computed_bounds

    if (!range.tops || range.tops.length < 2 || !this.visuals.separator_line.doit)
      return

    const dim = this.dimension
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
        coords[alt].push(this.loc)
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
      this._draw_oriented_labels(ctx, labels, coords, orient, this.panel.side, standoff, visuals)
      standoff += extents.tick_label[i]
    }
  }

  protected _tick_label_extents(): number[] {
    const info = this._get_factor_info()

    const extents = []
    for (const [labels,, orient, visuals] of info) {
      const extent = this._oriented_labels_extent(labels, orient, this.panel.side, this.model.major_label_standoff, visuals)
      extents.push(extent)
    }

    return extents
  }

  protected _get_factor_info(): [string[], Coords, Orient | number, visuals.Text][] {
    const [range] = (this.ranges as any) as [FactorRange, FactorRange]
    const [start, end] = this.computed_bounds
    const loc = this.loc

    const ticks = this.model.ticker.get_ticks(start, end, range, loc, {})
    const coords = this.tick_coords

    const info: [string[], Coords, Orient | number, visuals.Text][] = []

    if (range.levels == 1) {
      const major = ticks.major as L1Factor[]
      const labels = this.model.formatter.doFormat(major, this)
      info.push([labels, coords.major, this.model.major_label_orientation, this.visuals.major_label_text])
    } else if (range.levels == 2) {
      const major = (ticks.major as L2Factor[]).map((x) => x[1])
      const labels = this.model.formatter.doFormat(major, this)
      info.push([labels, coords.major, this.model.major_label_orientation, this.visuals.major_label_text])
      info.push([ticks.tops as string[], coords.tops, this.model.group_label_orientation, this.visuals.group_text])
    } else if (range.levels == 3) {
      const major = (ticks.major as L3Factor[]).map((x) => x[2])
      const labels = this.model.formatter.doFormat(major, this)
      const mid_labels = ticks.mids.map((x) => x[1])
      info.push([labels, coords.major, this.model.major_label_orientation, this.visuals.major_label_text])
      info.push([mid_labels as string[], coords.mids, this.model.subgroup_label_orientation, this.visuals.subgroup_text])
      info.push([ticks.tops as string[], coords.tops, this.model.group_label_orientation, this.visuals.group_text])
    }

    return info
  }

  // {{{ TODO: state
  get tick_coords(): CategoricalTickCoords {
    const i = this.dimension
    const j = (i + 1) % 2
    const [range] = (this.ranges as any) as [FactorRange, FactorRange]
    const [start, end] = this.computed_bounds

    const ticks = this.model.ticker.get_ticks(start, end, range, this.loc, {})

    const coords: CategoricalTickCoords = {
      major: [[], []],
      mids:  [[], []],
      tops:  [[], []],
      minor: [[], []],
    }

    coords.major[i] = ticks.major as any
    coords.major[j] = ticks.major.map((_x) => this.loc)

    if (range.levels == 3) {
      coords.mids[i] = ticks.mids as any
      coords.mids[j] = ticks.mids.map((_x) => this.loc)
    }

    if (range.levels > 1) {
      coords.tops[i] = ticks.tops as any
      coords.tops[j] = ticks.tops.map((_x) => this.loc)
    }

    return coords
  }
  // }}}
}

export namespace CategoricalAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Axis.Props & {
    ticker: p.Property<CategoricalTicker>
    formatter: p.Property<CategoricalTickFormatter>
    group_label_orientation: p.Property<TickLabelOrientation | number>
    subgroup_label_orientation: p.Property<TickLabelOrientation | number>
  } & Mixins

  export type Mixins =
    mixins.SeparatorLine &
    mixins.GroupText     &
    mixins.SubGroupText

  export type Visuals = Axis.Visuals & {
    separator_line: visuals.Line
    group_text: visuals.Text
    subgroup_text: visuals.Text
  }
}

export interface CategoricalAxis extends CategoricalAxis.Attrs {}

export class CategoricalAxis extends Axis {
  properties: CategoricalAxis.Props
  __view_type__: CategoricalAxisView

  ticker: CategoricalTicker
  formatter: CategoricalTickFormatter

  constructor(attrs?: Partial<CategoricalAxis.Attrs>) {
    super(attrs)
  }

  static init_CategoricalAxis(): void {
    this.prototype.default_view = CategoricalAxisView

    this.mixins<CategoricalAxis.Mixins>([
      ["separator_", mixins.Line],
      ["group_",     mixins.Text],
      ["subgroup_",  mixins.Text],
    ])

    this.define<CategoricalAxis.Props>({
      group_label_orientation:    [ p.Any, "parallel" ], // TODO: p.TickLabelOrientation | p.Number
      subgroup_label_orientation: [ p.Any, "parallel" ], // TODO: p.TickLabelOrientation | p.Number
    })

    this.override({
      ticker: () => new CategoricalTicker(),
      formatter: () => new CategoricalTickFormatter(),
      separator_line_color: "lightgrey",
      separator_line_width: 2,
      group_text_font_style: "bold",
      group_text_font_size: "11px",
      group_text_color: "grey",
      subgroup_text_font_style: "bold",
      subgroup_text_font_size: "11px",
    })
  }
}
