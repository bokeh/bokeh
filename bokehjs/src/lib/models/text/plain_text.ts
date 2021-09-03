import {BaseText} from "./base_text"
import * as p from "core/properties"

export namespace PlainText {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseText.Props & {
    text: p.Property<string>
  }
}

export interface PlainText extends PlainText.Attrs {}

export class PlainText extends BaseText {
  override properties: PlainText.Props

  constructor(attrs?: Partial<PlainText.Attrs>) {
    super(attrs)
  }
}
