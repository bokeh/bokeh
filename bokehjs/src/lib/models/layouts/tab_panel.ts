import {Tooltip} from "models/ui/tooltip"
import {Model} from "../../model"
import {UIElement} from "../ui/ui_element"
import {HTML} from "../dom/html"
import type * as p from "core/properties"

export namespace TabPanel {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    title: p.Property<string>
    tooltip: p.Property<string | HTML | Tooltip | null>
    child: p.Property<UIElement>
    closable: p.Property<boolean>
    disabled: p.Property<boolean>
  }
}

export interface TabPanel extends TabPanel.Attrs {}

export class TabPanel extends Model {
  declare properties: TabPanel.Props

  protected constructor(attrs?: Partial<TabPanel.Attrs>) {
    super(attrs)
  }

  static {
    this.define<TabPanel.Props>(({Bool, Str, Ref, Nullable, Or}) => ({
      title:    [ Str, "" ],
      tooltip:  [ Nullable(Or(Str, Ref(HTML), Ref(Tooltip))), null ],
      child:    [ Ref(UIElement) ],
      closable: [ Bool, false ],
      disabled: [ Bool, false ],
    }))
  }
}
