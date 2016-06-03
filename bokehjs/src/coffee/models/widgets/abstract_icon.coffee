_ = require "underscore"
Widget = require "./widget"

class AbstractIcon extends Widget.Model
  type: "AbstractIcon"

module.exports =
  Model: AbstractIcon
