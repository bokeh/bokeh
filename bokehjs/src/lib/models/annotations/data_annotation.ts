import {Annotation, AnnotationView} from "./annotation"
import {IndexedDataSource} from "../sources/indexed_data_source"
import {ColumnDataSource} from "../sources/column_data_source"

import type {Context2d} from "core/util/canvas"
import type {Arrayable} from "core/types"
import {project_xy, project_xsys} from "core/util/projections"
import * as p from "core/properties"

export abstract class DataAnnotationView extends AnnotationView {
  declare model: DataAnnotation

  private _projected_x?: Arrayable<number>
  private _projected_y?: Arrayable<number>
  private _projected_xs?: Arrayable<number>[]
  private _projected_ys?: Arrayable<number>[]

  override connect_signals(): void {
    super.connect_signals()
    let pending_update: Promise<void> | null = null
    const update = () => {
      if (pending_update == null) {
        pending_update = (async () => {
          // A source mutation can emit both change signals in the same turn.
          await Promise.resolve()
          pending_update = null
          if (this.is_destroyed) {
            return
          }
          this.set_data(this.model.source)
          this._initial_set_data = true
          this._rerender()
        })()
      }
      return pending_update
    }
    this.connect(this.model.change, update)
    this.on_transitive_change(this.model.properties.source, update)
    this.on_transitive_change(this.model.properties.source, update, {
      signal: (source) => (source as IndexedDataSource).data_changed,
    })
  }

  protected _rerender(): void {
    this.request_paint()
  }

  set_data(source: IndexedDataSource): void {
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
        [this._projected_x, this._projected_y] = project_xy(self._x, self._y, this._projected_x, this._projected_y)
        self._x = this._projected_x
        self._y = this._projected_y
      }
      if (self._xs != null) {
        [this._projected_xs, this._projected_ys] = project_xsys(self._xs, self._ys, this._projected_xs, this._projected_ys)
        self._xs = this._projected_xs
        self._ys = this._projected_ys
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
    source: p.Property<IndexedDataSource>
  }

  export type Visuals = Annotation.Visuals
}

export interface DataAnnotation extends DataAnnotation.Attrs {}

export abstract class DataAnnotation extends Annotation {
  declare properties: DataAnnotation.Props
  declare __view_type__: DataAnnotationView

  static {
    this.define<DataAnnotation.Props>(({Ref}) => ({
      source: [ Ref(IndexedDataSource), () => ColumnDataSource.create() ],
    }))
  }
}
