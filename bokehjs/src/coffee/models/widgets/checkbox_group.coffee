_ = require "underscore"
$ = require "jquery"

Widget = require "./widget"
BokehView = require "../../core/bokeh_view"
p = require "../../core/properties"


class CheckboxGroupView extends Widget.View
  events:
    "change input": "change_input"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    super()
    @$el.empty()

    active = @mget("active")
    for label, i in @mget("labels")
      $input = $('<input type="checkbox">').attr(value: "#{i}")
      if @mget("disabled") then $input.prop("disabled", true)
      if i in active then $input.prop("checked", true)

      $label = $('<label></label>').text(label).prepend($input)
      if @mget("inline")
          $label.addClass("bk-bs-checkbox-inline")
          @$el.append($label)
      else
          $div = $('<div class="bk-bs-checkbox"></div>').append($label)
          @$el.append($div)

    return @

  change_input: () ->
    active = (i for checkbox, i in @$("input") when checkbox.checked)
    @model.active = active
    @mget('callback')?.execute(@model)

class CheckboxGroup extends Widget.Model
  type: "CheckboxGroup"
  default_view: CheckboxGroupView

  @define {
      active:   [ p.Array, []    ]
      labels:   [ p.Array, []    ]
      inline:   [ p.Bool,  false ]
      callback: [ p.Instance ]
    }

module.exports =
  Model: CheckboxGroup
  View: CheckboxGroupView
