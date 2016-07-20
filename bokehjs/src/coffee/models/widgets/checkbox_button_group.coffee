_ = require "underscore"
$ = require "jquery"
$1 = require "bootstrap/button"

Widget = require "./widget"
BokehView = require "../../core/bokeh_view"
p = require "../../core/properties"
template = require "./button_group_template"


class CheckboxButtonGroupView extends Widget.View
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

    active = @model.active
    for label, i in @model.labels
      $input = $('<input type="checkbox">').attr(value: "#{i}")
      if i in active then $input.prop("checked", true)
      $label = $('<label class="bk-bs-btn"></label>')
      $label.text(label).prepend($input)
      $label.addClass("bk-bs-btn-" + @mget("button_type"))
      if i in active then $label.addClass("bk-bs-active")
      @$el.find('.bk-bs-btn-group').append($label)

    return @

  change_input: () ->
    active = (i for checkbox, i in @$("input") when checkbox.checked)
    @model.active = active
    @mget('callback')?.execute(@model)


class CheckboxButtonGroup extends Widget.Model
  type: "CheckboxButtonGroup"
  default_view: CheckboxButtonGroupView

  @define {
      active:      [ p.Array,  []        ]
      labels:      [ p.Array,  []        ]
      button_type: [ p.String, "default" ]
      callback:    [ p.Instance ]
    }

module.exports =
  Model: CheckboxButtonGroup
  View: CheckboxButtonGroupView
