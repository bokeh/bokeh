import type * as p from "core/properties"
import {span} from "core/dom"
import {dict} from "core/util/object"
import {is_nullish} from "core/util/types"
import {assert} from "core/util/assert"
import type {Formatter, Column, GroupTotals, RowMetadata, ColumnMetadata} from "@bokeh/slickgrid"
import {Grid as SlickGrid, Group} from "@bokeh/slickgrid"
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
  return (row: number, cell: number, value: unknown, columnDef: Column<Item>, dataContext: Item) => {
    const spacer = span({
      class: "slick-group-toggle",
      style: {"margin-left": `${(indent ?? 0) * 15}px`},
    })
    const formatted = formatter != null ? formatter(row, cell, value, columnDef, dataContext) : `${value}`

    return `${spacer.outerHTML}${formatted.replace(/^<div/, "<span").replace(/div>$/, "span>")}`
  }
}

function handleGridClick(this: SlickGrid<Item>, event: Event, args: { row: number }): void {
  const item = this.getDataItem(args.row)

  if (item instanceof Group && (event.target as HTMLElement).classList.contains("slick-group-toggle")) {
    if (item.collapsed) {
      this.getData().expandGroup(item.groupingKey)
    } else {
      this.getData().collapseGroup(item.groupingKey)
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

  get comparer(): (a: { value: any }, b: { value: any }) => number {
    return (a: { value: any }, b: { value: any }): number => {
      return a.value === b.value ? 0 : a.value > b.value ? 1 : -1
    }
  }
}

export class DataCubeProvider extends TableDataProvider {
  readonly columns: Column<Item>[]
  groupingInfos: GroupingInfo[]
  readonly groupingDelimiter: string
  toggledGroupsByLevel: {[key: string]: boolean}[]
  private rows: (Group<number> | number)[]
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

    this.refresh()
  }

  private extractGroups(rows: Iterable<number>, parent_group?: Group<number>): Group<number>[] {
    const groups: Group<number>[] = []
    const groupsByValue: Map<any, Group<number>> = new Map()
    const level = parent_group != null ? parent_group.level + 1 : 0
    const {comparer, getter} = this.groupingInfos[level]

    for (const row of rows) {
      const column = dict(this.source.data).get(getter)
      assert(column != null)
      const value = column[row]
      let group = groupsByValue.get(value)

      if (group == null) {
        const groupingKey = parent_group != null ? `${parent_group.groupingKey}${this.groupingDelimiter}${value}` : `${value}`
        group = Object.assign(new Group(), {value, level, groupingKey}) as any
        groups.push(group!)
        groupsByValue.set(value, group!)
      }
      group!.rows.push(row)
    }

    if (level < this.groupingInfos.length - 1) {
      for (const group of groups) {
        group.groups = this.extractGroups(group.rows, group)
      }
    }

    groups.sort(comparer)
    return groups
  }

  private calculateTotals(group: Group<number>, aggregators: RowAggregator[]): GroupTotals<number> {
    const totals: GroupTotals<number> = {avg: {}, max: {}, min: {}, sum: {}} as any
    const data = dict(this.source.data)
    const names = [...data.keys()]
    const items = group.rows.map((i) => {
      return names.reduce((obj, name) => ({...obj, [name]: data.get(name)![i]}), {})
    })

    for (const aggregator of aggregators) {
      aggregator.init()
      for (const item of items) {
        aggregator.accumulate(item)
      }
      aggregator.storeResult(totals)
    }
    return totals
  }

  private addTotals(groups: Group<number>[], level = 0): void {
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
      group.title = group.value ? `${group.value}` : ""
    }
  }

  private flattenedGroupedRows(groups: Group<number>[], level = 0): (Group<number> | number)[] {
    const rows: (Group<number> | number)[] = []

    for (const group of groups) {
      rows.push(group)
      if (!group.collapsed) {
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
    const data = dict(this.source.data)
    const labels = data.get(this.columns[0].field!)
    assert(labels != null)

    if (groups.length != 0) {
      this.addTotals(groups)
      this.rows = this.flattenedGroupedRows(groups)
      this.target.data = {
        row_indices: this.rows.map(value => value instanceof Group ? value.rows : value),
        labels: this.rows.map(value => value instanceof Group ? value.title : labels[value]),
      }
    }
  }

  override getLength(): number {
    return this.rows.length
  }

  override getItem(i: number): Item {
    const item = this.rows[i]
    const data = dict(this.source.data)

    return item instanceof Group
      ? item as Item
      : [...data.keys()].reduce((obj, name) => ({...obj, [name]: data.get(name)![item]}), {[DTINDEX_NAME]: item})
  }

  getItemMetadata(i: number): RowMetadata<Item> {
    const my_item = this.rows[i]
    const columns = this.columns.slice(1)

    const aggregators = my_item instanceof Group
      ? this.groupingInfos[my_item.level].aggregators
      : []

    function adapter(column: Column<Item>): ColumnMetadata<Item> {
      const {field: my_field, formatter} = column
      const aggregator = aggregators.find(({field_}) => field_ === my_field)

      if (aggregator != null) {
        const {key} = aggregator
        return {
          formatter(row: number, cell: number, _value: unknown, columnDef: Column<Item>, dataContext: Item): string {
            return formatter != null ? formatter(row, cell, dataContext.totals[key][my_field!], columnDef, dataContext) : ""
          },
        }
      }
      return {}
    }

    return my_item instanceof Group
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
