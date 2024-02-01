import {Callback} from "./callback"
import {Dialog} from "../ui/dialog"
import type * as p from "core/properties"

export namespace CloseDialog {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Callback.Props & {
    dialog: p.Property<Dialog>
  }
}

export interface CloseDialog extends CloseDialog.Attrs {}

export class CloseDialog extends Callback {
  declare properties: CloseDialog.Props

  constructor(attrs?: Partial<CloseDialog.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CloseDialog.Props>(({Ref}) => ({
      dialog: [ Ref(Dialog) ],
    }))
  }

  async execute(): Promise<void> {
    const {dialog} = this
    dialog.document?.views_manager?.find_one(dialog)?.close()
  }
}
