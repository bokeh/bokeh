_ = require "underscore"

p = require "./properties"

_gen_mixin = (mixin, prefix) ->
  result = {}
  prefix ?= ""
  for name, type of mixin
    result[prefix+name] = type
  return result

_line_mixin =
  line_color:       [ p.ColorSpec,  'black'   ]
  line_width:       [ p.NumberSpec, 1         ]
  line_alpha:       [ p.NumberSpec, 1.0       ]
  line_join:        [ p.LineJoin,   'miter'   ]
  line_cap:         [ p.LineCap,    'butt'    ]
  line_dash:        [ p.Array,      []        ]
  line_dash_offset: [ p.Number,     0         ]

line = (prefix) -> _gen_mixin(_line_mixin, prefix)

_fill_mixin =
  fill_color: [ p.ColorSpec,  'gray' ]
  fill_alpha: [ p.NumberSpec, 1.0    ]

fill = (prefix) -> _gen_mixin(_fill_mixin, prefix)

_text_mixin =
  text_font:       [ p.Font,         'helvetica' ]
  text_font_size:  [ p.FontSizeSpec, '12pt'      ]
  text_font_style: [ p.FontStyle,    'normal'    ]
  text_color:      [ p.ColorSpec,    '#444444'   ]
  text_alpha:      [ p.NumberSpec,   1.0         ]
  text_align:      [ p.TextAlign,    'left'      ]
  text_baseline:   [ p.TextBaseline, 'bottom'    ]

text = (prefix) -> _gen_mixin(_text_mixin, prefix)

create = (configs) ->
  result = {}
  for config in configs
    [kind, prefix] = config.split(":")
    if not @[kind]?
      throw Error("Unknown property mixin kind '#{kind}'")
    result = _.extend result, @[kind](prefix)
  return result

module.exports =
  line: line
  fill: fill
  text: text

  create: create
