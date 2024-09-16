import {Annotation, AnnotationView} from "./annotation"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {ColumnDataSource} from "../sources/column_data_source"

import type {Context2d} from "core/util/canvas"
import {inplace} from "core/util/projections"
import * as p from "core/properties"

export abstract class DataAnnotationView extends AnnotationView {
  declare model: DataAnnotation

  override connect_signals(): void {
    super.connect_signals()
    const update = () => {
      this.set_data(this.model.source)
      this._rerender()
    }
    this.connect(this.model.change, update)
    this.connect(this.model.source.streaming, update)
    this.connect(this.model.source.patching, update)
    this.connect(this.model.source.change, update)
  }

  protected _rerender(): void {
    this.request_paint()
  }

  set_data(source: ColumnarDataSource): void {
    const self = this as any
    for (const prop of this.model) {
      if (!(prop instanceof p.VectorSpec || prop instanceof p.ScalarSpec)) {
        continue
      }

      if (prop instanceof p.BaseCoordinateSpec) {
        const array = prop.array(source)
        self[`_${prop.attr}`] = array
      } else {
        const uniform = prop.uniform(source)
        self[`${prop.attr}`] = uniform
      }
    }

    if (this.plot_model.use_map) {
      if (self._x != null) {
        inplace.project_xy(self._x, self._y)
      }
      if (self._xs != null) {
        inplace.project_xsys(self._xs, self._ys)
      }
    }

    for (const visual of this.visuals) {
      visual.update()
    }
  }

  abstract map_data(): void

  abstract _paint_data(ctx: Context2d): void

  private _initial_set_data = false

  protected _paint(ctx: Context2d): void {
    if (!this._initial_set_data) {
      this.set_data(this.model.source)
      this._initial_set_data = true
    }
    this.map_data()
    this._paint_data(ctx)
  }
}

export namespace DataAnnotation {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    source: p.Property<ColumnarDataSource>
  }

  export type Visuals = Annotation.Visuals
}

export interface DataAnnotation extends DataAnnotation.Attrs {}

export abstract class DataAnnotation extends Annotation {
  declare properties: DataAnnotation.Props
  declare __view_type__: DataAnnotationView

  constructor(attrs?: Partial<DataAnnotation.Attrs>) {
    super(attrs)
  }

  static {
    this.define<DataAnnotation.Props>(({Ref}) => ({
      source: [ Ref(ColumnarDataSource), () => new ColumnDataSource() ],
    }))
  }
}
