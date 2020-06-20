import * as p from "core/properties"
import {BoxSelectTool, BoxSelectToolView} from "models/tools/gestures/box_select_tool"
import {Rect} from "models/glyphs/rect"
import {ColumnDataSource} from "models/sources/column_data_source"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {ColumnarDataSource, MultiLine, Scale} from "models"
import {MoveEvent, PanEvent, TapEvent, KeyEvent} from "core/ui_events"
import {intersection, union, transpose} from "core/util/array"
import {SelectionMode} from "core/enums"
import {Keys} from "core/dom"

export interface HasRectCDS {
  glyph: Rect
  data_source: ColumnDataSource
}

export interface HasMultiLineCDS {
  glyph: MultiLine
  data_source: ColumnDataSource
}

type Action = "add" | "resize" | "drag"

type BoxParams = {
  x: number
  y: number
  h: number
  w: number
}

function find_indices_in(array: number[], [inf, sup]: [number, number]): number[] {
  return array.reduce((prev: number[], curr, index) =>
    (inf <= curr && curr <= sup) ? prev.concat(index) : prev, [])
}

function index_array(array: number[], indices: number[]): number[] {
  return indices.reduce((a: number[], i) => a.concat(array[i]), [])
}

function combineByKey(key: string, array: any[]) {
  const keys: string[] = Object.keys(array[0])
  const combined: any[] = []
  array.forEach((itm) => {
    const idx = combined.map(item => item[key]).indexOf(itm[key])
    if (idx >= 0) {
      keys.forEach(element => {
        if (element != key) combined[idx][element].push(itm[element])
      })
    } else {
      const new_object: any = {}
      keys.forEach(element => {
        if (element == key) {
          new_object[element] = itm[element]
        }
        else {
          new_object[element] = [itm[element]]
        }
      })
      combined.push(new_object)
    }
  })
  return combined
}


export class ParallelSelectionView extends BoxSelectToolView {
  model: ParallelSelectionTool

  private xscale: Scale
  private yscale: Scale
  private xdata: number[]
  private ydataT: number[][]
  private cds_select: ColumnDataSource
  private cds_data: ColumnDataSource
  private glyph_select: Rect
  private glyph_data: MultiLine
  private action: Action = "add"
  private ind_active_box: null | number
  private panning: boolean = false
  private _base_box_parameters: BoxParams | null
  private selection_indices: {
    data_idx: number
    indices: number[]
  }[] //must be synchronize with element of cds_select

  initialize(): void {
    super.initialize()

    const {frame} = this.plot_view

    const {x_range_name: x_range_name_select, y_range_name: y_range_name_select} = this.model.renderer_select
    const {x_range_name: x_range_name_data, y_range_name: y_range_name_data} = this.model.renderer_data

    if (x_range_name_select == x_range_name_data && y_range_name_select == y_range_name_data) {
      this.xscale = frame.x_scales.get(x_range_name_select)!
      this.yscale = frame.y_scales.get(y_range_name_select)!
    } else
      throw new Error("selection and data does not share the same ranges")

    //TODO test if parallel CDS is valid (xs for each line should be identical)
    this.glyph_select = this.model.renderer_select.glyph
    this.glyph_data = this.model.renderer_data.glyph

    this.cds_select = this.model.renderer_select.data_source
    this.cds_data = this.model.renderer_data.data_source

    const [xskey, yskey] = [(this.glyph_data as any).xs.field, (this.glyph_data as any).ys.field]
    this.xdata = this.cds_data.get_array(xskey)[0] as number[]
    this.ydataT = transpose(this.cds_data.get_array(yskey))
    this.selection_indices = []

    this.connect(frame.x_ranges.get(x_range_name_select)!.change, () => this._resize_boxes_on_zoom())
    this.connect(this.cds_select.change, () => this._update_data_selection())
  }

  get _box_width(): number {
    return this.xscale.invert(this.model.box_width) - this.xscale.invert(0)
  }

  get _cds_select_keys() {
    const glyph_select: any = this.glyph_select
    const [xkey, ykey] = [glyph_select.x.field, glyph_select.y.field]
    const [wkey, hkey] = [glyph_select.width.field, glyph_select.height.field]
    return {xkey, ykey, wkey, hkey}
  }

