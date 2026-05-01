import type * as p from "core/properties"
import {span} from "core/dom"
import {is_nullish} from "core/util/types"
import type {
  Formatter, Column, ItemMetadata, ColumnMetadata, SlickEventData, SlickDataView as CustomDataView,
  SlickGroup as Group, SlickGroupTotals as GroupTotals,
} from "slickgrid"
import {SlickGrid, Group as SlickGroup} from "slickgrid"
import type {OnClickEventArgs} from "slickgrid"
import type {Item} from "./definitions"
import {DTINDEX_NAME} from "./definitions"
import {TableDataProvider, DataTableView, DataTable} from "./data_table"
import {ColumnDataSource} from "../../sources/column_data_source"
import type {CDSView} from "../../sources/cds_view"
import {RowAggregator} from "./row_aggregators"
import {Model} from "model"

type GroupDataContext = {
  collapsed: boolean
  level: number
  title: string
}

function groupCellFormatter(_row: number, _cell: number, _value: unknown, _columnDef: Column<Item>, dataContext: GroupDataContext): string {
  const {collapsed, level, title} = dataContext

  const toggle = span({
    class: `slick-group-toggle ${collapsed ? "collapsed" : "expanded"}`,
    style: {"margin-left": `${level * 15}px`},
  })
  const titleElement = span({
    class: "slick-group-title",
  }, title)

  return `${toggle.outerHTML}${titleElement.outerHTML}`
}

function indentFormatter(formatter?: Formatter<Item>, indent?: number): Formatter<Item> {
  return (row: number, cell: number, value: unknown, columnDef: Column<Item>, dataContext: Item, grid: SlickGrid<Item>) => {
    const spacer = span({
      class: "slick-group-toggle",
      style: {"margin-left": `${(indent ?? 0) * 15}px`, "background-color": "transparent"},
    })

    const result = formatter !== undefined ? formatter(row, cell, value, columnDef, dataContext, grid): `${value}`

    let formatted: string
    if (result instanceof Node) {
      const container = document.createElement("div")
      container.appendChild(result.cloneNode(true))
      formatted = container.innerHTML
    } else if (typeof result === "object") {
      if ("html" in result) {
        formatted = (result as any).html as unknown as string
      } else if ("text" in result) {
        formatted = (result as any).text as unknown as string
      } else {
        formatted = `${result}`
      }
    } else {
      formatted = typeof result === "string" ? result : `${result}`
    }

    const cleanContent = formatted
      .replace(/^<div/, "<span")
      .replace(/div>$/, "span>")

    return `${spacer.outerHTML}${cleanContent}`
  }
}

function handleGridClick(this: SlickGrid<Item>, event: SlickEventData, args: OnClickEventArgs): void {
  const item = this.getDataItem(args.row)

  if (item instanceof SlickGroup && (event.target as HTMLElement).classList.contains("slick-group-toggle")) {
    const dataView = this.getData<CustomDataView>()
    if (item.collapsed !== false) {
      dataView.expandGroup(item.groupingKey)
    } else {
      dataView.collapseGroup(item.groupingKey)
    }
    event.stopImmediatePropagation()
    event.preventDefault()
    this.invalidate()
    this.render()
  }
}

export namespace GroupingInfo {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    getter:      p.Property<string>
    aggregators: p.Property<RowAggregator[]>
    collapsed:   p.Property<boolean>
  }
}

export interface GroupingInfo extends GroupingInfo.Attrs {}

export class GroupingInfo extends Model {
  declare properties: GroupingInfo.Props

  constructor(attrs?: Partial<GroupingInfo.Attrs>) {
    super(attrs)
  }

  static {
    this.define<GroupingInfo.Props>(({Bool, Str, List, Ref}) => ({
      getter:      [ Str, "" ],
      aggregators: [ List(Ref(RowAggregator)), [] ],
      collapsed:   [ Bool, false ],
    }))
  }

  get comparer(): (a: Group, b: Group) => number {
    return (a, b) => {
      return (a as any).value === (b as any).value ? 0 : (a as any).value > (b as any).value ? 1 : -1
    }
  }
}

