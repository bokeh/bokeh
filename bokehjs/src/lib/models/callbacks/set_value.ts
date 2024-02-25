import {Callback} from "./callback"
import {HasProps} from "core/has_props"
import {logger} from "core/logging"
import type * as p from "core/properties"

export namespace SetValue {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Callback.Props & {
    obj: p.Property<HasProps>
    attr: p.Property<string>
    value: p.Property<unknown>
  }
}

export interface SetValue extends SetValue.Attrs {}

export class SetValue extends Callback {
  declare properties: SetValue.Props

  constructor(attrs?: Partial<SetValue.Attrs>) {
    super(attrs)
  }

  static {
    this.define<SetValue.Props>(({Str, Unknown, Ref}) => ({
      obj: [ Ref(HasProps) ],
      attr: [ Str ],
      value: [ Unknown ],
    }))
  }

  execute(): void {
    const {obj, attr, value} = this
    if (attr in obj.properties) {
      obj.setv({[attr]: value})
    } else {
      logger.error(`${obj.type}.${attr} is not a property`)
    }
  }
}
