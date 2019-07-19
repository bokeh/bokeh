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
    if (this.dialogEl) {
      return
    }
    this.dialogEl = document.createElement('input')
    this.dialogEl.type = "file"
    this.dialogEl.multiple = false
    if (this.model.accept != null && this.model.accept != '')
      this.dialogEl.accept = this.model.accept
    this.dialogEl.style.width = `{this.model.width}px`
    this.dialogEl.onchange = (e) => this.load_file(e)
    this.el.appendChild(this.dialogEl)
  }

  load_file(e: any): void {
    const reader = new FileReader()
    this.model.filename = e.target.files[0].name
    reader.onload = (e) => this.file(e)
    reader.readAsDataURL(e.target.files[0])
  }

  file(e: any): void {
    const file = e.target.result
    const file_arr = file.split(",")

    const content = file_arr[1]
    const header = file_arr[0].split(":")[1].split(";")[0]

    this.model.value = content
    this.model.mime_type = header

  }
}

export namespace FileInput {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Widget.Props & {
    value: p.Property<string>
    mime_type: p.Property<string>
    filename: p.Property<string>
    accept: p.Property<string>
  }
}

export interface FileInput extends FileInput.Attrs {}

export abstract class FileInput extends Widget {

  properties: FileInput.Props

  constructor(attrs?: Partial<FileInput.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "FileInput"
    this.prototype.default_view = FileInputView

    this.define<FileInput.Props>({
      value:     [ p.String, '' ],
      mime_type: [ p.String, '' ],
      filename:  [ p.String, '' ],
      accept:    [ p.String, '' ],
    })
  }
}

FileInput.initClass()
