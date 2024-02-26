import type * as p from "core/properties"
import {input, textarea, select, option} from "core/dom"
import {isInteger, isString} from "core/util/types"

import {DOMComponentView} from "core/dom_view"
import {Model} from "../../../model"
import type {Item} from "./definitions"
import {DTINDEX_NAME} from "./definitions"

import * as tables from "styles/widgets/tables.css"

export abstract class CellEditorView extends DOMComponentView {
  declare model: CellEditor

  defaultValue: any

  get emptyValue(): any {
    return null
  }

  inputEl: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

  protected args: any

  protected abstract _createInput(): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

  constructor(options: any) {
    const {model, parent} = options.column
    super({model, parent, ...options})
    this.args = options
    this.initialize() // XXX: no build_views()
    this.render()     // XXX: this isn't governed by layout
  }

  override initialize(): void {
    super.initialize()
    this.inputEl = this._createInput()
    this.defaultValue = null
  }

  override async lazy_initialize(): Promise<void> {
    throw new Error("unsupported")
  }

  override css_classes(): string[] {
    return super.css_classes().concat(tables.cell_editor)
  }

  override render(): void {
    this.args.container.append(this.el)
    this.shadow_el.appendChild(this.inputEl)
    this.renderEditor()
    this.disableNavigation()
  }

  renderEditor(): void {}

  disableNavigation(): void {
    // XXX: without cast `event` is of non-specific type `Event`
    (this.inputEl as HTMLElement).addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown":
        case "PageUp":
        case "PageDown": {
          event.stopImmediatePropagation()
          break
        }
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

    return {valid: true, msg: null}
  }

  validate(): any {
    return this.validateValue(this.getValue())
  }
}

export namespace CellEditor {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface CellEditor extends CellEditor.Attrs {}

export abstract class CellEditor extends Model {
  declare properties: CellEditor.Props
  declare __view_type__: CellEditorView
}

export class StringEditorView extends CellEditorView {
  declare model: StringEditor

  declare inputEl: HTMLInputElement

  override get emptyValue(): string {
    return ""
  }

  protected _createInput(): HTMLInputElement {
    return input({type: "text"})
  }

  override renderEditor(): void {
    //completions = @model.completions
    //if completions.length != 0
    //  @inputEl.classList.add("bk-cell-editor-completion")
    //  $(@inputEl).autocomplete({source: completions})
    //  $(@inputEl).autocomplete("widget")
    this.inputEl.focus()
    this.inputEl.select()
  }

  override loadValue(item: Item): void {
    super.loadValue(item)
    this.inputEl.defaultValue = this.defaultValue
    this.inputEl.select()
  }
}

export namespace StringEditor {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CellEditor.Props & {
    completions: p.Property<string[]>
  }
}

export interface StringEditor extends StringEditor.Attrs {}

export class StringEditor extends CellEditor {
  declare properties: StringEditor.Props

  static {
    this.prototype.default_view = StringEditorView
    this.define<StringEditor.Props>(({Str, Array}) => ({
      completions: [ Array(Str), [] ],
    }))
  }
}

export class TextEditorView extends CellEditorView {
  declare model: TextEditor

  declare inputEl: HTMLTextAreaElement

  protected _createInput(): HTMLTextAreaElement {
    return textarea()
  }

  override renderEditor(): void {
    this.inputEl.focus()
    this.inputEl.select()
  }
}

export namespace TextEditor {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CellEditor.Props
}

export interface TextEditor extends TextEditor.Attrs {}

export class TextEditor extends CellEditor {
  declare properties: TextEditor.Props

  static {
    this.prototype.default_view = TextEditorView
  }
}

export class SelectEditorView extends CellEditorView {
  declare model: SelectEditor

  declare inputEl: HTMLSelectElement

  protected _createInput(): HTMLSelectElement {
    return select()
  }

  override renderEditor(): void {
    for (const opt of this.model.options) {
      this.inputEl.appendChild(option({value: opt}, opt))
    }
    this.focus()
  }
}

export namespace SelectEditor {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CellEditor.Props & {
    options: p.Property<string[]>
  }
}

export interface SelectEditor extends SelectEditor.Attrs {}

export class SelectEditor extends CellEditor {
  declare properties: SelectEditor.Props

  static {
    this.prototype.default_view = SelectEditorView
    this.define<SelectEditor.Props>(({Str, Array}) => ({
      options: [ Array(Str), [] ],
    }))
  }
}

export class PercentEditorView extends CellEditorView {
  declare model: PercentEditor

  declare inputEl: HTMLInputElement

  protected _createInput(): HTMLInputElement {
    return input({type: "text"})
  }
}

export namespace PercentEditor {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CellEditor.Props
}

export interface PercentEditor extends PercentEditor.Attrs {}

export class PercentEditor extends CellEditor {
  declare properties: PercentEditor.Props

  static {
    this.prototype.default_view = PercentEditorView
  }
}

export class CheckboxEditorView extends CellEditorView {
  declare model: CheckboxEditor

  declare inputEl: HTMLInputElement

  protected _createInput(): HTMLInputElement {
    return input({type: "checkbox"})
  }

  override renderEditor(): void {
    this.focus()
  }

