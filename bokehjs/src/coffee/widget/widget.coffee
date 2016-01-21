Component = require "../models/component"

class Widget extends Component.Model
  type: "Widget"

module.exports =
  Model: Widget