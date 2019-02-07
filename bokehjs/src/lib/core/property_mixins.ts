import * as p from "./properties"
import {Color} from "./types"
import {extend} from "./util/object"
import {LineJoin, LineCap, FontStyle, TextAlign, TextBaseline} from "./enums"

export type Line = {
  line_color: p.Property<Color | null>
  line_alpha: p.Property<number>
  line_width: p.Property<number>
  line_join: p.Property<LineJoin>
  line_cap: p.Property<LineCap>
  line_dash: p.Property<number[]>
  line_dash_offset: p.Property<number>
}

export type Fill = {
  fill_color: p.Property<Color | null>
  fill_alpha: p.Property<number>
}

export type Text = {
  text_color: p.Property<Color | null>
  text_alpha: p.Property<number>
  text_font: p.Property<string>
  text_font_size: p.Property<string>
  text_font_style: p.Property<FontStyle>
  text_align: p.Property<TextAlign>
  text_baseline: p.Property<TextBaseline>
  text_line_height: p.Property<number>
}

export type LineScalar = {
  line_color: p.ScalarSpec<Color | null>
  line_alpha: p.ScalarSpec<number>
  line_width: p.ScalarSpec<number>
  line_join: p.ScalarSpec<LineJoin>
  line_cap: p.ScalarSpec<LineCap>
  line_dash: p.ScalarSpec<number[]>
  line_dash_offset: p.ScalarSpec<number>
}

export type FillScalar = {
  fill_color: p.ScalarSpec<Color | null>
  fill_alpha: p.ScalarSpec<number>
}

export type TextScalar = {
  text_color: p.ScalarSpec<Color | null>
  text_alpha: p.ScalarSpec<number>
  text_font: p.ScalarSpec<string>
  text_font_size: p.ScalarSpec<string>
  text_font_style: p.ScalarSpec<FontStyle>
  text_align: p.ScalarSpec<TextAlign>
  text_baseline: p.ScalarSpec<TextBaseline>
  text_line_height: p.ScalarSpec<number>
}

export type LineVector = {
  line_color: p.VectorSpec<Color | null>
  line_alpha: p.VectorSpec<number>
  line_width: p.VectorSpec<number>
  line_join: p.ScalarSpec<LineJoin>
  line_cap: p.ScalarSpec<LineCap>
  line_dash: p.ScalarSpec<number[]>
  line_dash_offset: p.ScalarSpec<number>
}

export type FillVector = {
  fill_color: p.VectorSpec<Color | null>
  fill_alpha: p.VectorSpec<number>
}

export type TextVector = {
  text_color: p.VectorSpec<Color | null>
  text_alpha: p.VectorSpec<number>
  text_font: p.ScalarSpec<string>
  text_font_size: p.VectorSpec<string>
  text_font_style: p.ScalarSpec<FontStyle>
  text_align: p.ScalarSpec<TextAlign>
  text_baseline: p.ScalarSpec<TextBaseline>
  text_line_height: p.ScalarSpec<number>
}

function _gen_mixin(mixin: {[key: string]: any}, prefix: string) {
  const result: {[key: string]: any} = {}
  for (const name in mixin) {
    const prop = mixin[name]
    result[prefix + name] = prop
  }
  return result
}

const _line_mixin = {
  line_color:       [ p.ColorSpec,  'black'   ],
  line_width:       [ p.NumberSpec, 1         ],
  line_alpha:       [ p.NumberSpec, 1.0       ],
  line_join:        [ p.LineJoin,   'bevel'   ],
  line_cap:         [ p.LineCap,    'butt'    ],
  line_dash:        [ p.Array,      []        ],
  line_dash_offset: [ p.Number,     0         ],
}

export const line = (prefix: string = "") => _gen_mixin(_line_mixin, prefix)

const _fill_mixin = {
  fill_color: [ p.ColorSpec,  'gray' ],
  fill_alpha: [ p.NumberSpec, 1.0    ],
}

