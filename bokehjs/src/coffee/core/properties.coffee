_ = require "underscore"
Backbone = require "backbone"

enums = require "./enums"
HasProps = require "./has_props"
svg_colors = require "./util/svg_colors"

#
# Property base class
#

class Property extends Backbone.Model

  specifiers: ['field', 'value']

  initialize: (attrs, options) ->
    super(attrs, options)

    @_init(false)

    obj = @get('obj')
    attr = @get('attr')

    # TODO (bev) Quick fix, see https://github.com/bokeh/bokeh/pull/2684
    @listenTo(obj, "change:#{attr}", () ->
      @_init()
      obj.trigger("propchange")
    )
    @listenTo(@, "change:obj", () ->
      throw new Error("attempted to reset 'obj' on Property")
    )
    @listenTo(@, "change:attr", () ->
      throw new Error("attempted to reset 'attr' on Property")
    )


  # ----- customizable policies

  init: () ->

  transform: (values) -> values

  validate: (value) ->

  # ----- property accessors

  value: () ->
    if _.isUndefined(@spec.value)
      throw new Error("attempted to retrieve property value for property without value specification")
    return @transform([@spec.value])[0]

  array: (source) ->
    data = source.get('data')
    if @spec.field? and (@spec.field of data)
      return @transform(source.get_column(@spec.field))
    else
      length = source.get_length()
      length = 1 if not length?
      value = @value() # already transformed
      return (value for i in [0...length])

  # array: (source) ->
  #   if @spec.value?
  #     value = @transform([@spec.value])[0]
  #     return (i) -> value

  #   data = source.get('data')
  #   field = @spec.field
  #   if field of data
  #     transformed = @transform(source.get_column(field))
  #     return (i) -> transformed[i]
  #   throw new Error("field '#{field}' does not exist on source")

  # ----- private methods

  _init: (trigger=true) ->
    obj = @get('obj')
    if not obj?
      throw new Error("missing property object")
    if obj not instanceof HasProps
      throw new Error("property object must be a HasProps")

    attr = @get('attr')
    if not attr?
      throw new Error("missing property attr")

    attr_value = obj.get(attr)

    if _.isUndefined(attr_value)
      if _.isUndefined(@get('default_value'))
        attr_value = null
      else
        attr_value = @get('default_value')
      obj.set(attr, attr_value, {silent: true})

    if _.isObject(attr_value) and not _.isArray(attr_value)
      @spec = attr_value
      if _.size(_.pick.apply(null, [@spec].concat(@specifiers))) != 1
        throw new Error("Invalid property specifier #{JSON.stringify(@spec)}, must have exactly one of #{@specifiers}")

    else
      @spec = {value: attr_value}

    if @spec.field? and not _.isString(@spec.field)
      throw new Error("field value for property '#{attr}' is not a string")

    if @spec.value?
      @validate(@spec.value)

    @init()

    if trigger
      @trigger("change")

#
# Helper functions
#

_valid_rgb = (value) ->
  switch value.substring(0, 4)
      when "rgba" then params = {start: "rgba(", len: 4, alpha: true}
      when "rgb(" then params = {start: "rgb(", len: 3, alpha: false}
      else return false

  # if '.' and then ',' found, we know decimals are used on rgb
  if new RegExp(".*?(\\.).*(,)").test(value)
    throw new Error("color expects integers for rgb in rgb/rgba tuple, received #{value}")

  # extract the numerical values from inside parens
  contents = value.replace(params.start, "").replace(")", "").split(',').map(parseFloat)

  # check length of array based on rgb/rgba
  if contents.length != params.len
    throw new Error("color expects rgba #{expect_len}-tuple, received #{value}")

  # check for valid numerical values for rgba
  if params.alpha and !(0 <= contents[3] <= 1)
    throw new Error("color expects rgba 4-tuple to have alpha value between 0 and 1")
  if false in (0 <= rgb <= 255 for rgb in contents.slice(0, 3))
    throw new Error("color expects rgb to have value between 0 and 255")
  return true

#
# Simple Properties
#

simple_prop = (name, pred) ->
  class Prop extends Property
    toString: () -> "#{name}(obj: #{@get(obj).id}, spec: #{JSON.stringify(@spec)})"
    validate: (value) ->
      if not pred(value)
        attr = @get('attr')
        throw new Error("#{name} property '#{attr}' given invalid value: #{value}")

class Array extends simple_prop("Array", (x) -> _.isArray(x) or x instanceof Float64Array)

class Bool extends simple_prop("Bool", _.isBoolean)

class Color extends simple_prop("Color", (x) ->
  svg_colors[x.toLowerCase()]? or x.substring(0, 1) == "#" or _valid_rgb(x)
)

class Coord extends simple_prop("Coord", (x) -> _.isNumber(x) or _.isString(x))

class Number extends simple_prop("Number", _.isNumber)

class String extends simple_prop("String", _.isString)

#
# Enum properties
#

enum_prop = (name, enum_values) ->
  class Enum extends simple_prop(name, (x) -> x in enum_values)
    toString: () -> "#{name}(obj: #{@get(obj).id}, spec: #{JSON.stringify(@spec)})"

class Direction extends enum_prop("Direction", enums.Direction)
  transform: (values) ->
    result = new Uint8Array(values.length)
    for i in [0...values.length]
      switch values[i]
        when 'clock'     then result[i] = false
        when 'anticlock' then result[i] = true
    return result

class FontStyle extends enum_prop("FontStyle", enums.FontStyle)

class LineCap extends enum_prop("LineCap", enums.LineCap)

class LineJoin extends enum_prop("LineJoin", enums.LineJoin)

class TextAlign extends enum_prop("TextAlign", enums.TextAlign)

class TextBaseline extends enum_prop("TextBaseline", enums.TextBaseline)

#
# Units Properties
#

units_prop = (name, valid_units, default_units) ->
  class UnitsProp extends Number
    toString: () -> "#{name}(obj: #{@get(obj).id}, spec: #{JSON.stringify(@spec)})"
    init: () ->
      if not @spec.units?
        @spec.units = default_units

      # TODO (bev) remove this later, it's just for temporary compat
      @units = @spec.units

      units = @spec.units
      if units not in valid_units
        throw new Error("#{name} units must be one of #{valid_units}, given invalid value: #{units}")

class Angle extends units_prop("Angle", enums.AngleUnits, "rad")
  transform: (values) ->
    if @spec.units == "deg"
      values = (x * Math.PI/180.0 for x in values)
    values = (-x for x in values)
    return super(values)

class Distance extends units_prop("Distance", enums.SpatialUnits, "data")


module.exports =
  Property: Property

  simple_prop: simple_prop
  enum_prop: enum_prop
  units_prop: units_prop

  Angle: Angle
  Array: Array
  Bool: Bool
  Color: Color
  Coord: Coord
  Direction: Direction
  Distance: Distance
  FontStyle: FontStyle
  LineCap: LineCap
  LineJoin: LineJoin
  Number: Number
  String: String
  TextAlign: TextAlign
  TextBaseline: TextBaseline

