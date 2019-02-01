import * as p from "./properties"
import {Color} from "./types"
import {extend} from "./util/object"

import {LineJoin, LineCap, FontStyle, TextAlign, TextBaseline} from "core/enums"

export interface LineScalar {
  line_color: p.ScalarSpec<Color | null>
  line_alpha: p.ScalarSpec<number>
  line_width: p.ScalarSpec<number>
  line_join: p.ScalarSpec<LineJoin>
  line_cap: p.ScalarSpec<LineCap>
  line_dash: p.ScalarSpec<number[]>
  line_dash_offset: p.ScalarSpec<number>
}

export interface FillScalar {
  fill_color: p.ScalarSpec<Color | null>
  fill_alpha: p.ScalarSpec<number>
}

export interface TextScalar {
  text_color: p.ScalarSpec<Color | null>
  text_alpha: p.ScalarSpec<number>
  text_font: p.ScalarSpec<string>
  text_font_size: p.ScalarSpec<string>
  text_font_style: p.ScalarSpec<FontStyle>
  text_align: p.ScalarSpec<TextAlign>
  text_baseline: p.ScalarSpec<TextBaseline>
  text_line_height: p.ScalarSpec<number>
}

export interface LineVector {
  line_color: p.ColorSpec
  line_alpha: p.NumberSpec
  line_width: p.NumberSpec
  line_join: p.ScalarSpec<LineJoin>
  line_cap: p.ScalarSpec<LineCap>
  line_dash: p.ScalarSpec<number[]>
  line_dash_offset: p.ScalarSpec<number>
}

export interface FillVector {
  fill_color: p.ColorSpec
  fill_alpha: p.NumberSpec
}

export interface TextVector {
  text_color: p.ColorSpec
  text_alpha: p.NumberSpec
  text_font: p.ScalarSpec<string>
  text_font_size: p.StringSpec
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
