import {ContinuousColorMapper} from "./continuous_color_mapper"
import type {Arrayable} from "core/types"
import {left_edge_index} from "core/util/arrayable"
import type * as p from "core/properties"

export type ScanningScanData = {
  min: number
  max: number
  binning: Arrayable<number>
  force_low_cutoff: boolean
}

export namespace ScanningColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousColorMapper.Props
}

export interface ScanningColorMapper extends ScanningColorMapper.Attrs {}

export abstract class ScanningColorMapper extends ContinuousColorMapper {
  declare properties: ScanningColorMapper.Props

  constructor(attrs?: Partial<ScanningColorMapper.Attrs>) {
    super(attrs)
  }

  declare MatricsType: {min: number, max: number, binning: Arrayable<number>, force_low_cutoff: boolean}

  override index_to_value(index: number): number {
    const scan_data = this._scan_data as ScanningScanData
    return scan_data.binning[index]
  }

  override value_to_index(value: number, palette_length: number): number {
    const scan_data = this._scan_data as ScanningScanData

    if (value < scan_data.binning[0]) {
      return -1
    } else if (value > scan_data.binning[scan_data.binning.length-1]) {
      return palette_length
    } else {
      return left_edge_index(value, scan_data.binning)
    }
  }
}
