import {Model} from "../model"
import {Notifications} from "models/ui/notifications"
import {ColorScheme} from "core/enums"
import type {KeyBinding} from "models/ui/key_binding"
import type * as p from "core/properties"

export namespace DocumentConfig {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    reconnect_session: p.Property<boolean>
    notify_connection_status: p.Property<boolean>
    notifications: p.Property<Notifications | null>
    color_scheme: p.Property<ColorScheme>
    key_bindings: p.Property<KeyBinding[]>
  }
}

export interface DocumentConfig extends DocumentConfig.Attrs {}

export class DocumentConfig extends Model {
  declare properties: DocumentConfig.Props

  static {
    this.define<DocumentConfig.Props>(({Bool, Ref, Nullable, List, AnyRef}) => ({
      reconnect_session: [ Bool, true ],
      notify_connection_status: [ Bool, true ],
      notifications: [ Nullable(Ref(Notifications)), () => Notifications.create() ],
      color_scheme: [ ColorScheme, "auto"],
      key_bindings: [ List(AnyRef()), [] ], // TODO Ref(KeyBinding)
    }))
  }
}
