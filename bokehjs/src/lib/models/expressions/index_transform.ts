import {CoordinateTransform} from "../expressions/coordinate_transform"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import * as p from "core/properties"

export namespace IndexTransform {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CoordinateTransform.Props & {
    index: p.IntSpec
    target: p.Property<GlyphRenderer>
  }
}

export interface IndexTransform extends IndexTransform.Attrs {}

export class IndexTransform extends CoordinateTransform {
  properties: IndexTransform.Props

  constructor(attrs?: Partial<IndexTransform.Attrs>) {
    super(attrs)
  }

  static init_IndexTransform(): void {
    this.define<IndexTransform.Props>(({Ref}) => ({
      index: [ p.IntSpec, {field: "index"} ],
      target: [ Ref(GlyphRenderer) ],
    }))
  }

  protected _v_compute(source: ColumnarDataSource) {
    const index = this.properties.index.uniform(source)
    //const {target} = this

    const n = index.length
    const x = new Float64Array(n)
    const y = new Float64Array(n)

    return {x, y}
  }
}
