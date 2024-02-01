import {Callback} from "./callback"
import {Dialog} from "../ui/dialog"
import type {ViewOf} from "core/build_views"
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

  protected _dialog_view: WeakRef<ViewOf<Dialog>> | null = null
  async execute(): Promise<void> {
    const {dialog} = this
    const views = dialog.document?.views_manager
    if (views != null) {
      let dialog_view = this._dialog_view?.deref()
      if (dialog_view == null) {
        dialog_view = await views.build_view(dialog)
        this._dialog_view = new WeakRef(dialog_view)
      }
      dialog_view.open()
    } else {
      //logger.warning("TODO")
    }
  }
}
