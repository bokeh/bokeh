define [
  "underscore"
  "common/collection"
  "jquery"
  "bootstrap/button"
  "common/continuum_view"
  "common/has_parent"
  "common/logging"
], (_, Collection, $, $1, ContinuumView, HasParent, Logging) ->

  logger = Logging.logger

  class CheckboxButtonGroupView extends ContinuumView
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
      return @

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
        $label.addClass("bk-bs-btn-" + @mget("type"))
        if i in active then $label.addClass("bk-bs-active")
        @$el.append($label)

      return @

  class CheckboxButtonGroup extends HasParent
    type: "CheckboxButtonGroup"
    default_view: CheckboxButtonGroupView

    defaults: ->
      return _.extend {}, super(), {
        active: []
        labels: []
        type: "default"
        disabled: false
      }

  class CheckboxButtonGroups extends Collection
    model: CheckboxButtonGroup

  return {
    Model: CheckboxButtonGroup
    Collection: new CheckboxButtonGroups()
    View: CheckboxButtonGroupView
  }
