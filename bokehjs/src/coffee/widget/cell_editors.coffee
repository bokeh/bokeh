define [
  "underscore"
  "jquery"
  "common/has_properties"
  "common/collection"
  "common/continuum_view"
  "jquery_ui/autocomplete"
  "jquery_ui/spinner"
], (_, $, HasProperties, Collection, ContinuumView) ->

  class CellEditor extends HasProperties

    editor_defaults: {}

    defaults: -> return _.extend {}, super(), @editor_defaults

  class CellEditorCollection extends Collection

  class CellEditorView extends ContinuumView

    emptyValue: null
    defaultValue: null

    initialize: (args) ->
      super({})
      @args = args
      @model = @args.column.editorModel
      @render()
      @$el.appendTo(@args.container)

    destroy: () -> @remove()

    focus: () -> @$el.focus()

    show: () ->

    hide: () ->

    position: () ->

    getValue: () -> return @$el.val()

    setValue: (val) -> @$el.val(val)

    serializeValue: () -> return @getValue()

    isValueChanged: () -> return not (@getValue() == "" and not @defaultValue?) and (@getValue() != @defaultValue)

    applyValue: (item, state) ->
      # XXX: In perfect world this would be `item[@args.column.field] = state`.
      @args.grid.getData().setField(item.index, @args.column.field, state)

    loadValue: (item) ->
      value = item[@args.column.field]
      @defaultValue = if value? then value else @emptyValue
      @setValue(@defaultValue)

    validateValue: (value) ->
      if @args.column.validator
        result = @args.column.validator(value)
        if !result.valid
          return result

      return { valid: true, msg: null }

    validate: () -> return @validateValue(@getValue())

    disable_horizontal_navigation: () ->
      @$el.bind "keydown", (event) =>
        if event.keyCode == $.ui.keyCode.LEFT or event.keyCode == $.ui.keyCode.RIGHT
          event.stopImmediatePropagation()

    disable_vertical_navigation: () ->
      @$el.bind "keydown", (event) =>
        if event.keyCode == $.ui.keyCode.UP   or event.keyCode == $.ui.keyCode.PAGE_UP   or
           event.keyCode == $.ui.keyCode.DOWN or event.keyCode == $.ui.keyCode.PAGE_DOWN
          event.stopImmediatePropagation()

  class StringEditorView extends CellEditorView

    emptyValue: ""

    el: '<input type="text" class="bk-cell-editor bk-cell-editor-string" />'

    render: () ->
      completions = @model.get("completions")
      if not _.isEmpty(completions)
        @$el.autocomplete(source: completions)
        @$el.autocomplete("widget").addClass("bk-cell-editor-completion")
      @disable_horizontal_navigation()
      @disable_vertical_navigation()
      @$el.focus().select()

    loadValue: (item) ->
      super(item)
      @$el[0].defaultValue = @defaultValue
      @$el.select()

  class StringEditor extends CellEditor
    type: 'StringEditor'
    default_view: StringEditorView
    editor_defaults:
      completions: []

  class StringEditors extends CellEditorCollection
    model: StringEditor

  class TextEditorView extends CellEditorView

  class TextEditor extends CellEditor
    type: 'TextEditor'
    default_view: TextEditorView

  class TextEditors extends CellEditorCollection
    model: TextEditor

  class SelectEditorView extends CellEditorView

    el: '<select tabIndex="0" class="bk-cell-editor bk-cell-editor-select" />'

    render: () ->
      @disable_vertical_navigation()
      for option in @model.get("options")
        @$el.append($('<option>').attr(value: option).text(option))
      @focus()

    loadValue: (item) ->
      super(item)
      @$el.select()

  class SelectEditor extends CellEditor
    type: 'SelectEditor'
    default_view: SelectEditorView
    editor_defaults:
      options: []

  class SelectEditors extends CellEditorCollection
    model: SelectEditor

  class PercentEditorView extends CellEditorView

  class PercentEditor extends CellEditor
    type: 'PercentEditor'
    default_view: PercentEditorView

  class PercentEditors extends CellEditorCollection
    model: PercentEditor

  class CheckboxEditorView extends CellEditorView

  class CheckboxEditor extends CellEditor
    type: 'CheckboxEditor'
    default_view: CheckboxEditorView

  class CheckboxEditors extends CellEditorCollection
    model: CheckboxEditor

  class IntEditorView extends CellEditorView

    el: '<input type="text" class="bk-cell-editor bk-cell-editor-int" />'

    render: () ->
      @$el.spinner(step: @model.get("step"))
      @disable_horizontal_navigation()
      @disable_vertical_navigation()
      @$el.focus().select()

    remove: () ->
      @$el.spinner("destroy")
      super()

    serializeValue: () ->
      return parseInt(@getValue(), 10) || 0

    loadValue: (item) ->
      super(item)
      @$el[0].defaultValue = @defaultValue
      @$el.select()

    validateValue: (value) ->
      if isNaN(value)
        return { valid: false, msg: "Please enter a valid integer" }
      else
        return super(value)

  class IntEditor extends CellEditor
    type: 'IntEditor'
    default_view: IntEditorView
    editor_defaults:
      step: 1

  class IntEditors extends CellEditorCollection
    model: IntEditor

  class NumberEditorView extends CellEditorView

    el: '<input type="text" class="bk-cell-editor bk-cell-editor-number" />'

    render: () ->
      @$el.spinner(step: @model.get("step"))
      @disable_horizontal_navigation()
      @disable_vertical_navigation()
      @$el.focus().select()

    remove: () ->
      @$el.spinner("destroy")
      super()

    serializeValue: () ->
      return parseFloat(@getValue()) || 0.0

    loadValue: (item) ->
      super(item)
      @$el[0].defaultValue = @defaultValue
      @$el.select()

    validateValue: (value) ->
      if isNaN(value)
        return { valid: false, msg: "Please enter a valid number" }
      else
        return super(value)

  class NumberEditor extends CellEditor
    type: 'NumberEditor'
    default_view: NumberEditorView
    editor_defaults:
      step: 0.01

  class NumberEditors extends CellEditorCollection
    model: NumberEditor

  class TimeEditorView extends CellEditorView

  class TimeEditor extends CellEditor
    type: 'TimeEditor'
    default_view: TimeEditorView

  class TimeEditors extends CellEditorCollection
    model: TimeEditor

  class DateEditorView extends CellEditorView

  class DateEditor extends CellEditor
    type: 'DateEditor'
    default_view: DateEditorView

  class DateEditors extends CellEditorCollection
    model: DateEditor

  return {
    String:
      Model: StringEditor
      Collection: new StringEditors()
      View: StringEditorView

    Text:
      Model: TextEditor
      Collection: new TextEditors()
      View: TextEditorView

    Select:
      Model: SelectEditor
      Collection: new SelectEditors()
      View: SelectEditorView

    Percent:
      Model: PercentEditor
      Collection: new PercentEditors()
      View: PercentEditorView

    Checkbox:
      Model: CheckboxEditor
      Collection: new CheckboxEditors()
      View: CheckboxEditorView

    Int:
      Model: IntEditor
      Collection: new IntEditors()
      View: IntEditorView

    Number:
      Model: NumberEditor
      Collection: new NumberEditors()
      View: NumberEditorView

    Time:
      Model: TimeEditor
      Collection: new TimeEditors()
      View: TimeEditorView

    Date:
      Model: DateEditor
      Collection: new DateEditors()
      View: DateEditorView
  }

