_ = require "underscore"
$ = require "jquery"
$1 = require "bootstrap/button"

Widget = require "./widget"
BokehView = require "../../core/bokeh_view"
p = require "../../core/properties"

class CheckboxButtonGroupView extends BokehView
  tagName: "div"
  events:
    "change input": "change_input"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    @$el.empty()

    @$el.addClass("bk-bs-btn-group")
    @$el.attr("data-bk-bs-toggle", "buttons")

    active = @mget("active")
    for label, i in @mget("labels")
      $input = $('<input type="checkbox">').attr(value: "#{i}")
      if i in active then $input.prop("checked", true)
      $label = $('<label class="bk-bs-btn"></label>')
      $label.text(label).prepend($input)
      $label.addClass("bk-bs-btn-" + @mget("button_type"))
      if i in active then $label.addClass("bk-bs-active")
      @$el.append($label)

    return @

  change_input: () ->
    active = (i for checkbox, i in @$("input") when checkbox.checked)
    @mset('active', active)
    @mget('callback')?.execute(@model)

class CheckboxButtonGroup extends Widget.Model
  type: "CheckboxButtonGroup"
  default_view: CheckboxButtonGroupView

  @define {
      active:      [ p.Array,  []        ]
      labels:      [ p.Array,  []        ]
      button_type: [ p.String, "default" ]
    }

module.exports =
  Model: CheckboxButtonGroup
  View: CheckboxButtonGroupView
