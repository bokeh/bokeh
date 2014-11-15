define [
  "underscore"
  "jquery"
  "common/has_properties"
  "common/collection"
  "common/continuum_view"
], (_, $, HasProperties, Collection, ContinuumView) ->

  class CellEditor extends HasProperties

  class StringEditorView extends ContinuumView

  class StringEditor extends CellEditor
    type: 'StringEditor'
    default_view: StringEditorView

  class StringEditors extends Collection
    model: StringEditor

  class TextEditorView extends ContinuumView

  class TextEditor extends CellEditor
    type: 'TextEditor'
    default_view: TextEditorView

  class TextEditors extends Collection
    model: TextEditor

  class PercentEditorView extends ContinuumView

  class PercentEditor extends CellEditor
    type: 'PercentEditor'
    default_view: PercentEditorView

  class PercentEditors extends Collection
    model: PercentEditor

  class CheckboxEditorView extends ContinuumView

  class CheckboxEditor extends CellEditor
    type: 'CheckboxEditor'
    default_view: CheckboxEditorView

  class CheckboxEditors extends Collection
    model: CheckboxEditor

  class IntegerEditorView extends ContinuumView

  class IntegerEditor extends CellEditor
    type: 'IntegerEditor'
    default_view: IntegerEditorView

  class EditorView extends ContinuumView

  class IntegerEditors extends Collection
    model: IntegerEditor

  class NumberEditorView extends ContinuumView

  class NumberEditor extends CellEditor
    type: 'NumberEditor'
    default_view: NumberEditorView

  class NumberEditors extends Collection
    model: NumberEditor

  class TimeEditorView extends ContinuumView

  class TimeEditor extends CellEditor
    type: 'TimeEditor'
    default_view: TimeEditorView

  class TimeEditors extends Collection
    model: TimeEditor

  class DateEditorView extends ContinuumView

  class DateEditor extends CellEditor
    type: 'DateEditor'
    default_view: DateEditorView

  class DateEditors extends Collection
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

