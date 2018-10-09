import * as p from "core/properties"
import {input, textarea, select, option, Keys} from "core/dom"

import {DOMView} from "core/dom_view"
import {Model} from "../../../model"
import {DTINDEX_NAME, Item} from "./data_table"

export abstract class CellEditorView extends DOMView {
  model: CellEditor

  defaultValue: any

  get emptyValue(): any {
    return null
  }

  inputEl: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

  protected args: any

  protected abstract _createInput(): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

  constructor(options: any) {
    super({model: options.column.model, ...options})
  }

  initialize(options: any): void {
    super.initialize(options)
    this.inputEl = this._createInput()
    this.defaultValue = null
    this.args = options
    this.render()
  }

  css_classes(): string[] {
    return super.css_classes().concat("bk-cell-editor")
  }

  render(): void {
    super.render()
    this.args.container.appendChild(this.el)
    this.el.appendChild(this.inputEl)
    this.renderEditor()
    this.disableNavigation()
  }

  renderEditor(): void {}

  disableNavigation(): void {
    this.inputEl.addEventListener("keydown", (event: KeyboardEvent) => {
      switch (event.keyCode) {
        case Keys.Left:
        case Keys.Right:
        case Keys.Up:
        case Keys.Down:
        case Keys.PageUp:
        case Keys.PageDown:
          event.stopImmediatePropagation()
      }
    })
  }

  destroy(): void {
    this.remove()
  }

  focus(): void {
    this.inputEl.focus()
  }

  show(): void {}

  hide(): void {}

  position(): any {}

  getValue(): any {
    return this.inputEl.value
  }

  setValue(val: any): void {
    this.inputEl.value = val
  }

  serializeValue(): any {
    return this.getValue()
  }

  isValueChanged(): boolean {
    return !(this.getValue() == "" && this.defaultValue == null) && this.getValue() !== this.defaultValue
  }

  applyValue(item: Item, state: any): void {
    const grid_data = this.args.grid.getData()
    const offset = grid_data.index.indexOf(item[DTINDEX_NAME])
    grid_data.setField(offset, this.args.column.field, state)
  }

  loadValue(item: Item): void {
    const value = item[this.args.column.field]
    this.defaultValue = value != null ? value : this.emptyValue
    this.setValue(this.defaultValue)
  }

  validateValue(value: any): any {
    if (this.args.column.validator) {
      const result = this.args.column.validator(value)
      if (!result.valid) {
        return result
      }
    }

    return { valid: true, msg: null }
  }

  validate(): any {
    return this.validateValue(this.getValue())
  }
}

export abstract class CellEditor extends Model {
  static initClass(): void {
    this.prototype.type = "CellEditor"
  }
}
CellEditor.initClass()

export class StringEditorView extends CellEditorView {
  model: StringEditor

  inputEl: HTMLInputElement

  get emptyValue(): string {
    return ""
  }

  protected _createInput(): HTMLInputElement {
    return input({type: "text"})
  }

  renderEditor(): void {
    //completions = @model.completions
    //if completions.length != 0
    //  @inputEl.classList.add("bk-cell-editor-completion")
    //  $(@inputEl).autocomplete({source: completions})
    //  $(@inputEl).autocomplete("widget")
    this.inputEl.focus()
    this.inputEl.select()
  }

  loadValue(item: Item): void {
    super.loadValue(item)
    this.inputEl.defaultValue = this.defaultValue
    this.inputEl.select()
  }
}

export class StringEditor extends CellEditor {
  static initClass(): void {
    this.prototype.type = 'StringEditor'
    this.prototype.default_view = StringEditorView
    this.define({
      completions: [ p.Array, [] ],
    })
  }
}
StringEditor.initClass()

export class TextEditorView extends CellEditorView {
  model: TextEditor

  inputEl: HTMLTextAreaElement

  protected _createInput(): HTMLTextAreaElement {
    return textarea()
  }
}

export class TextEditor extends CellEditor {
  static initClass(): void {
    this.prototype.type = 'TextEditor'
    this.prototype.default_view = TextEditorView
  }
}
TextEditor.initClass()

export class SelectEditorView extends CellEditorView {
  model: SelectEditor

  inputEl: HTMLSelectElement

  protected _createInput(): HTMLSelectElement {
    return select()
  }

  renderEditor(): void {
    for (const opt of this.model.options) {
      this.inputEl.appendChild(option({value: opt}, opt))
    }
    this.focus()
  }
}

export class SelectEditor extends CellEditor {
  options: string[]

  static initClass(): void {
    this.prototype.type = 'SelectEditor'
    this.prototype.default_view = SelectEditorView
    this.define({
      options: [ p.Array, [] ],
    })
  }
}
SelectEditor.initClass()

export class PercentEditorView extends CellEditorView {
  model: PercentEditor

  inputEl: HTMLInputElement

  protected _createInput(): HTMLInputElement {
    return input({type: "text"})
  }
}

export class PercentEditor extends CellEditor {
  static initClass(): void {
    this.prototype.type = 'PercentEditor'
    this.prototype.default_view = PercentEditorView
  }
}
PercentEditor.initClass()

