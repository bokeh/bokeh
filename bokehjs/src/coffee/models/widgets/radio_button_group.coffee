_ = require "underscore"
$ = require "jquery"
$1 = require "bootstrap/button"

p = require "../../core/properties"

Widget = require "./widget"
template = require "./button_group_template"


class RadioButtonGroupView extends Widget.View
  events:
    "change input": "change_input"
  template: template

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    super()

    @$el.empty()
    html = @template()
    @$el.append(html)

    name = _.uniqueId("RadioButtonGroup")
    active = @mget("active")
    for label, i in @mget("labels")
      $input = $('<input type="radio">').attr(name: name, value: "#{i}")
      if i == active then $input.prop("checked", true)
      $label = $('<label class="bk-bs-btn"></label>')
      $label.text(label).prepend($input)
      $label.addClass("bk-bs-btn-" + @mget("button_type"))
      if i == active then $label.addClass("bk-bs-active")
      @$el.find('.bk-bs-btn-group').append($label)

    return @

  change_input: () ->
    active = (i for radio, i in @$("input") when radio.checked)
    @model.active = active[0]
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
