import type {Column} from "@bokeh/slickgrid"
import type {CellEditor} from "./cell_editors"
import type {Comparison} from "../../../models/comparisons"

export type Item = {[key: string]: any}
export type ColumnType = Column<Item> & {model?: CellEditor, sorter?: Comparison | null}

export const DTINDEX_NAME = "__bkdt_internal_index__"
