_ = require "underscore"
$ = require "jquery"
ContinuumView = require "../common/continuum_view"
HasParent = require "../common/has_parent"

class RadioGroupView extends ContinuumView
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
    @model.save()

class RadioGroup extends HasParent
  type: "RadioGroup"
  default_view: RadioGroupView

  defaults: ->
    return _.extend {}, super(), {
      active: null
      labels: []
      inline: false
      disabled: false
    }

module.exports =
  Model: RadioGroup
  View: RadioGroupView