export const fill = (prefix: string = "") => _gen_mixin(_fill_mixin, prefix)

const _text_mixin = {
  text_font:        [ p.Font,         'helvetica' ],
  text_font_size:   [ p.FontSizeSpec, '12pt'      ],
  text_font_style:  [ p.FontStyle,    'normal'    ],
  text_color:       [ p.ColorSpec,    '#444444'   ],
  text_alpha:       [ p.NumberSpec,   1.0         ],
  text_align:       [ p.TextAlign,    'left'      ],
  text_baseline:    [ p.TextBaseline, 'bottom'    ],
  text_line_height: [ p.Number,       1.2         ],
}

export const text = (prefix: string = "") => _gen_mixin(_text_mixin, prefix)

export function create(configs: string[]) {
  const result: {[key: string]: any} = {}

  for (const config of configs) {
    const [kind, prefix] = config.split(":")
    let mixin: any
    switch (kind) {
      case "line": mixin = line; break
      case "fill": mixin = fill; break
      case "text": mixin = text; break
      default:
        throw new Error(`Unknown property mixin kind '${kind}'`)
    }
    extend(result, mixin(prefix))
  }

  return result
}

// Common property mixins used in models. This duplication is currently unavoidable.
// Remove this when https://github.com/Microsoft/TypeScript/issues/12754 is fixed.

export type LabelText = {
  label_text_color: Text["text_color"]
  label_text_alpha: Text["text_alpha"]
  label_text_font: Text["text_font"]
  label_text_font_size: Text["text_font_size"]
  label_text_font_style: Text["text_font_style"]
  label_text_align: Text["text_align"]
  label_text_baseline: Text["text_baseline"]
  label_text_line_height: Text["text_line_height"]
}

export type InactiveFill = {
  inactive_fill_color: Fill["fill_color"]
  inactive_fill_alpha: Fill["fill_alpha"]
}

export type BorderLine = {
  border_line_color: Line["line_color"]
  border_line_alpha: Line["line_alpha"]
  border_line_width: Line["line_width"]
  border_line_join: Line["line_join"]
  border_line_cap: Line["line_cap"]
  border_line_dash: Line["line_dash"]
  border_line_dash_offset: Line["line_dash_offset"]
}

export type BackgroundFill = {
  background_fill_color: Fill["fill_color"]
  background_fill_alpha: Fill["fill_alpha"]
}

export type MajorLabelText = {
  major_label_text_color: Text["text_color"]
  major_label_text_alpha: Text["text_alpha"]
  major_label_text_font: Text["text_font"]
  major_label_text_font_size: Text["text_font_size"]
  major_label_text_font_style: Text["text_font_style"]
  major_label_text_align: Text["text_align"]
  major_label_text_baseline: Text["text_baseline"]
  major_label_text_line_height: Text["text_line_height"]
}

export type TitleText = {
  title_text_color: Text["text_color"]
  title_text_alpha: Text["text_alpha"]
  title_text_font: Text["text_font"]
  title_text_font_size: Text["text_font_size"]
  title_text_font_style: Text["text_font_style"]
  title_text_align: Text["text_align"]
  title_text_baseline: Text["text_baseline"]
  title_text_line_height: Text["text_line_height"]
}

export type MajorTickLine = {
  major_tick_line_color: Line["line_color"]
  major_tick_line_alpha: Line["line_alpha"]
  major_tick_line_width: Line["line_width"]
  major_tick_line_join: Line["line_join"]
  major_tick_line_cap: Line["line_cap"]
  major_tick_line_dash: Line["line_dash"]
  major_tick_line_dash_offset: Line["line_dash_offset"]
}

export type MinorTickLine = {
  minor_tick_line_color: Line["line_color"]
  minor_tick_line_alpha: Line["line_alpha"]
  minor_tick_line_width: Line["line_width"]
  minor_tick_line_join: Line["line_join"]
  minor_tick_line_cap: Line["line_cap"]
  minor_tick_line_dash: Line["line_dash"]
  minor_tick_line_dash_offset: Line["line_dash_offset"]
}

