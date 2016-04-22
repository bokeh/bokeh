_ = require "underscore"
$ = require "jquery"

Widget = require "./widget"
BokehView = require "../../core/bokeh_view"
p = require "../../core/properties"

class RadioGroupView extends BokehView
  tagName: "div"
  events:
    "change input": "change_input"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    @$el.empty()

    name = _.uniqueId("RadioGroup")
    active = @mget("active")
    for label, i in @mget("labels")
      $input = $('<input type="radio">').attr(name: name, value: "#{i}")
      if @mget("disabled") then $input.prop("disabled", true)
      if i == active then $input.prop("checked", true)

      $label = $('<label></label>').text(label).prepend($input)
      if @mget("inline")
          $label.addClass("bk-bs-radio-inline")
          @$el.append($label)
      else
          $div = $('<div class="bk-bs-radio"></div>').append($label)
          @$el.append($div)
    return @

  change_input: () ->
    active = (i for radio, i in @$("input") when radio.checked)
    @mset('active', active[0])

class RadioGroup extends Widget.Model
  type: "RadioGroup"
  default_view: RadioGroupView

  @define {
      active:   [ p.Any,   null  ] # TODO (bev) better type?
      labels:   [ p.Array, []    ]
      inline:   [ p.Bool,  false ]
    }

module.exports =
  Model: RadioGroup
  View: RadioGroupView
