import {Class} from "core/class"
import {View} from "core/view"
import {CellEditor} from "models/widgets/tables/cell_editors"
import {GroupTotals} from "models/widgets/tables/row_aggregators"

export type Item = {[key: string]: any}

interface EventData {
  stopPropagation: () => void
  isPropagationStopped: () => boolean
  stopImmediatePropagation: () => void
  isImmediatePropagationStopped: () => boolean
}

interface SlickEvent {
  subscribe: (handler: (this: SlickGrid, e: EventData, args?: any) => any) => void
  unsubscribe: (handler: (this: SlickGrid, e: EventData, args?: any) => any) => void
  notify: (args: any, e: EventData, scope?: any) => any
}

interface Editor {
  init: () => void
  destroy: () => void
  show: () => void
  hide: () => void
  position: () => void
  focus: () => void
  getValue: () => unknown
  setValue: (value: unknown) => void
  loadValue: (item: Object) => void
  serializeValue: () => unknown
  applyValue: (item: Object, state: unknown) => void
  isValueChanged: () => boolean
  validate: () => {valid: boolean, msg: string | null}
}

export interface Formatter {
  (row: number, cell: number, value: unknown, columnDef: Column, dataContext: Item): string | null
}

export type Column = {
  id: string
  field: string
  name: string
  width?: number
  toolTip?: string
  resizable?: boolean
  sortable?: boolean
  selectable?: boolean
  defaultSortAsc?: boolean
  behavior?: "select" | "selectAndMove"
  cannotTriggerInsert?: boolean
  cssClass?: string
  headerCssClass?: string
  formatter?: (...args: any[]) => string | null
  model?: CellEditor
  editor?: Class<View>
}

export interface SlickGrid {
  onSort: SlickEvent
  onClick: SlickEvent
  onSelectedRowsChanged: SlickEvent

  registerPlugin: (plugin: object) => void
  getColumns: () => Column[]
  getColumnIndex: (id: string) => number
  getSortColumns: () => Column[]
  getData: () => any
  getDataItem: (id: number) => Item
  setSelectionModel: (model: object) => void
  setSelectedRows: (rows: any[]) => void

  render: () => void
  invalidate: () => void
  getViewport: () => { top: number, bottom: number, leftPx: number, rightPx: number }
  resizeCanvas: () => void
  scrollRowToTop: (row: number) => void
}

export interface Group {
  level: number
  count: number
  value: unknown
  title: string | null
  collapsed: boolean
  totals: GroupTotals
  rows: number[]
  groups: Group[]
  groupingKey: string
}

export interface GroupTotals {
  group: Group
  initialized: boolean
}

export interface Aggregator {
  field_: string
  init(): void
  accumulate(item: Item): void
  storeResult(total: GroupTotals): void
}