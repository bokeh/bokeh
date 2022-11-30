import * as p from "./properties"
import {Color} from "./types"
import {LineJoin, LineCap, LineDash, FontStyle, HatchPatternType, TextAlign, TextBaseline} from "./enums"
import * as k from "./kinds"
import {Texture} from "models/textures/texture"
import {keys} from "./util/object"
import type {HasProps} from "./has_props"

export type HatchPattern = HatchPatternType | string
export type HatchExtra = {[key: string]: Texture | undefined}

// Primitive

export type Line = {
  line_color: p.Property<Color | null>
  line_alpha: p.Property<number>
  line_width: p.Property<number>
  line_join: p.Property<LineJoin>
  line_cap: p.Property<LineCap>
  line_dash: p.Property<LineDash | number[]>
  line_dash_offset: p.Property<number>
}

export type Fill = {
  fill_color: p.Property<Color | null>
  fill_alpha: p.Property<number>
}

export type Image = {
  global_alpha: p.Property<number>
}

export type Hatch = {
  hatch_color: p.Property<Color | null>
  hatch_alpha: p.Property<number>
  hatch_scale: p.Property<number>
  hatch_pattern: p.Property<HatchPattern | null>
  hatch_weight: p.Property<number>
  hatch_extra: p.Property<HatchExtra>
}

export type Text = {
  text_color: p.Property<Color | null>
  text_outline_color: p.Property<Color | null>
  text_alpha: p.Property<number>
  text_font: p.Property<string>
  text_font_size: p.Property<string>
  text_font_style: p.Property<FontStyle>
  text_align: p.Property<TextAlign>
  text_baseline: p.Property<TextBaseline>
  text_line_height: p.Property<number>
}

export const Line: p.DefineOf<Line> = {
  line_color:       [ k.Nullable(k.Color), "black" ],
  line_alpha:       [ k.Alpha, 1.0 ],
  line_width:       [ k.Number, 1 ],
  line_join:        [ LineJoin, "bevel"],
  line_cap:         [ LineCap, "butt" ],
  line_dash:        [ k.Or(LineDash, k.Array(k.Number)), [] ],
  line_dash_offset: [ k.Number, 0 ],
}

export const Fill: p.DefineOf<Fill> = {
  fill_color:       [ k.Nullable(k.Color), "gray" ],
  fill_alpha:       [ k.Alpha, 1.0 ],
}

export const Image: p.DefineOf<Image> = {
  global_alpha:     [ k.Alpha, 1.0 ],
}

export const Hatch: p.DefineOf<Hatch> = {
  hatch_color:      [ k.Nullable(k.Color), "black" ],
  hatch_alpha:      [ k.Alpha, 1.0 ],
  hatch_scale:      [ k.Number, 12.0 ],
  hatch_pattern:    [ k.Nullable(k.Or(HatchPatternType, k.String)), null ],
  hatch_weight:     [ k.Number, 1.0 ],
  hatch_extra:      [ k.Dict(k.AnyRef<Texture>()), {} ], // XXX: recursive imports
}

export const Text: p.DefineOf<Text> = {
  text_color:         [ k.Nullable(k.Color), "#444444" ],
  text_outline_color: [ k.Nullable(k.Color), null ],
  text_alpha:         [ k.Alpha, 1.0 ],
  text_font:          [ p.Font, "helvetica" ],
  text_font_size:     [ k.FontSize, "16px" ],
  text_font_style:    [ FontStyle, "normal" ],
  text_align:         [ TextAlign, "left" ],
  text_baseline:      [ TextBaseline, "bottom" ],
  text_line_height:   [ k.Number, 1.2 ],
}

// Scalar

export type LineScalar = {
  line_color: p.ScalarSpec<Color | null>
  line_alpha: p.ScalarSpec<number>
  line_width: p.ScalarSpec<number>
  line_join: p.ScalarSpec<LineJoin>
  line_cap: p.ScalarSpec<LineCap>
  line_dash: p.ScalarSpec<LineDash | number[]>
  line_dash_offset: p.ScalarSpec<number>
}

export type FillScalar = {
  fill_color: p.ScalarSpec<Color | null>
  fill_alpha: p.ScalarSpec<number>
}

export type ImageScalar = {
  global_alpha: p.ScalarSpec<number>
}

