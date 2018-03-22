import {Model} from "../../model"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {StringSpec, isValue, isField} from "core/vectorization"
import * as p from "core/properties"
import {logger} from "core/logging"
import {uniq, includes} from "core/util/array"

export namespace LegendItem {
  export interface Attrs extends Model.Attrs {
    label: StringSpec | null
    renderers: GlyphRenderer[]
  }

  export interface Props extends Model.Props {}
}

export interface LegendItem extends LegendItem.Attrs {}

export class LegendItem extends Model {

  properties: LegendItem.Props

  constructor(attrs?: Partial<LegendItem.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "LegendItem"

    this.define({
      label:     [ p.StringSpec, null ],
      renderers: [ p.Array,      []   ],
    })
  }

  protected _check_data_sources_on_renderers() {
    const field = this.get_field_from_label_prop()
    if (field != null) {
      if (this.renderers.length < 1) {
        return false
      }
      const source = this.renderers[0].data_source
      if (source != null) {
        for (const r of this.renderers) {
          if (r.data_source != source) {
            return false
          }
        }
      }
    }
    return true
  }

  protected _check_field_label_on_data_source() {
    const field = this.get_field_from_label_prop()
    if (field != null) {
      if (this.renderers.length < 1) {
        return false
      }
      const source = this.renderers[0].data_source
      if (source != null && !includes(source.columns(), field)) {
        return false
      }
    }
    return true
  }


  initialize(): void {
    super.initialize()

    // Validate data_sources match
    const data_source_validation = this._check_data_sources_on_renderers()
    if (!data_source_validation)
      logger.error("Non matching data sources on legend item renderers")

    // Validate label in data_source
    const field_validation = this._check_field_label_on_data_source()
    if (!field_validation)
      logger.error(`Bad column name on label: ${this.label}`)
  }

  get_field_from_label_prop(): string | null {
    const {label} = this
    return isField(label) ? label.field : null
  }

  get_labels_list_from_label_prop(): string[] {
    // Always return a list of the labels
    if (isValue(this.label))
      return [this.label.value]

    const field = this.get_field_from_label_prop()
    if (field != null) {
      let source: ColumnarDataSource
      if (this.renderers[0] && this.renderers[0].data_source != null)
        source = this.renderers[0].data_source
      else
        return ["No source found"]

      if (source instanceof ColumnarDataSource) {
        const data = source.get_column(field)
        if (data != null)
          return uniq(Array.from(data))
        else
          return ["Invalid field"]
      }
    }

    return []
  }
}
LegendItem.initClass()
