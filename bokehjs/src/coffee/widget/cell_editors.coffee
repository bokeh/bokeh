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

    editorDefaults: {}
    defaults: -> return _.extend {}, super(), @editorDefaults

  class CellEditorCollection extends Collection

  class CellEditorView extends ContinuumView

    tagName: "div"
    className: "bk-cell-editor"

    input: null

    emptyValue: null
    defaultValue: null

    initialize: (args) ->
      super({})
      @args = args
      @model = @args.column.editor
      @render()

    render: () ->
      @$el.appendTo(@args.container)
      @$input = $(@input)
      @$el.append(@$input)
      @renderEditor()
      @disableNavigation()

    renderEditor: () ->

    disableNavigation: () ->
      @$input.keydown (event) =>
        stop = () -> event.stopImmediatePropagation()
        switch event.keyCode
          when $.ui.keyCode.LEFT      then stop()
          when $.ui.keyCode.RIGHT     then stop()
          when $.ui.keyCode.UP        then stop()
          when $.ui.keyCode.DOWN      then stop()
          when $.ui.keyCode.PAGE_UP   then stop()
          when $.ui.keyCode.PAGE_DOWN then stop()

    destroy: () -> @remove()

    focus: () -> @$input.focus()

    show: () ->

    hide: () ->

    position: () ->

    getValue: () -> return @$input.val()

    setValue: (val) -> @$input.val(val)

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

  class StringEditorView extends CellEditorView

    emptyValue: ""

    input: '<input type="text" />'

    renderEditor: () ->
      completions = @model.get("completions")
      if not _.isEmpty(completions)
        @$input.autocomplete(source: completions)
        @$input.autocomplete("widget").addClass("bk-cell-editor-completion")
      @$input.focus().select()

    loadValue: (item) ->
      super(item)
      @$input[0].defaultValue = @defaultValue
      @$input.select()

  class StringEditor extends CellEditor
    type: 'StringEditor'
    default_view: StringEditorView
    editorDefaults:
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

    input: '<select />'

    renderEditor: () ->
      for option in @model.get("options")
        @$input.append($('<option>').attr(value: option).text(option))
      @focus()

    loadValue: (item) ->
      super(item)
      @$input.select()

  class SelectEditor extends CellEditor
    type: 'SelectEditor'
    default_view: SelectEditorView
    editorDefaults:
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

    input: '<input type="checkbox" value="true" />'

    renderEditor: () -> @focus()

    loadValue: (item) ->
      @defaultValue = !!item[@args.column.field]
      @$input.prop('checked', @defaultValue)

    serializeValue: () ->
      return @$input.prop('checked')

  class CheckboxEditor extends CellEditor
    type: 'CheckboxEditor'
    default_view: CheckboxEditorView

  class CheckboxEditors extends CellEditorCollection
    model: CheckboxEditor

  class IntEditorView extends CellEditorView

    input: '<input type="text" />'

    renderEditor: () ->
      @$input.spinner(step: @model.get("step"))
      @$input.focus().select()

    remove: () ->
      @$input.spinner("destroy")
      super()

    serializeValue: () ->
      return parseInt(@getValue(), 10) || 0

    loadValue: (item) ->
      super(item)
      @$input[0].defaultValue = @defaultValue
      @$input.select()

    validateValue: (value) ->
      if isNaN(value)
        return { valid: false, msg: "Please enter a valid integer" }
      else
        return super(value)

  class IntEditor extends CellEditor
    type: 'IntEditor'
    default_view: IntEditorView
    editorDefaults:
      step: 1

  class IntEditors extends CellEditorCollection
    model: IntEditor

  class NumberEditorView extends CellEditorView

    input: '<input type="text" />'

    renderEditor: () ->
      @$input.spinner(step: @model.get("step"))
      @$input.focus().select()

    remove: () ->
      @$input.spinner("destroy")
      super()

    serializeValue: () ->
      return parseFloat(@getValue()) || 0.0

    loadValue: (item) ->
      super(item)
      @$input[0].defaultValue = @defaultValue
      @$input.select()

    validateValue: (value) ->
      if isNaN(value)
        return { valid: false, msg: "Please enter a valid number" }
      else
        return super(value)

  class NumberEditor extends CellEditor
    type: 'NumberEditor'
    default_view: NumberEditorView
    editorDefaults:
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

    emptyValue: new Date()

    input: '<input type="text" />'

    renderEditor: () ->
      @calendarOpen = false

      @$input.datepicker
        showOn: "button"
        buttonImageOnly: true
        beforeShow: () => @calendarOpen = true
        onClose: () => @calendarOpen = false
      @$input.siblings(".bk-ui-datepicker-trigger").css("vertical-align": "middle")
      @$input.width(@$input.width() - (14 + 2*4 + 4)) # img width + margins + edge distance
      @$input.focus().select()

    destroy: () ->
      $.datepicker.dpDiv.stop(true, true)
      @$input.datepicker("hide")
      @$input.datepicker("destroy")
      super()

    show: () ->
      if @calendarOpen
        $.datepicker.dpDiv.stop(true, true).show()
      super()

    hide: () ->
      if @calendarOpen
        $.datepicker.dpDiv.stop(true, true).hide()
      super()

    position: (position) ->
      if @calendarOpen
        $.datepicker.dpDiv.css(top: position.top + 30, left: position.left)
      super()

    getValue: () -> return @$input.datepicker("getDate").getTime()

    setValue: (val) -> @$input.datepicker("setDate", new Date(val))

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

