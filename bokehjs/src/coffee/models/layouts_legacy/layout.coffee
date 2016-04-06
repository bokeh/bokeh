_ = require "underscore"
Component = require "./component"

class Layout extends Component.Model
  type: "Layout"

module.exports =
  Model: Layout
