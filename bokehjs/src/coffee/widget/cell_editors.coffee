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

  class StringEditorView extends CellEditorView

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

