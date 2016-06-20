_ = require "underscore"
$ = require "jquery"
$1 = require "bootstrap/button"

p = require "../../core/properties"

Widget = require "./widget"


class RadioButtonGroupView extends Widget.View
  tagName: "div"
  events:
    "change input": "change_input"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    super()
    @$el.empty()

    @$el.addClass("bk-bs-btn-group")
    @$el.attr("data-bk-bs-toggle", "buttons")

    name = _.uniqueId("RadioButtonGroup")
    active = @mget("active")
    for label, i in @mget("labels")
      $input = $('<input type="radio">').attr(name: name, value: "#{i}")
      if i == active then $input.prop("checked", true)
      $label = $('<label class="bk-bs-btn"></label>')
      $label.text(label).prepend($input)
      $label.addClass("bk-bs-btn-" + @mget("button_type"))
      if i == active then $label.addClass("bk-bs-active")
      @$el.append($label)
    return @

  change_input: () ->
    active = (i for radio, i in @$("input") when radio.checked)
    @mset('active', active[0])
    @mget('callback')?.execute(@model)

class RadioButtonGroup extends Widget.Model
  type: "RadioButtonGroup"
  default_view: RadioButtonGroupView

  @define {
      active:      [ p.Any,    null      ] # TODO (bev) better type?
      labels:      [ p.Array,  []        ]
      button_type: [ p.String, "default" ]
      callback:    [ p.Instance ]
    }

module.exports =
  Model: RadioButtonGroup
  View: RadioButtonGroupView
