HasProperties = require "../common/has_properties"

class Transform extends HasProperties

_make_transform = (name) ->
  # Create a holder object since we need something to take the dynamic assign
  holder = {}
  holder.Model = class extends Transform
    type: name
  return holder

module.exports =

  AutoEncode: _make_transform "AutoEncode"
  BinarySegment: _make_transform "BinarySegment"
  Const: _make_transform "Const"
  Contour: _make_transform "Contour"
  Count: _make_transform "Count"
  CountCategories: _make_transform "CountCategories"
  Cuberoot: _make_transform "Cuberoot"
  Encode: _make_transform "Encode"
  HDAlpha: _make_transform "HDAlpha"
  Id: _make_transform "Id"
  Interpolate: _make_transform "Interpolate"
  InterpolateColor: _make_transform "InterpolateColor"
  Log: _make_transform "Log"
  NonZero: _make_transform "NonZero"
  Ratio: _make_transform "Ratio"
  Seq: _make_transform "Seq"
  Spread: _make_transform "Spread"
  ToCounts: _make_transform "ToCounts"