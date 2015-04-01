HasProperties = require "../common/has_properties"

class Transform extends HasProperties

class AutoEncode extends Transform
  type: "AutoEncode"

class BinarySegment extends Transform
  type: "BinarySegment"

class Const extends Transform
  type: "Const"

class Contour extends Transform
  type: "Contour"

class Count extends Transform
  type: "Count"

class CountCategories extends Transform
  type: "CountCategories"

class Cuberoot extends Transform
  type: "Cuberoot"

class Encode extends Transform
  type: "Encode"

class HDAlpha extends Transform
  type: "HDAlpha"

class Id extends Transform
  type: "Id"

class Interpolate extends Transform
  type: "Interpolate"

class InterpolateColor extends Transform
  type: "InterpolateColor"

class Log extends Transform
  type: "Log"

class NonZero extends Transform
  type: "NonZero"

class Ratio extends Transform
  type: "Ratio"

class Seq extends Transform
  type: "Seq"

class Spread extends Transform
  type: "Spread"

class ToCounts extends Transform
  type: "ToCounts"

module.exports =

  AutoEncode:
    Model: AutoEncode

  BinarySegment:
    Model: BinarySegment

  Const:
    Model: Const

  Contour:
    Model: Contour

  Count:
    Model: Count

  CountCategories:
    Model: CountCategories

  Cuberoot:
    Model: Cuberoot

  Encode:
    Model: Encode

  HDAlpha:
    Model: HDAlpha

  Id:
    Model: Id

  Interpolate:
    Model: Interpolate

  InterpolateColor:
    Model: InterpolateColor

  Log:
    Model: Log

  NonZero:
    Model: NonZero

  Ratio:
    Model: Ratio

  Seq:
    Model: Seq

  Spread:
    Model: Spread

  ToCounts:
    Model: ToCounts