/* XXX: partial */
import * as p from "core/properties";
import {input, select, option, Keys} from "core/dom";
import {extend} from "core/util/object";

import {DOMView} from "core/dom_view";
import {Model} from "../../../model";
import {DTINDEX_NAME} from "./data_table"

export class CellEditorView extends DOMView {
  static initClass() {
    this.prototype.className = "bk-cell-editor";

    this.prototype.inputEl = null;

    this.prototype.emptyValue = null;
    this.prototype.defaultValue = null;
  }

  constructor(options) {
    super(extend({model: options.column.editor}, options));
  }

  initialize(options) {
    super.initialize(options);
    this.args = options;
    return this.render();
  }

  render() {
    super.render();
    this.args.container.appendChild(this.el);
    this.el.appendChild(this.inputEl);
    this.renderEditor();
    this.disableNavigation();
    return this;
  }

  renderEditor() {}

  disableNavigation() {
    return this.inputEl.addEventListener("keydown", event => {
      switch (event.keyCode) {
        case Keys.Left: case Keys.Right: case Keys.Up: case Keys.Down: case Keys.PageUp: case Keys.PageDown:
          return event.stopImmediatePropagation();
      }
    });
  }

  destroy() { return this.remove(); }

  focus() { return this.inputEl.focus(); }

  show() {}

  hide() {}

  position() {}

  getValue() { return this.inputEl.value; }

  setValue(val) { return this.inputEl.value = val; }

  serializeValue() { return this.getValue(); }

  isValueChanged() { return !((this.getValue() === "") && (this.defaultValue == null)) && (this.getValue() !== this.defaultValue); }

  applyValue(item, state) {
    return this.args.grid.getData().setField(item[DTINDEX_NAME], this.args.column.field, state);
  }

  loadValue(item) {
    const value = item[this.args.column.field];
    this.defaultValue = (value != null) ? value : this.emptyValue;
    return this.setValue(this.defaultValue);
  }

  validateValue(value) {
    if (this.args.column.validator) {
      const result = this.args.column.validator(value);
      if (!result.valid) {
        return result;
      }
    }

    return { valid: true, msg: null };
  }

  validate() { return this.validateValue(this.getValue()); }
}
CellEditorView.initClass();

export class CellEditor extends Model {
  static initClass() {
    this.prototype.type = "CellEditor";
    this.prototype.default_view = CellEditorView;
  }
}
CellEditor.initClass();

export class StringEditorView extends CellEditorView {
  static initClass() {

    this.prototype.emptyValue = "";

    this.prototype.inputEl = input({type: "text"});
  }

  renderEditor() {
    //completions = @model.completions
    //if completions.length != 0
    //  @inputEl.classList.add("bk-cell-editor-completion")
    //  $(@inputEl).autocomplete({source: completions})
    //  $(@inputEl).autocomplete("widget")
    this.inputEl.focus();
    return this.inputEl.select();
  }

  loadValue(item) {
    super.loadValue(item);
    this.inputEl.defaultValue = this.defaultValue;
    return this.inputEl.select();
  }
}
StringEditorView.initClass();

export class StringEditor extends CellEditor {
  static initClass() {
    this.prototype.type = 'StringEditor';
    this.prototype.default_view = StringEditorView;
    this.define({
      completions: [ p.Array, [] ]
    });
  }
}
StringEditor.initClass();

export class TextEditorView extends CellEditorView {}

export class TextEditor extends CellEditor {
  static initClass() {
    this.prototype.type = 'TextEditor';
    this.prototype.default_view = TextEditorView;
  }
}
TextEditor.initClass();

export class SelectEditorView extends CellEditorView {
  static initClass() {

    this.prototype.inputEl = select();
  }

  renderEditor() {
    for (option of this.model.options) {
      this.inputEl.appendChild(option({value: option}, option));
    }
    return this.focus();
  }

  loadValue(item) {
    super.loadValue(item);
    return this.inputEl.select();
  }
}
SelectEditorView.initClass();

export class SelectEditor extends CellEditor {
  static initClass() {
    this.prototype.type = 'SelectEditor';
    this.prototype.default_view = SelectEditorView;
    this.define({
      options: [ p.Array, [] ]
    });
  }
}
SelectEditor.initClass();

export class PercentEditorView extends CellEditorView {}

export class PercentEditor extends CellEditor {
  static initClass() {
    this.prototype.type = 'PercentEditor';
    this.prototype.default_view = PercentEditorView;
  }
}
PercentEditor.initClass();

export class CheckboxEditorView extends CellEditorView {
  static initClass() {

    this.prototype.inputEl = input({type: "checkbox", value: "true"});
  }