export type BarLine = {
  bar_line_color: Line["line_color"]
  bar_line_alpha: Line["line_alpha"]
  bar_line_width: Line["line_width"]
  bar_line_join: Line["line_join"]
  bar_line_cap: Line["line_cap"]
  bar_line_dash: Line["line_dash"]
  bar_line_dash_offset: Line["line_dash_offset"]
}

export type AxisLine = {
  axis_line_color: Line["line_color"]
  axis_line_alpha: Line["line_alpha"]
  axis_line_width: Line["line_width"]
  axis_line_join: Line["line_join"]
  axis_line_cap: Line["line_cap"]
  axis_line_dash: Line["line_dash"]
  axis_line_dash_offset: Line["line_dash_offset"]
}

export type AxisLabelText = {
  axis_label_text_color: Text["text_color"]
  axis_label_text_alpha: Text["text_alpha"]
  axis_label_text_font: Text["text_font"]
  axis_label_text_font_size: Text["text_font_size"]
  axis_label_text_font_style: Text["text_font_style"]
  axis_label_text_align: Text["text_align"]
  axis_label_text_baseline: Text["text_baseline"]
  axis_label_text_line_height: Text["text_line_height"]
}

export type GridLine = {
  grid_line_color: Line["line_color"]
  grid_line_alpha: Line["line_alpha"]
  grid_line_width: Line["line_width"]
  grid_line_join: Line["line_join"]
  grid_line_cap: Line["line_cap"]
  grid_line_dash: Line["line_dash"]
  grid_line_dash_offset: Line["line_dash_offset"]
}

export type MinorGridLine = {
  minor_grid_line_color: Line["line_color"]
  minor_grid_line_alpha: Line["line_alpha"]
  minor_grid_line_width: Line["line_width"]
  minor_grid_line_join: Line["line_join"]
  minor_grid_line_cap: Line["line_cap"]
  minor_grid_line_dash: Line["line_dash"]
  minor_grid_line_dash_offset: Line["line_dash_offset"]
}

export type BandFill = {
  band_fill_color: Fill["fill_color"]
  band_fill_alpha: Fill["fill_alpha"]
}

export type OutlineLine = {
  outline_line_color: Line["line_color"]
  outline_line_alpha: Line["line_alpha"]
  outline_line_width: Line["line_width"]
  outline_line_join: Line["line_join"]
  outline_line_cap: Line["line_cap"]
  outline_line_dash: Line["line_dash"]
  outline_line_dash_offset: Line["line_dash_offset"]
}

export type BorderFill = {
  border_fill_color: Fill["fill_color"]
  border_fill_alpha: Fill["fill_alpha"]
}

export type SeparatorLine = {
  separator_line_color: Line["line_color"]
  separator_line_alpha: Line["line_alpha"]
  separator_line_width: Line["line_width"]
  separator_line_join: Line["line_join"]
  separator_line_cap: Line["line_cap"]
  separator_line_dash: Line["line_dash"]
  separator_line_dash_offset: Line["line_dash_offset"]
}

export type GroupText = {
  group_text_color: Text["text_color"]
  group_text_alpha: Text["text_alpha"]
  group_text_font: Text["text_font"]
  group_text_font_size: Text["text_font_size"]
  group_text_font_style: Text["text_font_style"]
  group_text_align: Text["text_align"]
  group_text_baseline: Text["text_baseline"]
  group_text_line_height: Text["text_line_height"]
}

export type SubGroupText = {
  subgroup_text_color: Text["text_color"]
  subgroup_text_alpha: Text["text_alpha"]
  subgroup_text_font: Text["text_font"]
  subgroup_text_font_size: Text["text_font_size"]
  subgroup_text_font_style: Text["text_font_style"]
  subgroup_text_align: Text["text_align"]
  subgroup_text_baseline: Text["text_baseline"]
  subgroup_text_line_height: Text["text_line_height"]
}