export class CheckboxEditorView extends CellEditorView {
  model: CheckboxEditor

  inputEl: HTMLInputElement

  protected _createInput(): HTMLInputElement {
    return input({type: "checkbox", value: "true"})
  }

  renderEditor(): void {
    this.focus()
  }

  loadValue(item: Item): void {
    this.defaultValue = !!item[this.args.column.field]
    this.inputEl.checked = this.defaultValue
  }

  serializeValue(): any {
    return this.inputEl.checked
  }
}

export class CheckboxEditor extends CellEditor {
  static initClass(): void {
    this.prototype.type = 'CheckboxEditor'
    this.prototype.default_view = CheckboxEditorView
  }
}
CheckboxEditor.initClass()

export class IntEditorView extends CellEditorView {
  model: IntEditor

  inputEl: HTMLInputElement

  protected _createInput(): HTMLInputElement {
    return input({type: "text"})
  }

  renderEditor(): void {
    //$(@inputEl).spinner({step: @model.step})
    this.inputEl.focus()
    this.inputEl.select()
  }

  remove(): void {
    //$(@inputEl).spinner("destroy")
    super.remove()
  }

  serializeValue(): any {
    return parseInt(this.getValue(), 10) || 0
  }

  loadValue(item: Item): void {
    super.loadValue(item)
    this.inputEl.defaultValue = this.defaultValue
    this.inputEl.select()
  }

  validateValue(value: any): any {
    if (isNaN(value))
      return { valid: false, msg: "Please enter a valid integer" }
    else
      return super.validateValue(value)
  }
}

export class IntEditor extends CellEditor {
  static initClass(): void {
    this.prototype.type = 'IntEditor'
    this.prototype.default_view = IntEditorView
    this.define({
      step: [ p.Number, 1 ],
    })
  }
}
IntEditor.initClass()

export class NumberEditorView extends CellEditorView {
  model: NumberEditor

  inputEl: HTMLInputElement

  protected _createInput(): HTMLInputElement {
    return input({type: "text"})
  }

  renderEditor(): void {
    //$(@inputEl).spinner({step: @model.step})
    this.inputEl.focus()
    this.inputEl.select()
  }

  remove(): void {
    //$(@inputEl).spinner("destroy")
    super.remove()
  }

  serializeValue(): any {
    return parseFloat(this.getValue()) || 0.0
  }

  loadValue(item: Item): void {
    super.loadValue(item)
    this.inputEl.defaultValue = this.defaultValue
    this.inputEl.select()
  }

  validateValue(value: any): any {
    if (isNaN(value))
      return { valid: false, msg: "Please enter a valid number" }
    else
      return super.validateValue(value)
  }
}

export class NumberEditor extends CellEditor {
  static initClass(): void {
    this.prototype.type = 'NumberEditor'
    this.prototype.default_view = NumberEditorView
    this.define({
      step: [ p.Number, 0.01 ],
    })
  }
}
NumberEditor.initClass()

export class TimeEditorView extends CellEditorView {
  model: TimeEditor

  inputEl: HTMLInputElement

  protected _createInput(): HTMLInputElement {
    return input({type: "text"})
  }
}

export class TimeEditor extends CellEditor {
  static initClass(): void {
    this.prototype.type = 'TimeEditor'
    this.prototype.default_view = TimeEditorView
  }
}
TimeEditor.initClass()

export class DateEditorView extends CellEditorView {
  model: DateEditor

  inputEl: HTMLInputElement

  protected _createInput(): HTMLInputElement {
    return input({type: "text"})
  }

  get emptyValue(): Date {
    return new Date()
  }

  renderEditor(): void {
    //this.calendarOpen = false

    //@$datepicker = $(@inputEl).datepicker({
    //  showOn: "button"
    //  buttonImageOnly: true
    //  beforeShow: () => @calendarOpen = true
    //  onClose: () => @calendarOpen = false
    //})
    //@$datepicker.siblings(".ui-datepicker-trigger").css("vertical-align": "middle")
    //@$datepicker.width(@$datepicker.width() - (14 + 2*4 + 4)) # img width + margins + edge distance
    this.inputEl.focus()
    this.inputEl.select()
  }

  destroy(): void {
    //$.datepicker.dpDiv.stop(true, true)
    //@$datepicker.datepicker("hide")
    //@$datepicker.datepicker("destroy")
    super.destroy()
  }

  show(): void {
    //if @calendarOpen
    //  $.datepicker.dpDiv.stop(true, true).show()
    super.show()
  }

  hide(): void {
    //if @calendarOpen
    //  $.datepicker.dpDiv.stop(true, true).hide()
    super.hide()
  }

  position(/*_position*/): any {
    //if @calendarOpen
    //  $.datepicker.dpDiv.css(top: position.top + 30, left: position.left)
    return super.position()
  }

  getValue(): any {}
    //return @$datepicker.datepicker("getDate").getTime()

  setValue(_val: any): void {}
}
    //@$datepicker.datepicker("setDate", new Date(val))

export class DateEditor extends CellEditor {
  static initClass(): void {
    this.prototype.type = 'DateEditor'
    this.prototype.default_view = DateEditorView
  }
}
DateEditor.initClass()
