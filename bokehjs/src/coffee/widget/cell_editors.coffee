_ = require "underscore"
$ = require "jquery"
if global._bokehTest?
  $1 = undefined  # TODO Make work
  $2 = undefined
else
  $1 = require "jquery-ui/autocomplete"
  $2 = require "jquery-ui/spinner"
ContinuumView = require "../common/continuum_view"
HasProperties = require "../common/has_properties"

class CellEditor extends HasProperties
  editorDefaults: {}

  defaults: () ->
    return _.extend {}, super(), @editorDefaults

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
    return @

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

class TextEditorView extends CellEditorView

class TextEditor extends CellEditor
  type: 'TextEditor'
  default_view: TextEditorView

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

class PercentEditorView extends CellEditorView

class PercentEditor extends CellEditor
  type: 'PercentEditor'
  default_view: PercentEditorView

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

class TimeEditorView extends CellEditorView

class TimeEditor extends CellEditor
  type: 'TimeEditor'
  default_view: TimeEditorView

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

module.exports =
  String:
    Model: StringEditor
    View: StringEditorView

  Text:
    Model: TextEditor
    View: TextEditorView

  Select:
    Model: SelectEditor
    View: SelectEditorView

  Percent:
    Model: PercentEditor
    View: PercentEditorView

  Checkbox:
    Model: CheckboxEditor
    View: CheckboxEditorView

  Int:
    Model: IntEditor
    View: IntEditorView

  Number:
    Model: NumberEditor
    View: NumberEditorView

  Time:
    Model: TimeEditor
    View: TimeEditorView

  Date:
    Model: DateEditor
    View: DateEditorView
