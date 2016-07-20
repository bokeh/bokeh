p = require "../../core/properties"

AbstractButton = require "./abstract_button"


class ToggleView extends AbstractButton.View

  render: () ->
    super()
    if @mget("active")
      @$el.find('button').addClass("bk-bs-active")
    else
      @$el.find('button').removeClass("bk-bs-active")
    return @

  change_input: () ->
    super()
    @mset('active', not @mget('active'))


class Toggle extends AbstractButton.Model
  type: "Toggle"
  default_view: ToggleView

  @define {
    active: [ p. Bool, false ]
  }

  @override {
    label: "Toggle"
  }

module.exports =
  Model: Toggle
  View: ToggleView
