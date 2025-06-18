import {Annotation, AnnotationView} from "./annotation"
import {LabelOverrides} from "../axes/axis"
import {Ticker} from "../tickers/ticker"
import {TickFormatter} from "../formatters/tick_formatter"
import {LabelingPolicy, NoOverlap} from "../policies/labeling"
import {BaseText} from "../text/base_text"
import {Anchor, Orientation} from "core/enums"
import type * as visuals from "core/visuals"
import * as mixins from "core/property_mixins"
import type * as p from "core/properties"

export abstract class BaseBarView extends AnnotationView {
  declare model: BaseBar
  declare visuals: BaseBar.Visuals
}

export namespace BaseBar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    location: p.Property<Anchor | [number, number]>
    orientation: p.Property<Orientation | "auto">
    title: p.Property<string | BaseText | null>
    title_standoff: p.Property<number>
    width: p.Property<number | "auto">
    height: p.Property<number | "auto">
    ticker: p.Property<Ticker | "auto">
    formatter: p.Property<TickFormatter | "auto">
    major_label_overrides: p.Property<LabelOverrides>
    major_label_policy: p.Property<LabelingPolicy>
    label_standoff: p.Property<number>
    margin: p.Property<number>
    padding: p.Property<number>
    major_tick_in: p.Property<number>
    major_tick_out: p.Property<number>
    minor_tick_in: p.Property<number>
    minor_tick_out: p.Property<number>
  } & Mixins

  export type Mixins =
    mixins.MajorLabelText &
    mixins.TitleText      &
    mixins.MajorTickLine  &
    mixins.MinorTickLine  &
    mixins.BorderLine     &
    mixins.BarLine        &
    mixins.BackgroundFill &
    mixins.BackgroundHatch

  export type Visuals = Annotation.Visuals & {
    major_label_text: visuals.Text
    title_text: visuals.Text
    major_tick_line: visuals.Line
    minor_tick_line: visuals.Line
    border_line: visuals.Line
    bar_line: visuals.Line
    background_fill: visuals.Fill
    background_hatch: visuals.Hatch
  }
}

export interface BaseBar extends BaseBar.Attrs {}

export abstract class BaseBar extends Annotation {
  declare properties: BaseBar.Props
  declare __view_type__: BaseBarView

  constructor(attrs?: Partial<BaseBar.Attrs>) {
    super(attrs)
  }

  static {
    this.mixins<BaseBar.Mixins>([
      ["major_label_", mixins.Text],
      ["title_",       mixins.Text],
      ["major_tick_",  mixins.Line],
      ["minor_tick_",  mixins.Line],
      ["border_",      mixins.Line],
      ["bar_",         mixins.Line],
      ["background_",  mixins.Fill],
      ["background_",  mixins.Hatch],
    ])

    this.define<BaseBar.Props>(({Float, Str, Tuple, Or, Ref, Auto, Nullable}) => ({
      location:              [ Or(Anchor, Tuple(Float, Float)), "top_right" ],
      orientation:           [ Or(Orientation, Auto), "auto" ],
      title:                 [ Nullable(Or(Str, Ref(BaseText))), null ],
      title_standoff:        [ Float, 2 ],
      width:                 [ Or(Float, Auto), "auto" ],
      height:                [ Or(Float, Auto), "auto" ],
      ticker:                [ Or(Ref(Ticker), Auto), "auto" ],
      formatter:             [ Or(Ref(TickFormatter), Auto), "auto" ],
      major_label_overrides: [ LabelOverrides, new Map() ],
      major_label_policy:    [ Ref(LabelingPolicy), () => new NoOverlap() ],
      label_standoff:        [ Float, 5 ],
      margin:                [ Float, 30 ],
      padding:               [ Float, 10 ],
      major_tick_in:         [ Float, 5 ],
      major_tick_out:        [ Float, 0 ],
      minor_tick_in:         [ Float, 0 ],
      minor_tick_out:        [ Float, 0 ],
    }))

    this.override<BaseBar.Props>({
      background_fill_color: "#ffffff",
      background_fill_alpha: 0.95,
      bar_line_color: null,
      border_line_color: null,
      major_label_text_font_size: "11px",
      major_tick_line_color: "#ffffff",
      minor_tick_line_color: null,
      title_text_font_size: "13px",
      title_text_font_style: "italic",
    })
  }
}
