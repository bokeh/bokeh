import {Model} from "../../model"
import {LayoutDOM} from "./layout_dom"
import * as p from "core/properties"

export namespace Panel {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    title: p.Property<string>
    child: p.Property<LayoutDOM>
    closable: p.Property<boolean>
  }
}

export interface Panel extends Panel.Attrs {}

export class Panel extends Model {
  override properties: Panel.Props

  constructor(attrs?: Partial<Panel.Attrs>) {
    super(attrs)
  }

  static init_Panel(): void {
    this.define<Panel.Props>(({Boolean, String, Ref}) => ({
      title:    [ String, "" ],
      child:    [ Ref(LayoutDOM) ],
      closable: [ Boolean, false ],
    }))
  }
}
