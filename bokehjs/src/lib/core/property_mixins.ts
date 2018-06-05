import * as p from "./properties"
import {Color} from "./types"
import {extend} from "./util/object"

import {Scalar, NumberSpec, StringSpec, ColorSpec} from "core/vectorization"
import {LineJoin, LineCap, FontStyle, TextAlign, TextBaseline} from "core/enums"

export interface LineMixinScalar {
  line_color: Scalar<Color>
  line_width: Scalar<number>
  line_alpha: Scalar<number>
  line_join: Scalar<LineJoin>
  line_cap: Scalar<LineCap>
  line_dash: Scalar<number[]>
  line_dash_offset: Scalar<number>
}

export interface FillMixinScalar {
  fill_color: Scalar<Color>
  fill_alpha: Scalar<number>
}

export interface TextMixinScalar {
  text_font: Scalar<string>
  text_font_size: Scalar<string>
  text_font_style: Scalar<FontStyle>
  text_color: Scalar<Color>
  text_alpha: Scalar<number>
  text_align: Scalar<TextAlign>
  text_baseline: Scalar<TextBaseline>
  text_line_height: Scalar<number>
}

export interface LineMixinVector {
  line_color: ColorSpec
  line_width: NumberSpec
  line_alpha: NumberSpec
  line_join: Scalar<LineJoin>
  line_cap: Scalar<LineCap>
  line_dash: Scalar<number[]>
  line_dash_offset: Scalar<number>
}

export interface FillMixinVector {
  fill_color: ColorSpec
  fill_alpha: NumberSpec
}

export interface TextMixinVector {
  text_font: Scalar<string>
  text_font_size: StringSpec
  text_font_style: Scalar<FontStyle>
  text_color: ColorSpec
  text_alpha: NumberSpec
  text_align: Scalar<TextAlign>
  text_baseline: Scalar<TextBaseline>
  text_line_height: Scalar<number>
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
