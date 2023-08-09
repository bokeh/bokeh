import {_convert_palette, _convert_color} from "./color_mapper"
import {ContinuousColorMapper} from "./continuous_color_mapper"
import {StackColorMapper} from "./stack_color_mapper"
import type * as p from "core/properties"
import type {Arrayable} from "core/types"

export namespace IndexedStackColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = StackColorMapper.Props & {
    single_color_mapper: p.Property<ContinuousColorMapper>
    index: p.Property<number>
    map_all: p.Property<boolean>
  }
}

export interface IndexedStackColorMapper extends IndexedStackColorMapper.Attrs {}

export class IndexedStackColorMapper extends StackColorMapper {
  declare properties: IndexedStackColorMapper.Props

  constructor(attrs?: Partial<IndexedStackColorMapper.Attrs>) {
    super(attrs)
  }

  static {
    this.define<IndexedStackColorMapper.Props>(({Boolean, Number, Ref}) => ({
      single_color_mapper: [ Ref(ContinuousColorMapper) ],
      index:               [ Number, 0 ],
      map_all:             [ Boolean, false ]
    }))
  }

  protected override _v_compute<T>(data: Arrayable<number>, values: Arrayable<T>,
      palette: Arrayable<T>, colors: {nan_color: T, low_color?: T, high_color?: T}): void {
    const {index} = this
    const n = values.length
    const max_index = data.length / n
    // TODO: check index is within bounds of 0 .. max_index-1

    const sub_data = new Array<number>(n)
    for (let i = 0; i < n; i++)
      sub_data[i] = data[i*max_index + index]  // do a slice or similar

    if (this.map_all) {
      // Need to reimplement single_color_mapper._v_compute as need to use our own scan_data
      const {nan_color} = colors
      let {low_color, high_color} = colors
      if (low_color == null)
        low_color = palette[0]
      if (high_color == null)
        high_color = palette[palette.length-1]

      // Calling scan using all of the 3D data.
      this.single_color_mapper._scan_data = this.single_color_mapper.scan(data, palette.length)
      this.single_color_mapper.metrics_change.emit()

      for (let i = 0, end = sub_data.length; i < end; i++) {
        const d = sub_data[i]

        if (isNaN(d))
          values[i] = nan_color
        else
          values[i] = this.single_color_mapper.cmap(d, palette, low_color, high_color)
      }
    } else {
      this.single_color_mapper._v_compute(sub_data, values, palette, colors)
    }

    this.metrics_change.emit()
  }
}