  override loadValue(item: Item): void {
    this.defaultValue = !!item[this.args.column.field]
    this.inputEl.checked = this.defaultValue
  }

  override serializeValue(): any {
    return this.inputEl.checked
  }
}

export namespace CheckboxEditor {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CellEditor.Props
}

export interface CheckboxEditor extends CheckboxEditor.Attrs {}

export class CheckboxEditor extends CellEditor {
  declare properties: CheckboxEditor.Props

  static {
    this.prototype.default_view = CheckboxEditorView
  }
}

export class IntEditorView extends CellEditorView {
  declare model: IntEditor

  declare inputEl: HTMLInputElement

  protected _createInput(): HTMLInputElement {
    return input({type: "text"})
  }

  override renderEditor(): void {
    //$(@inputEl).spinner({step: @model.step})
    this.inputEl.focus()
    this.inputEl.select()
  }

  override remove(): void {
    //$(@inputEl).spinner("destroy")
    super.remove()
  }

  override serializeValue(): any {
    const value = parseInt(this.getValue(), 10)
    return isNaN(value) ? 0 : value
  }

  override loadValue(item: Item): void {
    super.loadValue(item)
    this.inputEl.defaultValue = this.defaultValue
    this.inputEl.select()
  }

  override validateValue(value: unknown): any {
    if (isString(value)) {
      value = Number(value)
    }

    if (isInteger(value)) {
      return super.validateValue(value)
    } else {
      return {valid: false, msg: "Please enter a valid integer"}
    }
  }
}

export namespace IntEditor {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CellEditor.Props & {
    step: p.Property<number>
  }
}

export interface IntEditor extends IntEditor.Attrs {}

export class IntEditor extends CellEditor {
  declare properties: IntEditor.Props

  static {
    this.prototype.default_view = IntEditorView
    this.define<IntEditor.Props>(({Int}) => ({
      step: [ Int, 1 ],
    }))
  }
}

export class NumberEditorView extends CellEditorView {
  declare model: NumberEditor

  declare inputEl: HTMLInputElement

  protected _createInput(): HTMLInputElement {
    return input({type: "text"})
  }

  override renderEditor(): void {
    //$(@inputEl).spinner({step: @model.step})
    this.inputEl.focus()
    this.inputEl.select()
  }

  override remove(): void {
    //$(@inputEl).spinner("destroy")
    super.remove()
  }

  override serializeValue(): any {
    const value = parseFloat(this.getValue())
    return isNaN(value) ? 0.0 : value
  }

  override loadValue(item: Item): void {
    super.loadValue(item)
    this.inputEl.defaultValue = this.defaultValue
    this.inputEl.select()
  }

  override validateValue(value: any): any {
    if (isNaN(value)) {
      return {valid: false, msg: "Please enter a valid number"}
    } else {
      return super.validateValue(value)
    }
  }
}

export namespace NumberEditor {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CellEditor.Props & {
    step: p.Property<number>
  }
}

export interface NumberEditor extends NumberEditor.Attrs {}

export class NumberEditor extends CellEditor {
  declare properties: NumberEditor.Props

  static {
    this.prototype.default_view = NumberEditorView
    this.define<NumberEditor.Props>(({Float}) => ({
      step: [ Float, 0.01 ],
    }))
  }
}

export class TimeEditorView extends CellEditorView {
  declare model: TimeEditor

  declare inputEl: HTMLInputElement

  protected _createInput(): HTMLInputElement {
    return input({type: "text"})
  }
}

export namespace TimeEditor {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CellEditor.Props
}

export interface TimeEditor extends TimeEditor.Attrs {}

export class TimeEditor extends CellEditor {
  declare properties: TimeEditor.Props

  static {
    this.prototype.default_view = TimeEditorView
  }
}

export class DateEditorView extends CellEditorView {
  declare model: DateEditor

  declare inputEl: HTMLInputElement

  protected _createInput(): HTMLInputElement {
    return input({type: "text"})
  }

  override get emptyValue(): Date {
    return new Date()
  }

  override renderEditor(): void {
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

  override destroy(): void {
    //$.datepicker.dpDiv.stop(true, true)
    //@$datepicker.datepicker("hide")
    //@$datepicker.datepicker("destroy")
    super.destroy()
  }

  override show(): void {
    //if @calendarOpen
    //  $.datepicker.dpDiv.stop(true, true).show()
    super.show()
  }

  override hide(): void {
    //if @calendarOpen
    //  $.datepicker.dpDiv.stop(true, true).hide()
    super.hide()
  }

  override position(/*_position*/): any {
    //if @calendarOpen
    //  $.datepicker.dpDiv.css(top: position.top + 30, left: position.left)
    return super.position()
  }

  override getValue(): any {
    //return @$datepicker.datepicker("getDate").getTime()
  }

  override setValue(_val: any): void {
    //@$datepicker.datepicker("setDate", new Date(val))
  }
}

export namespace DateEditor {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CellEditor.Props
}

export interface DateEditor extends DateEditor.Attrs {}

export class DateEditor extends CellEditor {
  declare properties: DateEditor.Props

  static {
    this.prototype.default_view = DateEditorView
  }
}
