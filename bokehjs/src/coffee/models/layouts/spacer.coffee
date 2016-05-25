LayoutDOM = require "./layout_dom"


class Spacer extends LayoutDOM.Model
  type: 'Spacer'
  default_view: LayoutDOM.View

module.exports =
  Model: Spacer