  renderEditor() { return this.focus(); }

  loadValue(item) {
    this.defaultValue = !!item[this.args.column.field];
    return this.inputEl.checked = this.defaultValue;
  }

  serializeValue() {
    return this.inputEl.checked;
  }
}
CheckboxEditorView.initClass();

export class CheckboxEditor extends CellEditor {
  static initClass() {
    this.prototype.type = 'CheckboxEditor';
    this.prototype.default_view = CheckboxEditorView;
  }
}
CheckboxEditor.initClass();

export class IntEditorView extends CellEditorView {
  static initClass() {

    this.prototype.inputEl = input({type: "text"});
  }

  renderEditor() {
    //$(@inputEl).spinner({step: @model.step})
    this.inputEl.focus();
    return this.inputEl.select();
  }

  remove() {
    //$(@inputEl).spinner("destroy")
    return super.remove();
  }

  serializeValue() {
    return parseInt(this.getValue(), 10) || 0;
  }

  loadValue(item) {
    super.loadValue(item);
    this.inputEl.defaultValue = this.defaultValue;
    return this.inputEl.select();
  }

  validateValue(value) {
    if (isNaN(value)) {
      return { valid: false, msg: "Please enter a valid integer" };
    } else {
      return super.validateValue(value);
    }
  }
}
IntEditorView.initClass();

export class IntEditor extends CellEditor {
  static initClass() {
    this.prototype.type = 'IntEditor';
    this.prototype.default_view = IntEditorView;
    this.define({
      step: [ p.Number, 1 ]
    });
  }
}
IntEditor.initClass();

export class NumberEditorView extends CellEditorView {
  static initClass() {

    this.prototype.inputEl = input({type: "text"});
  }

  renderEditor() {
    //$(@inputEl).spinner({step: @model.step})
    this.inputEl.focus();
    return this.inputEl.select();
  }

  remove() {
    //$(@inputEl).spinner("destroy")
    return super.remove();
  }

  serializeValue() {
    return parseFloat(this.getValue()) || 0.0;
  }

  loadValue(item) {
    super.loadValue(item);
    this.inputEl.defaultValue = this.defaultValue;
    return this.inputEl.select();
  }

  validateValue(value) {
    if (isNaN(value)) {
      return { valid: false, msg: "Please enter a valid number" };
    } else {
      return super.validateValue(value);
    }
  }
}
NumberEditorView.initClass();

export class NumberEditor extends CellEditor {
  static initClass() {
    this.prototype.type = 'NumberEditor';
    this.prototype.default_view = NumberEditorView;
    this.define({
      step: [ p.Number, 0.01 ]
    });
  }
}
NumberEditor.initClass();

export class TimeEditorView extends CellEditorView {}

export class TimeEditor extends CellEditor {
  static initClass() {
    this.prototype.type = 'TimeEditor';
    this.prototype.default_view = TimeEditorView;
  }
}
TimeEditor.initClass();

export class DateEditorView extends CellEditorView {
  static initClass() {

    this.prototype.emptyValue = new Date();

    this.prototype.inputEl = input({type: "text"});
  }

  renderEditor() {
    this.calendarOpen = false;

    //@$datepicker = $(@inputEl).datepicker({
    //  showOn: "button"
    //  buttonImageOnly: true
    //  beforeShow: () => @calendarOpen = true
    //  onClose: () => @calendarOpen = false
    //})
    //@$datepicker.siblings(".ui-datepicker-trigger").css("vertical-align": "middle")
    //@$datepicker.width(@$datepicker.width() - (14 + 2*4 + 4)) # img width + margins + edge distance
    this.inputEl.focus();
    return this.inputEl.select();
  }

  destroy() {
    //$.datepicker.dpDiv.stop(true, true)
    //@$datepicker.datepicker("hide")
    //@$datepicker.datepicker("destroy")
    return super.destroy();
  }

  show() {
    //if @calendarOpen
    //  $.datepicker.dpDiv.stop(true, true).show()
    return super.show();
  }

  hide() {
    //if @calendarOpen
    //  $.datepicker.dpDiv.stop(true, true).hide()
    return super.hide();
  }

  position(_position) {
    //if @calendarOpen
    //  $.datepicker.dpDiv.css(top: position.top + 30, left: position.left)
    return super.position();
  }

  getValue() {}
    //return @$datepicker.datepicker("getDate").getTime()

  setValue(_val) {}
}
DateEditorView.initClass();
    //@$datepicker.datepicker("setDate", new Date(val))

export class DateEditor extends CellEditor {
  static initClass() {
    this.prototype.type = 'DateEditor';
    this.prototype.default_view = DateEditorView;
  }
}
DateEditor.initClass();