export class DataCubeProvider extends TableDataProvider {
  readonly columns: Column<Item>[]
  groupingInfos: GroupingInfo[]
  readonly groupingDelimiter: string
  toggledGroupsByLevel: {[key: string]: boolean}[]
  private rows: (Group | number)[]
  target: ColumnDataSource

  constructor(source: ColumnDataSource, view: CDSView, columns: Column<Item>[], target: ColumnDataSource) {
    super(source, view)
    this.columns = columns
    this.groupingInfos = []
    this.groupingDelimiter = ":|:"
    this.target = target
  }

  setGrouping(groupingInfos: GroupingInfo[]): void {
    this.groupingInfos = groupingInfos
    this.toggledGroupsByLevel = groupingInfos.map(() => ({}))

    const row_indices = this.target.get_array<number[] | number>("row_indices")
    const labels = this.target.get_array<string>("labels")

    const parents: number[][] = []
    const parent_labels: string[] = []
    row_indices.forEach((indices, i) => {
      if (typeof indices === "number") {
        this.toggledGroupsByLevel[parent_labels.length - 1][parent_labels.join(this.groupingDelimiter)] = false
      } else {
        while (parents.length > 0 && !indices.every((index) => parents[parents.length - 1].includes(index))) {
          parents.pop()
          parent_labels.pop()
        }
        if (parent_labels.length > 0) {
          this.toggledGroupsByLevel[parent_labels.length - 1][parent_labels.join(this.groupingDelimiter)] = false
        }
        parents.push(indices)
        parent_labels.push(labels[i])
      }
    })

    this.refresh()
  }

  private extractGroups(rows: Iterable<number>, parent_group?: Group): Group[] {
    const groups: Group[] = []
    const groupsByValue: Map<any, Group> = new Map()
    const level = parent_group != null ? parent_group.level + 1 : 0
    const {comparer, getter} = this.groupingInfos[level]
    const column = this.source.get(getter)

    for (const row of rows) {
      const value = column[row]
      let group = groupsByValue.get(value)

      if (group == null) {
        const groupingKey = parent_group != null ? `${parent_group.groupingKey}${this.groupingDelimiter}${value}` : `${value}`
        group = new SlickGroup()
        group.level = level
        group.value = value as any
        group.groupingKey = groupingKey
        groups.push(group)
        groupsByValue.set(value, group)
      }
      group.rows.push(row)
    }

    if (level < this.groupingInfos.length - 1) {
      for (const group of groups) {
        group.groups = this.extractGroups(group.rows, group)
      }
    }

    groups.sort(comparer)
    return groups
  }

  private calculateTotals(group: Group, aggregators: RowAggregator[]): GroupTotals {
    const totals: GroupTotals = {avg: {}, max: {}, min: {}, sum: {}} as any

    for (const aggregator of aggregators) {
      aggregator.init()
      for (const row of group.rows) {
        aggregator.accumulate(this.source.get_row(row))
      }
      aggregator.storeResult(totals)
    }
    return totals
  }

  private addTotals(groups: Group[], level = 0): void {
    const {aggregators, collapsed: groupCollapsed} = this.groupingInfos[level]
    const toggledGroups = this.toggledGroupsByLevel[level]

    for (const group of groups) {
      if (!is_nullish(group.groups)) { // XXX: bad typings
        this.addTotals(group.groups, level + 1)
      }

      if (aggregators.length != 0 && group.rows.length != 0) {
        group.totals = this.calculateTotals(group, aggregators)
      }

      group.collapsed = groupCollapsed !== toggledGroups[group.groupingKey]
      const group_value = (group as any).value
      group.title = group_value ? `${group_value}` : ""
    }
  }

  private flattenedGroupedRows(groups: Group[], level = 0): (Group | number)[] {
    const rows: (Group | number)[] = []

    for (const group of groups) {
      rows.push(group)
      if (group.collapsed !== true) {
        const subRows = !is_nullish(group.groups) // XXX: bad typings
          ? this.flattenedGroupedRows(group.groups, level + 1)
          : group.rows
        rows.push(...subRows)
      }
    }
    return rows
  }