  _emit_cds_changes(cds: ColumnarDataSource, redraw: boolean = true,
      clear: boolean = true, emit: boolean = true): void {
    if (clear)
      cds.selection_manager.clear()
    if (redraw)
      cds.change.emit()
    if (emit) {
      cds.data = cds.data
      cds.properties.data.change.emit()
    }
  }

  _box_paramaters(index: number) {
    const {xkey, ykey, wkey, hkey} = this._cds_select_keys
    const x = this.cds_select.get_array<number>(xkey)[index]
    const y = this.cds_select.get_array<number>(ykey)[index]
    const w = this.cds_select.get_array<number>(wkey)[index]
    const h = this.cds_select.get_array<number>(hkey)[index]
    return {x, y, w, h}
  }

  _hit_test_boxes(sx: number, sy: number): number | null {
    const nboxes = this.cds_select.get_length()
    if (nboxes != 0 && nboxes != null) {
      const [xtest, ytest] = [this.xscale.invert(sx), this.yscale.invert(sy)]
      for (let i = 0; i < nboxes; i++) {
        const {x, y, w, h} = this._box_paramaters(i)
        if (xtest >= (x - w / 2) && xtest <= x + w / 2 &&
            ytest >= (y - h / 2) && ytest <= y + h / 2) {
          return i
        }
      }
    }

    return null
  }

  _resize_boxes_on_zoom() {
    //resize selection boxes when zooming to keep a constant (pixel) size
    const cds = this.cds_select
    const array_width = cds.get_array((this.glyph_select as any).width.field)
    const new_width = this._box_width
    array_width.forEach((_, i) => array_width[i] = new_width)
    this._emit_cds_changes(cds, true, false, false)
  }

  _drag_start(ev: PanEvent) {
    //Save y position of the drag start
    if (this.ind_active_box != null) {
      this._base_point = [this.xscale.invert(ev.sx), this.yscale.invert(ev.sy)]
      this._base_box_parameters = this._box_paramaters(this.ind_active_box)
    }
  }

  _update_box_ypos(index_box: number, delta_y: number) {
    if (this._base_box_parameters != null) {
      const cds = this.cds_select
      const {ykey} = this._cds_select_keys
      const {y: current_y, h} = this._base_box_parameters
      let new_y = current_y + delta_y
      new_y = new_y - Math.max(0, (new_y + h / 2) - 1) - Math.min(0, (new_y - h / 2))
      cds.get_array<number>(ykey)[index_box] = new_y
      this._emit_cds_changes(cds, true, false, false)
      this._update_selection_indices(index_box, [new_y - h / 2, new_y + h / 2])
    }
  }

  _drag(ev: PanEvent) {
    if (this.ind_active_box != null && this._base_point != null) {
      const delta_y = this.yscale.invert(ev.sy) - this._base_point[1]
      this._update_box_ypos(this.ind_active_box, delta_y)
    }
  }

  _drag_stop(_ev: PanEvent) {
    this._base_point = null
    this._base_box_parameters = null
  }

  _pan_start(ev: PanEvent) {
    this.panning = true
    switch (this.action) {
      case "add": {
        super._pan_start(ev)
        break
      }
      case "drag": {
        this._drag_start(ev)
        break
      }
      case "resize": {
        break
      }
    }
  }

  _pan(ev: PanEvent) {
    switch (this.action) {
      case "add": {
        super._pan(ev)
        break
      }
      case "drag": {
        this._drag(ev)
        break
      }
      case "resize": {
        break
      }
    }
  }

  _pan_end(ev: PanEvent) {
    switch (this.action) {
      case "add": {
        super._pan_end(ev)
        break
      }
      case "drag": {
        this._drag_stop(ev)
        break
      }
      case "resize": {
        break
      }
    }
    this.panning = false
  }

  _move(ev: MoveEvent) {
    //Switch mode
    if (this.panning) {return }
    this.ind_active_box = this._hit_test_boxes(ev.sx, ev.sy)
    if (this.ind_active_box != null) {
      this.action = "drag"
    } else {
      this.action = "add"
    }
  }

