import {Callback} from "./callback"
import {Dialog} from "../ui/dialog"
import type {ViewOf} from "core/build_views"
import {build_view} from "core/build_views"
import type * as p from "core/properties"

export namespace OpenDialog {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Callback.Props & {
    dialog: p.Property<Dialog>
  }
}

export interface OpenDialog extends OpenDialog.Attrs {}

export class OpenDialog extends Callback {
  declare properties: OpenDialog.Props

  constructor(attrs?: Partial<OpenDialog.Attrs>) {
    super(attrs)
  }

  static {
    this.define<OpenDialog.Props>(({Ref}) => ({
      dialog: [ Ref(Dialog) ],
    }))
  }

  protected _dialog_view: ViewOf<Dialog> | null = null
  async execute(): Promise<void> {
    if (this._dialog_view == null) {
      this._dialog_view = await build_view(this.dialog, {parent: null})
    }
    this._dialog_view.open()
  }
}
