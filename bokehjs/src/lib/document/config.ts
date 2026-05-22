import {Model} from "../model"
import {Notifications} from "models/ui/notifications"
import {ColorScheme} from "core/enums"
import {I18n} from "core/i18n"
import type * as p from "core/properties"

export namespace DocumentConfig {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    reconnect_session: p.Property<boolean>
    notify_connection_status: p.Property<boolean>
    notifications: p.Property<Notifications | null>
    color_scheme: p.Property<ColorScheme>
  }
}

export interface DocumentConfig extends DocumentConfig.Attrs {}

export class DocumentConfig extends Model {
  declare properties: DocumentConfig.Props
  declare i18n: I18n

  constructor(attrs?: Partial<DocumentConfig.Attrs>) {
    super(attrs)
    // TODO: What should be set as default values?
    this.i18n = new I18n(
      ["en"],
      `{
        "en": {}
       }`,
      [
        ["English", "en"],
      ],
      "en",
      false,
    )
  }

  static {
    this.define<DocumentConfig.Props>(({Bool, Ref, Nullable}) => ({
      reconnect_session: [ Bool, true ],
      notify_connection_status: [ Bool, true ],
      notifications: [ Nullable(Ref(Notifications)), () => new Notifications() ],
      color_scheme: [ ColorScheme, "auto"],
    }))
  }
}
