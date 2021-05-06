import {input} from "core/dom"
import * as p from "core/properties"
import {Widget, WidgetView} from "models/widgets/widget"

export class FileInputView extends WidgetView {
  override model: FileInput

  protected dialog_el?: HTMLInputElement

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  override render(): void {
    const {multiple, accept, disabled, width} = this.model

    if (this.dialog_el == null) {
      this.dialog_el = input({type: "file", multiple})
      this.dialog_el.onchange = () => {
        const files = this.dialog_el?.files
        if (files != null) {
          this.load_files(files)
        }
      }
      this.shadow_el.appendChild(this.dialog_el)
    }

    if (accept != "") {
      this.dialog_el.accept = accept
    }

    this.dialog_el.style.width = `${width}px`
    this.dialog_el.disabled = disabled
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

    if (this.model.multiple)
      this.model.setv({value: values, filename: filenames, mime_type: mime_types})
    else
      this.model.setv({value: values[0], filename: filenames[0], mime_type: mime_types[0]})
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
  export type Props = Widget.Props & {
    value: p.Property<string | string[]>
    mime_type: p.Property<string | string[]>
    filename: p.Property<string | string[]>
    accept: p.Property<string>
    multiple: p.Property<boolean>
  }
}

export interface FileInput extends FileInput.Attrs {}

export class FileInput extends Widget {
  override properties: FileInput.Props
  override __view_type__: FileInputView

  constructor(attrs?: Partial<FileInput.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = FileInputView

    this.define<FileInput.Props>(({Boolean, String, Array, Or}) => ({
      value:     [ Or(String, Array(String)), "" ],
      mime_type: [ Or(String, Array(String)), "" ],
      filename:  [ Or(String, Array(String)), "" ],
      accept:    [ String, "" ],
      multiple:  [ Boolean, false ],
    }))
  }
}