export type HatchScalar = {
  hatch_color: p.ScalarSpec<Color | null>
  hatch_alpha: p.ScalarSpec<number>
  hatch_scale: p.ScalarSpec<number>
  hatch_pattern: p.ScalarSpec<string | null>
  hatch_weight: p.ScalarSpec<number>
  hatch_extra: p.ScalarSpec<HatchExtra>
}

export type TextScalar = {
  text_color: p.ScalarSpec<Color | null>
  text_outline_color: p.ScalarSpec<Color | null>
  text_alpha: p.ScalarSpec<number>
  text_font: p.ScalarSpec<string>
  text_font_size: p.ScalarSpec<string>
  text_font_style: p.ScalarSpec<FontStyle>
  text_align: p.ScalarSpec<TextAlign>
  text_baseline: p.ScalarSpec<TextBaseline>
  text_line_height: p.ScalarSpec<number>
}

export const LineScalar: p.DefineOf<LineScalar> = {
  line_color:       [ p.ColorScalar,        "black"     ],
  line_alpha:       [ p.NumberScalar,       1.0         ],
  line_width:       [ p.NumberScalar,       1           ],
  line_join:        [ p.LineJoinScalar,     "bevel"     ],
  line_cap:         [ p.LineCapScalar,      "butt"      ],
  line_dash:        [ p.LineDashScalar,     []          ],
  line_dash_offset: [ p.NumberScalar,       0           ],
}

export const FillScalar: p.DefineOf<FillScalar> = {
  fill_color:       [ p.ColorScalar,        "gray"      ],
  fill_alpha:       [ p.NumberScalar,       1.0         ],
}

export const ImageScalar: p.DefineOf<ImageScalar> = {
  global_alpha:       [ p.NumberScalar,       1.0         ],
}

export const HatchScalar: p.DefineOf<HatchScalar> = {
  hatch_color:      [ p.ColorScalar,        "black"     ],
  hatch_alpha:      [ p.NumberScalar,       1.0         ],
  hatch_scale:      [ p.NumberScalar,       12.0        ],
  hatch_pattern:    [ p.NullStringScalar,   null        ],
  hatch_weight:     [ p.NumberScalar,       1.0         ],
  hatch_extra:      [ p.AnyScalar,          {}          ],
}

export const TextScalar: p.DefineOf<TextScalar> = {
  text_color:         [ p.ColorScalar,        "#444444"   ],
  text_outline_color: [ p.ColorScalar,        null        ],
  text_alpha:         [ p.NumberScalar,       1.0         ],
  text_font:          [ p.FontScalar,         "helvetica" ],
  text_font_size:     [ p.FontSizeScalar,     "16px"      ],
  text_font_style:    [ p.FontStyleScalar,    "normal"    ],
  text_align:         [ p.TextAlignScalar,    "left"      ],
  text_baseline:      [ p.TextBaselineScalar, "bottom"    ],
  text_line_height:   [ p.NumberScalar,       1.2         ],
}

// Vectorized

export type LineVector = {
  line_color: p.ColorSpec
  line_alpha: p.VectorSpec<number>
  line_width: p.VectorSpec<number>
  line_join: p.VectorSpec<LineJoin>
  line_cap: p.VectorSpec<LineCap>
  line_dash: p.VectorSpec<LineDash | number[]>
  line_dash_offset: p.VectorSpec<number>
}

export type FillVector = {
  fill_color: p.ColorSpec
  fill_alpha: p.VectorSpec<number>
}

export type ImageVector = {
  global_alpha: p.VectorSpec<number>
}

export type HatchVector = {
  hatch_color: p.ColorSpec
  hatch_alpha: p.VectorSpec<number>
  hatch_scale: p.VectorSpec<number>
  hatch_pattern: p.VectorSpec<HatchPattern | null>
  hatch_weight: p.VectorSpec<number>
  hatch_extra: p.ScalarSpec<HatchExtra>
}

export type TextVector = {
  text_color: p.ColorSpec
  text_outline_color: p.ColorSpec
  text_alpha: p.VectorSpec<number>
  text_font: p.VectorSpec<string>
  text_font_size: p.VectorSpec<string>
  text_font_style: p.VectorSpec<FontStyle>
  text_align: p.VectorSpec<TextAlign>
  text_baseline: p.VectorSpec<TextBaseline>
  text_line_height: p.VectorSpec<number>
}