  _doubletap(_ev: TapEvent) {
    //delete box on double tap
    if (this.ind_active_box != null) {
      this.cds_select.columns().forEach(key => {
        this.cds_select.get_array(key).splice((this.ind_active_box as any), 1)
      })
      this._delete_selection_indices(this.ind_active_box)
      this._emit_cds_changes(this.cds_select)
    }
  }

  _keyup(ev: KeyEvent) {
    if (ev.keyCode == Keys.Esc) {
      const nelems = this.cds_select.get_length()
      if (nelems != null) {
        this.cds_select.columns().forEach(key => {
          this.cds_select.get_array(key).splice(0, nelems)
        })
        this.selection_indices.splice(0, nelems)
        this._emit_cds_changes(this.cds_select)
      }
      this.plot_view.request_render()
    }
  }

  _update_data_selection() {
    let selection_indices: number[] = []
    if (this.selection_indices.length > 0) {
      const combined_selections = combineByKey('data_idx', this.selection_indices)
      selection_indices = intersection(union<number>(...combined_selections[0].indices),
        ...combined_selections.slice(1).map(elem => union<number>(...elem.indices)))
    }
    this.cds_data.selected.indices = selection_indices
    this.cds_data.change.emit()
  }

  _make_selection_indices(indices: number[], [y0, y1]: [number, number]) {
    this.selection_indices.push(...indices.map(index => {
      return {
        data_idx: index,
        indices: find_indices_in(this.ydataT[index], [y0, y1]),
      }
    }))
  }

  _update_selection_indices(index: number, [y0, y1]: [number, number]) {
    this.selection_indices[index].indices = find_indices_in(this.ydataT[this.selection_indices[index].data_idx], [y0, y1])
  }

  _delete_selection_indices(index: number) {
    this.selection_indices.splice(index, 1)
  }

  _make_box_select(xs: number[], [y0, y1]: [number, number]): void {
    y0 = Math.max(0, y0)
    y1 = Math.min(1, y1)
    const y = (y0 + y1) / 2.
    const w = this._box_width
    const h = y1 - y0

    const {xkey, ykey, wkey, hkey} = this._cds_select_keys
    xs.forEach(x => {
      if (xkey) this.cds_select.get_array(xkey).push(x)
      if (ykey) this.cds_select.get_array(ykey).push(y)
      if (wkey) this.cds_select.get_array(wkey).push(w)
      if (hkey) this.cds_select.get_array(hkey).push(h)
    })
    this._emit_cds_changes(this.cds_select)
  }

  _do_select([sx0, sx1]: [number, number], [sy0, sy1]: [number, number], _final: boolean = true, _mode: SelectionMode): void {
    // Get selection bbox in the data space
    const [x0, x1] = this.xscale.r_invert(sx0, sx1)
    const [y0, y1] = this.yscale.r_invert(sy0, sy1)

    const x_indices = find_indices_in(this.xdata, [x0, x1])

    const xs = index_array(this.xdata, x_indices)

    this._make_selection_indices(x_indices, [y0, y1])
    this._make_box_select(xs, [y0, y1])
  }
}

export namespace ParallelSelectionTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BoxSelectTool.Props & {
    renderer_select: p.Property<GlyphRenderer & HasRectCDS>
    renderer_data: p.Property<GlyphRenderer & HasMultiLineCDS>
    box_width: p.Property<number>
  }
}

export interface ParallelSelectionTool extends ParallelSelectionTool.Attrs {}

export class ParallelSelectionTool extends BoxSelectTool {
  properties: ParallelSelectionTool.Props
  __view_type__: ParallelSelectionView

  static init_ParallelSelectionTool(): void {
    this.prototype.default_view = ParallelSelectionView

    this.define<ParallelSelectionTool.Props>({
      renderer_select: [ p.Any        ],
      renderer_data:   [ p.Any        ],
      box_width:       [ p.Number, 30 ],
    })
  }

  tool_name = "Parallel Selection"
  //override event_type property define in BoxSelectTool
  event_type: any = ["tap" as "tap", "pan" as "pan", "move" as "move"]
}
