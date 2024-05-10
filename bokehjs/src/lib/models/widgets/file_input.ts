import {InputWidget, InputWidgetView} from "./input_widget"
import type {StyleSheetLike} from "core/dom"
import {input} from "core/dom"
import {ClearInput} from "core/bokeh_events"
import {isString} from "core/util/types"
import * as p from "core/properties"
import * as inputs from "styles/widgets/inputs.css"
import buttons_css from "styles/buttons.css"

export class FileInputView extends InputWidgetView {
  declare model: FileInput
  declare input_el: HTMLInputElement

  override connect_signals(): void {
    super.connect_signals()

    this.model.on_event(ClearInput, () => {
      this.model.setv({
        value:     "", // p.unset,
        mime_type: "", // p.unset,
        filename:  "", // p.unset,
      })
      this.input_el.value = ""
    })
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), buttons_css]
  }

  protected _render_input(): HTMLElement {
    const {multiple, disabled} = this.model

    const accept = (() => {
      const {accept} = this.model
      return isString(accept) ? accept : accept.join(",")
    })()

    return this.input_el = input({type: "file", class: inputs.input, multiple, accept, disabled})
  }

  override render(): void {
    super.render()

    this.input_el.addEventListener("change", async () => {
      const {files} = this.input_el
      if (files != null) {
        await this.load_files(files)
      }
    })
  }

  async load_files(files: FileList): Promise<void> {
    const values: string[] = []
    const filenames: string[] = []
    const mime_types: string[] = []

    for (const file of files) {
      const data_url = await this._read_file(file)
      const [, mime_type="",, value=""] = data_url.split(/[:;,]/, 4)

      values.push(value)
      filenames.push(file.name)
      mime_types.push(mime_type)
    }

    const [value, filename, mime_type] = (() =>{
      if (this.model.multiple) {
        return [values, filenames, mime_types]
      } else if (files.length != 0) {
        return [values[0], filenames[0], mime_types[0]]
      } else {
        return ["", "", ""]
      }
    })()

    this.model.setv({value, filename, mime_type})
  }

  protected _read_file(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const {result} = reader
        if (result != null) {
          resolve(result as string)
        } else {
          reject(reader.error ?? new Error(`unable to read '${file.name}'`))
        }
      }
      reader.readAsDataURL(file)
    })
  }
}

export namespace FileInput {
  export type Attrs = p.AttrsOf<Props>
  export type Props = InputWidget.Props & {
    value: p.Property<string | string[]>
    mime_type: p.Property<string | string[]>
    filename: p.Property<string | string[]>
    accept: p.Property<string | string[]>
    multiple: p.Property<boolean>
  }
}

export interface FileInput extends FileInput.Attrs {}

export class FileInput extends InputWidget {
  declare properties: FileInput.Props
  declare __view_type__: FileInputView

  constructor(attrs?: Partial<FileInput.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = FileInputView

    this.define<FileInput.Props>(({Bool, Str, List, Or}) => ({
      value:     [ Or(Str, List(Str)), p.unset, {readonly: true} ],
      mime_type: [ Or(Str, List(Str)), p.unset, {readonly: true} ],
      filename:  [ Or(Str, List(Str)), p.unset, {readonly: true} ],
      accept:    [ Or(Str, List(Str)), "" ],
      multiple:  [ Bool, false ],
    }))
  }
}