export const LineVector: p.DefineOf<LineVector> = {
  line_color:       [ p.ColorSpec,    "black"     ],
  line_alpha:       [ p.NumberSpec,   1.0         ],
  line_width:       [ p.NumberSpec,   1           ],
  line_join:        [ p.LineJoinSpec, "bevel" ],
  line_cap:         [ p.LineCapSpec,  "butt" ],
  line_dash:        [ p.LineDashSpec, [] ],
  line_dash_offset: [ p.NumberSpec,   0 ],
}

export const FillVector: p.DefineOf<FillVector> = {
  fill_color:       [ p.ColorSpec,      "gray"      ],
  fill_alpha:       [ p.NumberSpec,     1.0         ],
}

export const ImageVector: p.DefineOf<ImageVector> = {
  global_alpha:       [ p.NumberSpec,     1.0         ],
}

export const HatchVector: p.DefineOf<HatchVector> = {
  hatch_color:      [ p.ColorSpec,      "black"     ],
  hatch_alpha:      [ p.NumberSpec,     1.0         ],
  hatch_scale:      [ p.NumberSpec,     12.0        ],
  hatch_pattern:    [ p.NullStringSpec, null        ],
  hatch_weight:     [ p.NumberSpec,     1.0         ],
  hatch_extra:      [ p.AnyScalar,      {}          ],
}

export const TextVector: p.DefineOf<TextVector> = {
  text_color:         [ p.ColorSpec, "#444444" ],
  text_outline_color: [ p.ColorSpec, null ],
  text_alpha:         [ p.NumberSpec, 1.0 ],
  text_font:          [ p.FontSpec, "helvetica" ],
  text_font_size:     [ p.FontSizeSpec, "16px"],
  text_font_style:    [ p.FontStyleSpec, "normal" ],
  text_align:         [ p.TextAlignSpec, "left" ],
  text_baseline:      [ p.TextBaselineSpec, "bottom" ],
  text_line_height:   [ p.NumberSpec, 1.2 ],
}

export type Prefixed<P extends string, T> = {[key in keyof T & string as `${P}_${key}`]: T[key]}

export type AboveFill = Prefixed<"above", Fill>
export type AboveHatch = Prefixed<"above", Hatch>
export type BelowFill = Prefixed<"below", Fill>
export type BelowHatch = Prefixed<"below", Hatch>

export type AxisLabelText = Prefixed<"axis_label", Text>
export type AxisLine = Prefixed<"axis", Line>
export type BackgroundFill = Prefixed<"background", Fill>
export type BackgroundFillVector = Prefixed<"background", FillVector>
export type BandFill = Prefixed<"band", Fill>
export type BandHatch = Prefixed<"band", Hatch>
export type BarLine = Prefixed<"bar", Line>
export type BorderFill = Prefixed<"border", Fill>
export type BorderLine = Prefixed<"border", Line>
export type BorderLineVector = Prefixed<"border", LineVector>
export type GridLine = Prefixed<"grid", Line>
export type GroupText = Prefixed<"group", Text>
export type InactiveFill = Prefixed<"inactive", Fill>
export type LabelText = Prefixed<"label", Text>
export type MajorLabelText = Prefixed<"major_label", Text>
export type MajorTickLine = Prefixed<"major_tick", Line>
export type MinorGridLine = Prefixed<"minor_grid", Line>
export type MinorTickLine = Prefixed<"minor_tick", Line>
export type OutlineLine = Prefixed<"outline", Line>
export type SeparatorLine = Prefixed<"separator", Line>
export type SubGroupText = Prefixed<"subgroup", Text>
export type TitleText = Prefixed<"title", Text>

type Mixins = Text | Line | Fill | Hatch | Image

export function attrs_of<P extends string, T extends Mixins>(
    model: HasProps, prefix: P, mixin: p.DefineOf<T>, prefixed: boolean = false): {[key: string]: unknown} {
  const attrs: {[key: string]: unknown} = {}
  for (const attr of keys(mixin)) {
    const prefixed_attr = `${prefix}${attr}` as const
    const value = (model as any)[prefixed_attr]
    attrs[prefixed ? prefixed_attr : attr] = value
  }
  return attrs
}
