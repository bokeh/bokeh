import * as _ from "underscore"
Widget = require "./widget"

class AbstractIcon extends Widget.Model
  type: "AbstractIcon"

module.exports =
  Model: AbstractIcon
