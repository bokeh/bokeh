import type {Column} from "slickgrid"
import type {CellEditor} from "./cell_editors"

export type Item = {[key: string]: any}
export type ColumnType = Column<Item> & {model?: CellEditor}

export const DTINDEX_NAME = "__bkdt_internal_index__"
