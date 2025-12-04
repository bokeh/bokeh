import {Model} from "../model"
import {Notifications} from "models/ui/notifications"
import type * as p from "core/properties"

export namespace DocumentConfig {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    reconnect_session: p.Property<boolean>
    notify_connection_status: p.Property<boolean>
    notifications: p.Property<Notifications | null>
  }
}

export interface DocumentConfig extends DocumentConfig.Attrs {}

export class DocumentConfig extends Model {
  declare properties: DocumentConfig.Props

  constructor(attrs?: Partial<DocumentConfig.Attrs>) {
    super(attrs)
  }

  static {
    this.define<DocumentConfig.Props>(({Bool, Ref, Nullable}) => ({
      reconnect_session: [ Bool, true ],
      notify_connection_status: [ Bool, true ],
      notifications: [ Nullable(Ref(Notifications)), () => new Notifications() ],
    }))
  }
}
