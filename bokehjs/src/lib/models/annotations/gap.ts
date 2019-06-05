import {Annotation, AnnotationView} from "./annotation"
import {Size} from "core/types"
import * as p from "core/properties"

export class GapView extends AnnotationView {
  model: Gap

  readonly rotate: boolean = true

  protected _get_size(): Size {
    return {width: 0, height: this.model.size}
  }
}

export namespace Gap {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    size: p.Property<number>
  }
}

export interface Gap extends Gap.Attrs {}

export class Gap extends Annotation {
  properties: Gap.Props

  constructor(attrs?: Partial<Gap.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Gap"
    this.prototype.default_view = GapView

    this.define<Gap.Props>({
      size: [ p.Number ],
    })
  }
}
Gap.initClass()