  refresh(): void {
    const groups = this.extractGroups(this.view.indices)
    const labels = this.source.get(this.columns[0].field)

    if (groups.length != 0) {
      this.addTotals(groups)
      this.rows = this.flattenedGroupedRows(groups)
      this.target.data = {
        row_indices: this.rows.map(value => value instanceof SlickGroup ? value.rows : value),
        labels: this.rows.map(value => value instanceof SlickGroup ? value.title : labels[value]),
      }
    }
  }

  override getLength(): number {
    return this.rows.length
  }

  override getItem<T extends Item>(i: number): T {
    const item = this.rows[i]

    return (item instanceof SlickGroup
      ? item
      : {[DTINDEX_NAME]: item, ...this.source.get_row(item)}) as unknown as T
  }

  override getItemMetadata(i: number): ItemMetadata {
    const my_item = this.rows[i]
    const columns = this.columns.slice(1)

    const aggregators = my_item instanceof SlickGroup
      ? this.groupingInfos[my_item.level].aggregators
      : []

    function adapter<T extends Item = Item>(column: Column<T>): ColumnMetadata {
      const {field: my_field, formatter} = column
      const aggregator = aggregators.find(({field_}) => field_ === my_field)

      if (aggregator != null) {
        const {key} = aggregator
        return {
          formatter(row: number, cell: number, _value: unknown, columnDef: Column<T>, dataContext: T, grid: SlickGrid<T>): any {
            return formatter != null ? formatter(row, cell, dataContext.totals[key][my_field], columnDef, dataContext, grid) : ""
          },
        }
      }
      return {}
    }

    return my_item instanceof SlickGroup
      ? {
        selectable: false,
        focusable: false,
        cssClasses: "slick-group",
        columns: [{formatter: groupCellFormatter}, ...columns.map(adapter)] as any,
      }
      : {}
  }

  collapseGroup(grouping_key: string): void {
    const level = grouping_key.split(this.groupingDelimiter).length - 1

    this.toggledGroupsByLevel[level][grouping_key] = !this.groupingInfos[level].collapsed
    this.refresh()
  }

  expandGroup(grouping_key: string): void {
    const level = grouping_key.split(this.groupingDelimiter).length - 1

    this.toggledGroupsByLevel[level][grouping_key] = this.groupingInfos[level].collapsed
    this.refresh()
  }
}

export class DataCubeView extends DataTableView {
  declare model: DataCube

  protected declare data: DataCubeProvider

  override _render_table(): void {
    const options = {
      enableCellNavigation: this.model.selectable !== false,
      enableColumnReorder: false,
      autosizeColsMode: this.autosize,
      multiColumnSort: false,
      editable: this.model.editable,
      autoEdit: this.model.auto_edit,
      rowHeight: this.model.row_height,
      shadowRoot: this.shadow_el,
    }

    const columns = this.model.columns.map(column => column.toColumn())
    columns[0].formatter = indentFormatter(columns[0].formatter, this.model.grouping.length)
    delete columns[0].editor

    this.data = new DataCubeProvider(
      this.model.source,
      this.model.view,
      columns,
      this.model.target,
    )
    this.data.setGrouping(this.model.grouping)

    this.el.style.width = `${this.model.width}px`

    this.grid = new SlickGrid(
      this.wrapper_el,
      this.data,
      columns,
      options,
    )

    this.grid.onClick.subscribe(handleGridClick)
  }
}

export namespace DataCube {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DataTable.Props & {
    grouping: p.Property<GroupingInfo[]>
    target:   p.Property<ColumnDataSource>
  }
}

export interface DataCube extends DataCube.Attrs {}

export class DataCube extends DataTable {
  declare properties: DataCube.Props

  constructor(attrs?: Partial<DataCube.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DataCubeView

    this.define<DataCube.Props>(({List, Ref}) => ({
      grouping: [ List(Ref(GroupingInfo)), [] ],
      target:   [ Ref(ColumnDataSource) ],
    }))
  }
}
