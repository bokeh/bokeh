define [
  "underscore"
  "jquery"
  "common/has_properties"
  "common/collection"
  "common/continuum_view"
], (_, $, HasProperties, Collection, ContinuumView) ->

  class CellEditor extends HasProperties
  class CellEditorCollection extends Collection
  class CellEditorView extends ContinuumView

    emptyValue: null
    defaultValue: null

    initialize: (args) ->
      super({})
      @args = args
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

    validate: () ->
      if @args.column.validator
        result = @args.column.validator(@getValue())
        if !result.valid
          return result

      return { valid: true, msg: null }

  class StringEditorView extends CellEditorView

    emptyValue: ""

    el: '<input type="text" class="bk-cell-editor bk-cell-editor-string" />'

    render: () ->
      @$el.bind "keydown.nav", (event) =>
        if event.keyCode == $.ui.keyCode.LEFT or event.keyCode == $.ui.keyCode.RIGHT
          event.stopImmediatePropagation()
      @focus()
      @$el.select()

    loadValue: (item) ->
      super(item)
      @$el[0].defaultValue = @defaultValue
      @$el.select()

  class StringEditor extends CellEditor
    type: 'StringEditor'
    default_view: StringEditorView

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
      for option in @args.column.editorModel.get("options")
        @$el.append($('<option>').attr(value: option).text(option))
      @focus()

    loadValue: (item) ->
      super(item)
      @$el.select()

  class SelectEditor extends CellEditor
    type: 'SelectEditor'
    default_view: SelectEditorView

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

  class IntegerEditorView extends CellEditorView

  class IntegerEditor extends CellEditor
    type: 'IntegerEditor'
    default_view: IntegerEditorView

  class EditorView extends CellEditorView

  class IntegerEditors extends CellEditorCollection
    model: IntegerEditor

  class NumberEditorView extends CellEditorView

  class NumberEditor extends CellEditor
    type: 'NumberEditor'
    default_view: NumberEditorView

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

    Integer:
      Model: IntegerEditor
      Collection: new IntegerEditors()
      View: IntegerEditorView

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

