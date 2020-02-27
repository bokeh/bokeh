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
      this.dialogEl.onchange = async (e) => await this.load_files(e)
      this.el.appendChild(this.dialogEl)
    }
    if (this.model.accept != null && this.model.accept != '')
      this.dialogEl.accept = this.model.accept

    this.dialogEl.style.width = `{this.model.width}px`
    this.dialogEl.disabled = this.model.disabled
  }

  async load_files(e: any): Promise<void> {
    const files = e.target.files
    var i: number
    var value: string[] = []
    var filename: string[] = []
    var mime_type: string[] = []

    for (i=0; i<files.length; i++){
      filename.push(files[i].name)
      let content = await this.readfile(files[i])
      const file_arr = content.split(",")
      value.push(file_arr[1])
      mime_type.push(file_arr[0].split(":")[1].split(";")[0])
    }
    if (this.model.multiple) {
      this.model.filename = filename
      this.model.mime_type= mime_type
      this.model.value = value
    } else {
      this.model.filename = filename[0]
      this.model.mime_type= mime_type[0]
      this.model.value = value[0]
    }
  }

  readfile(file: any): Promise<string> {
    return new Promise<any>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target ? e.target.result : "")
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
