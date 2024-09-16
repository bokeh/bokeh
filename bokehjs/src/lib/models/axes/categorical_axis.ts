import type {Extents, TickCoords, Coords} from "./axis"
import {Axis, AxisView} from "./axis"

import {CategoricalTicker} from "../tickers/categorical_ticker"
import {CategoricalTickFormatter} from "../formatters/categorical_tick_formatter"
import type {FactorRange, Factor, L1Factor, L2Factor, L3Factor} from "../ranges/factor_range"

import type * as visuals from "core/visuals"
import * as mixins from "core/property_mixins"
import type * as p from "core/properties"
import {LabelOrientation} from "core/enums"
import type {GraphicsBox} from "core/graphics"
import {GraphicsBoxes, TextBox} from "core/graphics"
import type {Context2d} from "core/util/canvas"
import {isString} from "core/util/types"
import type {Orient} from "core/layout/side_panel"

export type CategoricalTickCoords = TickCoords & {
  mids: Coords
  tops: Coords
}

export class CategoricalAxisView extends AxisView {
  declare model: CategoricalAxis
  declare visuals: CategoricalAxis.Visuals

  declare readonly RangeType: FactorRange

  protected _hit_value(sx: number, sy: number): Factor | null {
    const [range] = this.ranges
    const {start, end, span} = range
    switch (this.dimension) {
      case 0: {
        const {x0, width} = this.bbox
        return range.factor(span * (sx - x0) / width + start)
      }
      case 1: {
        const {y0, height} = this.bbox
        return range.factor(end - span * (sy - y0) / height)
      }
    }
  }

  protected override _paint(ctx: Context2d): void {
    const {tick_coords, extents} = this
    super._paint(ctx)
    this._draw_group_separators(ctx, extents, tick_coords)
  }

  protected _draw_group_separators(ctx: Context2d, _extents: Extents, _tick_coords: TickCoords): void {
    const [range] = this.ranges
    const [start, end] = this.computed_bounds

    const {factors} = range
    const {tops} = range.mapper
    if (tops == null || tops.length < 2 || !this.visuals.separator_line.doit) {
      return
    }

    const dim = this.dimension
    const alt = 1 - dim

    const coords: Coords = [[], []]

    let ind = 0
    for (let i = 0; i < tops.length - 1; i++) {
      let first: Factor, last: Factor

      for (let j = ind; j < factors.length; j++) {
        if (factors[j][0] == tops[i+1]) {
          [first, last] = [factors[j-1], factors[j]]
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

    const tex = this.extents.tick_label
    this._draw_ticks(ctx, coords, -3, tex - 6, this.visuals.separator_line)
  }

  protected override _draw_major_labels(ctx: Context2d, extents: Extents, _tick_coords: TickCoords): void {
    const info = this._get_factor_info()

    let standoff = extents.tick + this.model.major_label_standoff
    for (let i = 0; i < info.length; i++) {
      const [labels, coords, orient, visuals] = info[i]
      this._draw_oriented_labels(ctx, labels, coords, orient, standoff, visuals)
      standoff += extents.tick_labels[i]
    }
  }

  protected override _tick_label_extents(): number[] {
    const info = this._get_factor_info()

    const extents = []
    for (const [labels,, orient, visuals] of info) {
      const extent = this._oriented_labels_extent(labels, orient, this.model.major_label_standoff, visuals)
      extents.push(extent)
    }

    return extents
  }

  protected _get_factor_info(): [GraphicsBoxes, Coords, Orient | number, visuals.Text][] {
    const [range] = this.ranges
    const [start, end] = this.computed_bounds
    const loc = this.loc

    const ticks = this.model.ticker.get_ticks(start, end, range, loc)
    const coords = this.tick_coords

    const info: [GraphicsBoxes, Coords, Orient | number, visuals.Text][] = []

    const map = (labels: (string | GraphicsBox)[]) => {
      return new GraphicsBoxes(labels.map((label) => isString(label) ? new TextBox({text: label}) : label))
    }

    const format = (ticks: L1Factor[]) => {
      return map(this.model.formatter.doFormat(ticks, this))
    }

    switch (range.mapper.levels) {
      case 1: {
        const major = ticks.major as L1Factor[]
        const labels = format(major)
        info.push([labels, coords.major, this.model.major_label_orientation, this.visuals.major_label_text])
        break
      }
      case 2: {
        const major = (ticks.major as L2Factor[]).map((x) => x[1])
        const labels = format(major)
        info.push([labels, coords.major, this.model.major_label_orientation, this.visuals.major_label_text])
        info.push([map(ticks.tops as L1Factor[]), coords.tops, this.model.group_label_orientation, this.visuals.group_text])
        break
      }
      case 3: {
        const major = (ticks.major as L3Factor[]).map((x) => x[2])
        const labels = format(major)
        const mid_labels = ticks.mids.map((x) => x[1])
        info.push([labels, coords.major, this.model.major_label_orientation, this.visuals.major_label_text])
        info.push([map(mid_labels), coords.mids, this.model.subgroup_label_orientation, this.visuals.subgroup_text])
        info.push([map(ticks.tops as L1Factor[]), coords.tops, this.model.group_label_orientation, this.visuals.group_text])
        break
      }
    }

    return info
  }

  override get tick_coords(): CategoricalTickCoords {
    const i = this.dimension
    const j = 1 - i
    const [range] = this.ranges
    const [start, end] = this.computed_bounds

    const ticks = this.model.ticker.get_ticks(start, end, range, this.loc)

    const coords: CategoricalTickCoords = {
      major: [[], []],
      mids:  [[], []],
      tops:  [[], []],
      minor: [[], []],
    }

    coords.major[i] = ticks.major as any
    coords.major[j] = ticks.major.map(() => this.loc)

    const {levels} = range.mapper
    if (levels == 3) {
      coords.mids[i] = ticks.mids as any
      coords.mids[j] = ticks.mids.map(() => this.loc)
    }

    if (levels > 1) {
      coords.tops[i] = ticks.tops as any
      coords.tops[j] = ticks.tops.map(() => this.loc)
    }

    return coords
  }
}

export namespace CategoricalAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Axis.Props & {
    ticker: p.Property<CategoricalTicker>
    formatter: p.Property<CategoricalTickFormatter>
    group_label_orientation: p.Property<LabelOrientation | number>
    subgroup_label_orientation: p.Property<LabelOrientation | number>
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
  declare properties: CategoricalAxis.Props
  declare __view_type__: CategoricalAxisView

  declare ticker: CategoricalTicker
  declare formatter: CategoricalTickFormatter

  constructor(attrs?: Partial<CategoricalAxis.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CategoricalAxisView

    this.mixins<CategoricalAxis.Mixins>([
      ["separator_", mixins.Line],
      ["group_",     mixins.Text],
      ["subgroup_",  mixins.Text],
    ])

    this.define<CategoricalAxis.Props>(({Float, Or}) => ({
      group_label_orientation:    [ Or(LabelOrientation, Float), "parallel" ],
      subgroup_label_orientation: [ Or(LabelOrientation, Float), "parallel" ],
    }))

    this.override<CategoricalAxis.Props>({
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
