import * as p from "core/properties"
import {input, select, option, Keys} from "core/dom"
import {extend} from "core/util/object"

import {DOMView} from "core/dom_view"
import {Model} from "../../../model"
import {DTINDEX_NAME} from "./data_table"

export class CellEditorView extends DOMView
  className: "bk-cell-editor"

  inputEl: null

  emptyValue: null
  defaultValue: null

  constructor: (options) ->
    @args = options
    super(extend({model: options.column.editor}, options))

  initialize: (options) ->
    super(options)
    @render()

  render: () ->
    super()
    @args.container.appendChild(@el)
    @el.appendChild(@inputEl)
    @renderEditor()
    @disableNavigation()
    return @

  renderEditor: () ->

  disableNavigation: () ->
    @inputEl.addEventListener "keydown", (event) =>
      switch event.keyCode
        when Keys.Left, Keys.Right, Keys.Up, Keys.Down, Keys.PageUp, Keys.PageDown
          event.stopImmediatePropagation()

  destroy: () -> @remove()

  focus: () -> @inputEl.focus()

  show: () ->

  hide: () ->

  position: () ->

  getValue: () -> return @inputEl.value

  setValue: (val) -> @inputEl.value = val

  serializeValue: () -> return @getValue()

  isValueChanged: () -> return not (@getValue() == "" and not @defaultValue?) and (@getValue() != @defaultValue)

  applyValue: (item, state) ->
    @args.grid.getData().setField(item[DTINDEX_NAME], @args.column.field, state)

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

export class CellEditor extends Model
  type: "CellEditor"
  default_view: CellEditorView

export class StringEditorView extends CellEditorView

  emptyValue: ""

  inputEl: input({type: "text"})

  renderEditor: () ->
    #completions = @model.completions
    #if completions.length != 0
    #  @inputEl.classList.add("bk-cell-editor-completion")
    #  $(@inputEl).autocomplete({source: completions})
    #  $(@inputEl).autocomplete("widget")
    @inputEl.focus()
    @inputEl.select()

  loadValue: (item) ->
    super(item)
    @inputEl.defaultValue = @defaultValue
    @inputEl.select()

export class StringEditor extends CellEditor
  type: 'StringEditor'
  default_view: StringEditorView
  @define {
    completions: [ p.Array, [] ]
  }

export class TextEditorView extends CellEditorView

export class TextEditor extends CellEditor
  type: 'TextEditor'
  default_view: TextEditorView

export class SelectEditorView extends CellEditorView

  inputEl: select()

  renderEditor: () ->
    for option in @model.options
      @inputEl.appendChild(option({value: option}, option))
    @focus()

  loadValue: (item) ->
    super(item)
    @inputEl.select()

export class SelectEditor extends CellEditor
  type: 'SelectEditor'
  default_view: SelectEditorView
  @define {
    options: [ p.Array, [] ]
  }

export class PercentEditorView extends CellEditorView

export class PercentEditor extends CellEditor
  type: 'PercentEditor'
  default_view: PercentEditorView

export class CheckboxEditorView extends CellEditorView

  inputEl: input({type: "checkbox", value: "true"})

  renderEditor: () -> @focus()

  loadValue: (item) ->
    @defaultValue = !!item[@args.column.field]
    @inputEl.checked = @defaultValue

  serializeValue: () ->
    return @inputEl.checked

export class CheckboxEditor extends CellEditor
  type: 'CheckboxEditor'
  default_view: CheckboxEditorView

export class IntEditorView extends CellEditorView

  inputEl: input({type: "text"})

  renderEditor: () ->
    #$(@inputEl).spinner({step: @model.step})
    @inputEl.focus()
    @inputEl.select()

  remove: () ->
    #$(@inputEl).spinner("destroy")
    super()

  serializeValue: () ->
    return parseInt(@getValue(), 10) || 0

  loadValue: (item) ->
    super(item)
    @inputEl.defaultValue = @defaultValue
    @inputEl.select()

  validateValue: (value) ->
    if isNaN(value)
      return { valid: false, msg: "Please enter a valid integer" }
    else
      return super(value)

export class IntEditor extends CellEditor
  type: 'IntEditor'
  default_view: IntEditorView
  @define {
    step: [ p.Number, 1 ]
  }

export class NumberEditorView extends CellEditorView

  inputEl: input({type: "text"})

  renderEditor: () ->
    #$(@inputEl).spinner({step: @model.step})
    @inputEl.focus()
    @inputEl.select()

  remove: () ->
    #$(@inputEl).spinner("destroy")
    super()

  serializeValue: () ->
    return parseFloat(@getValue()) || 0.0

  loadValue: (item) ->
    super(item)
    @inputEl.defaultValue = @defaultValue
    @inputEl.select()

  validateValue: (value) ->
    if isNaN(value)
      return { valid: false, msg: "Please enter a valid number" }
    else
      return super(value)

export class NumberEditor extends CellEditor
  type: 'NumberEditor'
  default_view: NumberEditorView
  @define {
    step: [ p.Number, 0.01 ]
  }

export class TimeEditorView extends CellEditorView

export class TimeEditor extends CellEditor
  type: 'TimeEditor'
  default_view: TimeEditorView

export class DateEditorView extends CellEditorView

  emptyValue: new Date()

  inputEl: input({type: "text"})

  renderEditor: () ->
    @calendarOpen = false

    #@$datepicker = $(@inputEl).datepicker({
    #  showOn: "button"
    #  buttonImageOnly: true
    #  beforeShow: () => @calendarOpen = true
    #  onClose: () => @calendarOpen = false
    #})
    #@$datepicker.siblings(".ui-datepicker-trigger").css("vertical-align": "middle")
    #@$datepicker.width(@$datepicker.width() - (14 + 2*4 + 4)) # img width + margins + edge distance
    @inputEl.focus()
    @inputEl.select()

  destroy: () ->
    #$.datepicker.dpDiv.stop(true, true)
    #@$datepicker.datepicker("hide")
    #@$datepicker.datepicker("destroy")
    super()

  show: () ->
    #if @calendarOpen
    #  $.datepicker.dpDiv.stop(true, true).show()
    super()

  hide: () ->
    #if @calendarOpen
    #  $.datepicker.dpDiv.stop(true, true).hide()
    super()

  position: (position) ->
    #if @calendarOpen
    #  $.datepicker.dpDiv.css(top: position.top + 30, left: position.left)
    super()

  getValue: () ->
    #return @$datepicker.datepicker("getDate").getTime()

  setValue: (val) ->
    #@$datepicker.datepicker("setDate", new Date(val))

export class DateEditor extends CellEditor
  type: 'DateEditor'
  default_view: DateEditorView
