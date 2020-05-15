import * as p from "core/properties"
import {Widget, WidgetView} from "models/widgets/widget"

export class FileInputView extends WidgetView {
  model: FileInput

  protected dialogEl: HTMLInputElement

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
    this.connect(this.model.properties.width.change, () => this.render())
  }

  render(): void {
    if (this.dialogEl == null) {
      this.dialogEl = document.createElement('input')
      this.dialogEl.type = "file"
      this.dialogEl.multiple = this.model.multiple
      this.dialogEl.onchange = () => {
        const {files} = this.dialogEl
        if (files != null) {
          this.load_files(files)
        }
      }
      this.el.appendChild(this.dialogEl)
    }
    if (this.model.accept != null && this.model.accept != '')
      this.dialogEl.accept = this.model.accept

    this.dialogEl.style.width = `{this.model.width}px`
    this.dialogEl.disabled = this.model.disabled
  }

  async load_files(files: FileList): Promise<void> {
    const value: string[] = []
    const filename: string[] = []
    const mime_type: string[] = []
    let i: number

    for (i = 0; i < files.length; i++){
      filename.push(files[i].name)
      const data_url = await this.readfile(files[i])
      const [, mime, , data] = data_url.split(/[:;,]/, 4)
      value.push(data)
      mime_type.push(mime)
    }
    if (this.model.multiple) {
      this.model.filename = filename
      this.model.mime_type = mime_type
      this.model.value = value
    } else {
      this.model.filename = filename[0]
      this.model.mime_type = mime_type[0]
      this.model.value = value[0]
    }
  }

  readfile(file: File): Promise<string> {
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
    value: p.Property<string|string[]>
    mime_type: p.Property<string|string[]>
    filename: p.Property<string|string[]>
    accept: p.Property<string>
    multiple: p.Property<boolean>
  }
}

export interface FileInput extends FileInput.Attrs {}

export abstract class FileInput extends Widget {

  properties: FileInput.Props
  __view_type__: FileInputView

  constructor(attrs?: Partial<FileInput.Attrs>) {
    super(attrs)
  }

  static init_FileInput(): void {
    this.prototype.default_view = FileInputView

    this.define<FileInput.Props>({
      value:     [ p.Any, '' ],
      mime_type: [ p.Any, '' ],
      filename:  [ p.Any, '' ],
      accept:    [ p.String, '' ],
      multiple:  [ p.Boolean, false ],
    })
  }
}
