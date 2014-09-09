define [
  "underscore"
  "backbone"
  "common/continuum_view"
  "common/has_parent"
  "common/logging"
], (_, Backbone, continuum_view, HasParent, Logging) ->

  logger = Logging.logger

  class RadioGroupView extends continuum_view.View
    tagName: "div"
    events:
      "change input": "change_input"

    change_input: () ->
      active = (i for radio, i in @$("input") when radio.checked)
      @mset('active', active[0])
      @model.save()

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

  class RadioGroup extends HasParent
    type: "RadioGroup"
    default_view: RadioGroupView

    defaults: () ->
      _.extend({}, super(), {
      })

  class RadioGroups extends Backbone.Collection
    model: RadioGroup

  return {
    Model: RadioGroup
    Collection: new RadioGroups()
    View: RadioGroupView
  }
