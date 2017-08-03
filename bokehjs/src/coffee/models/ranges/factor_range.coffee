import {Range} from "./range"
import * as p from "core/properties"
import {all, sum} from "core/util/array"
import {keys} from "core/util/object"
import {isArray, isNumber, isString} from "core/util/types"

# exported for testing
export map_one_level = (factors, padding, offset=0) ->
  mapping = {}

  for f, i in factors
    if f of mapping
      throw new Error("duplicate factor or subfactor #{f}")
    mapping[f] = {value: 0.5 + i*(1+padding) + offset}

  return [mapping, (factors.length-1)*padding]

# exported for testing
export map_two_levels = (factors, outer_pad, factor_pad, offset=0) ->
  mapping = {}

  tops = {}
  tops_order = []
  for [f0, f1] in factors
    if f0 not of tops
      tops[f0] = []
      tops_order.push(f0)
    tops[f0].push(f1)

  suboffset = offset
  total_subpad = 0
  for f0 in tops_order
    n = tops[f0].length
    [submap, subpad] = map_one_level(tops[f0], factor_pad, suboffset)
    total_subpad += subpad
    subtot = sum(submap[f1].value for f1 in tops[f0])
    mapping[f0] = {value: subtot/n, mapping: submap}
    suboffset += (n + outer_pad + subpad)

  return [mapping, tops_order, (tops_order.length-1)*outer_pad + total_subpad]

# exported for testing
export map_three_levels = (factors, outer_pad, inner_pad, factor_pad, offset=0) ->
  mapping = {}

  tops = {}
  tops_order = []
  for [f0, f1, f2] in factors
    if f0 not of tops
      tops[f0] = []
      tops_order.push(f0)
    tops[f0].push([f1, f2])

  mids_order = []

  suboffset = offset
  total_subpad = 0
  for f0 in tops_order
    n = tops[f0].length
    [submap, submids_order, subpad] = map_two_levels(tops[f0], inner_pad, factor_pad, suboffset)
    for f1 in submids_order
      mids_order.push([f0, f1])
    total_subpad += subpad
    subtot = sum(submap[f1].value for [f1, f2] in tops[f0])
    mapping[f0] = {value: subtot/n, mapping: submap}
    suboffset += (n + outer_pad + subpad)

  return [mapping, tops_order, mids_order, (tops_order.length-1)*outer_pad + total_subpad]

export class FactorRange extends Range
  type: 'FactorRange'

  @define {
    factors:             [ p.Array,        []        ]
    factor_padding:      [ p.Number,       0         ]
    subgroup_padding:    [ p.Number,       0.8       ]
    group_padding:       [ p.Number,       1.4       ]
    range_padding:       [ p.Number,       0         ]
    range_padding_units: [ p.PaddingUnits, "percent" ]
    start:               [ p.Number                  ]
    end:                 [ p.Number                  ]
    bounds:              [ p.Any                     ]
    min_interval:        [ p.Any                     ]
    max_interval:        [ p.Any                     ]
  }

  @getters {
    min: () -> @start
    max: () -> @end
  }

  @internal {
    levels:      [ p.Number ] # how many levels of
    mids:        [ p.Array  ] # mid level factors (if 3 total levels)
    tops:        [ p.Array  ] # top level factors (whether 2 or 3 total levels)
    tops_groups: [ p.Array  ] # ordered list of full factors for each top level factor in tops
  }

  initialize: (attrs, options) ->
    super(attrs, options)
    @_init()
    @connect(@properties.factors.change, () -> @_init())
    @connect(@properties.factor_padding.change, () -> @_init())
    @connect(@properties.group_padding.change, () -> @_init())
    @connect(@properties.subgroup_padding.change, () -> @_init())
    @connect(@properties.range_padding.change, () -> @_init())
    @connect(@properties.range_padding_units.change, () -> @_init())

  reset: () ->
    @_init()
    @change.emit()

  # convert a string factor into a synthetic coordinate
  synthetic: (x) ->
    if isNumber(x)
      return x

    if isString(x)
      return @_lookup([x])

    offset = 0
    if isNumber(x[x.length-1])
      offset = x[x.length-1]
      x = x.slice(0,-1)

    return @_lookup(x) + offset

  # convert an array of string factors into synthetic coordinates
  v_synthetic: (xs) ->
    result = (@synthetic(x) for x in xs)

  _init: () ->

    if all(@factors, isString)
      levels = 1
      [@_mapping, inside_padding] = map_one_level(@factors, @factor_padding)

    else if all(@factors, (x) -> isArray(x) and x.length==2 and isString(x[0]) and isString(x[1]))
      levels = 2
      [@_mapping, @tops, inside_padding] = map_two_levels(@factors, @group_padding, @factor_padding)

    else if all(@factors, (x) -> isArray(x) and x.length==3  and isString(x[0]) and isString(x[1]) and isString(x[2]))
      levels = 3
      [@_mapping, @tops, @mids, inside_padding] = map_three_levels(@factors, @group_padding, @subgroup_padding, @factor_padding)

    else
      throw new Error("")

    start = 0
    end = @factors.length + inside_padding

    if @range_padding_units == "percent"
      half_span = (end - start) * @range_padding / 2
      start -= half_span
      end += half_span
    else
      start -= @range_padding
      end += @range_padding

    @setv({start: start, end: end, levels: levels}, {silent: true})

    if @bounds == 'auto'
      @setv({bounds: [start, end]}, {silent: true})

  _lookup: (x) ->
    if x.length == 1
      return @_mapping[x[0]].value

    else if x.length == 2
      return @_mapping[x[0]].mapping[x[1]].value

    else if x.length == 3
      return @_mapping[x[0]].mapping[x[1]].mapping[x[2]].value
