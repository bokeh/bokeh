define [
  "jquery"
  "underscore"
  "common/collection"
  "common/continuum_view"
  "common/has_parent"
  "common/logging"
], ($, _, Collection, ContinuumView, HasParent, Logging) ->

  logger = Logging.logger

  class CheckboxGroupView extends ContinuumView
    tagName: "div"
    events:
      "change input": "change_input"

    change_input: () ->
      active = (i for checkbox, i in @$("input") when checkbox.checked)
      @mset('active', active)
      @model.save()

    initialize: (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change', @render)

    render: () ->
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

  class CheckboxGroup extends HasParent
    type: "CheckboxGroup"
    default_view: CheckboxGroupView

    defaults: ->
      return _.extend {}, super(), {
        active: []
        labels: []
        inline: false
        disabled: false
      }

  class CheckboxGroups extends Collection
    model: CheckboxGroup

  return {
    Model: CheckboxGroup
    Collection: new CheckboxGroups()
    View: CheckboxGroupView
  }
