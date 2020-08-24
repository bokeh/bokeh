import * as p from 'core/properties'
import {span} from 'core/dom'
import {Formatter, Column, Grid as SlickGrid, Group, GroupTotals, RowMetadata, ColumnMetadata} from '@bokeh/slickgrid'
import {TableDataProvider, DTINDEX_NAME, DataTableView, DataTable} from './data_table'
import {Item} from "./table_column"
import {ColumnDataSource} from '../../sources/column_data_source'
import {CDSView} from '../../sources/cds_view'
import {RowAggregator} from './row_aggregators'
import {Model} from 'model'

interface GroupDataContext {
  collapsed: boolean
  level: number
  title: string
}

function groupCellFormatter(_row: number, _cell: number, _value: unknown, _columnDef: Column<Item>, dataContext: GroupDataContext): string {
  const { collapsed, level, title } = dataContext

  const toggle = span({
    class: `slick-group-toggle ${collapsed ? 'collapsed' : 'expanded'}`,
    style: { 'margin-left': `${level * 15}px`},
  })
  const titleElement = span({
    class: 'slick-group-title',
    level,
  }, title)
  return `${toggle.outerHTML}${titleElement.outerHTML}`
}

function indentFormatter(formatter?: Formatter<Item>, indent?: number): Formatter<Item> {
  return (row: number, cell: number, value: unknown, columnDef: Column<Item>, dataContext: Item) => {
    const spacer = span({
      class: 'slick-group-toggle',
      style: { 'margin-left': `${(indent || 0) * 15}px`},
    })
    const formatted = formatter ? formatter(row, cell, value, columnDef, dataContext) : `${value}`

    return `${spacer.outerHTML}${formatted && formatted.replace(/^<div/, '<span').replace(/div>$/, 'span>')}`
  }
}

function handleGridClick(this: SlickGrid<Item>, event: Event, args: { row: number }): void {
  const item = this.getDataItem(args.row)

  if (item instanceof Group && (event.target as HTMLElement).classList.contains('slick-group-toggle')) {
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
  properties: GroupingInfo.Props

  constructor(attrs?: Partial<GroupingInfo.Attrs>) {
    super(attrs)
  }

  static init_GroupingInfo(): void {
    this.define<GroupingInfo.Props>({
      getter:      [ p.String,   ''    ],
      aggregators: [ p.Array,    []    ],
      collapsed:   [ p.Boolean,  false ],
    })
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
    this.groupingDelimiter = ':|:'
    this.target = target
  }

  setGrouping(groupingInfos: GroupingInfo[]): void {
    this.groupingInfos = groupingInfos
    this.toggledGroupsByLevel = groupingInfos.map(() => ({}))

    this.refresh()
  }

  private extractGroups(rows: number[], parentGroup?: Group<number>): Group<number>[] {
    const groups: Group<number>[] = []
    const groupsByValue: Map<any, Group<number>> = new Map()
    const level = parentGroup ? parentGroup.level + 1 : 0
    const { comparer, getter } = this.groupingInfos[level]

    rows.forEach((row) => {
      const value = this.source.data[getter][row]
      let group = groupsByValue.get(value)

      if (!group) {
        const groupingKey = parentGroup ? `${parentGroup.groupingKey}${this.groupingDelimiter}${value}` : `${value}`
        group = Object.assign(new Group(), {value, level, groupingKey}) as any
        groups.push(group!)
        groupsByValue.set(value, group!)
      }
      group!.rows.push(row)
    })

    if (level < this.groupingInfos.length - 1) {
      groups.forEach((group) => {
        group.groups = this.extractGroups(group.rows, group)
      })
    }

    groups.sort(comparer)
    return groups
  }

  private calculateTotals(group: Group<number>, aggregators: RowAggregator[]): GroupTotals<number> {
    const totals: GroupTotals<number> = { avg: {}, max: {}, min: {}, sum: {} } as any
    const { source: { data } } = this
    const keys = Object.keys(data)
    const items = group.rows.map(i => keys.reduce((o, c) => ({ ...o, [c]: data[c][i] }), {}))

    aggregators.forEach((aggregator) => {
      aggregator.init()
      items.forEach((item) => aggregator.accumulate(item))
      aggregator.storeResult(totals)
    })
    return totals
  }

  private addTotals(groups: Group<number>[], level = 0): void {
    const { aggregators, collapsed: groupCollapsed } = this.groupingInfos[level]
    const toggledGroups = this.toggledGroupsByLevel[level]

    groups.forEach((group) => {
      if (group.groups) {
        this.addTotals(group.groups, level + 1)
      }

      if (aggregators.length && group.rows.length) {
        group.totals = this.calculateTotals(group, aggregators)
      }

      group.collapsed = groupCollapsed !== toggledGroups[group.groupingKey]
      group.title = group.value ? `${group.value}` : ""
    })
  }

  private flattenedGroupedRows(groups: Group<number>[], level = 0): (Group<number> | number)[] {
    const rows: (Group<number> | number)[] = []

    groups.forEach((group) => {
      rows.push(group)
      if (!group.collapsed) {
        const subRows = group.groups
          ? this.flattenedGroupedRows(group.groups, level + 1)
          : group.rows
        rows.push(...subRows)
      }
    })
    return rows
  }

  refresh(): void {
    const groups = this.extractGroups([...this.view.indices])
    const labels = this.source.data[this.columns[0].field!]

    if (groups.length) {
      this.addTotals(groups)
      this.rows = this.flattenedGroupedRows(groups)
      this.target.data = {
        row_indices: this.rows.map(value => value instanceof Group ? (value as Group<number>).rows : value),
        labels: this.rows.map(value => value instanceof Group ? (value as Group<number>).title : labels[value as number]),
      }
    }
  }

  getLength(): number {
    return this.rows.length
  }

  getItem(i: number): Item {
    const item = this.rows[i]
    const {source: {data}} = this

    return item instanceof Group
      ? item as Item
      : Object.keys(data)
        .reduce((o, c) => ({...o, [c]: data[c][item as number]}), {[DTINDEX_NAME]: item})
  }

  getItemMetadata(i: number): RowMetadata<Item> {
    const myItem = this.rows[i]
    const columns = this.columns.slice(1)

    const aggregators = myItem instanceof Group
      ? this.groupingInfos[(myItem as Group<number>).level].aggregators
      : []

    function adapter(column: Column<Item>): ColumnMetadata<Item> {
      const {field: myField, formatter} = column
      const aggregator = aggregators.find(({ field_ }) => field_ === myField)

      if (aggregator) {
        const {key} = aggregator
        return {
          formatter(row: number, cell: number, _value: unknown, columnDef: Column<Item>, dataContext: Item): string {
            return formatter ? formatter(row, cell, dataContext.totals[key][myField!], columnDef, dataContext) : ''
          },
        }
      }
      return {}
    }

    return myItem instanceof Group
      ? {
        selectable: false,
        focusable: false,
        cssClasses: 'slick-group',
        columns: [{ formatter: groupCellFormatter }, ...columns.map(adapter)] as any,
      }
      : {}
  }

  collapseGroup(groupingKey: string): void {
    const level = groupingKey.split(this.groupingDelimiter).length - 1

    this.toggledGroupsByLevel[level][groupingKey] = !this.groupingInfos[level].collapsed
    this.refresh()
  }

  expandGroup(groupingKey: string): void {
    const level = groupingKey.split(this.groupingDelimiter).length - 1

    this.toggledGroupsByLevel[level][groupingKey] = this.groupingInfos[level].collapsed
    this.refresh()
  }
}

export class DataCubeView extends DataTableView {
  model: DataCube

  protected data: DataCubeProvider

  render(): void {
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
      this.el,
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
  properties: DataCube.Props

  constructor(attrs?: Partial<DataCube.Attrs>) {
    super(attrs)
  }

  static init_DataCube(): void {
    this.prototype.default_view = DataCubeView

    this.define<DataCube.Props>({
      grouping: [p.Array,   []],
      target:   [p.Instance   ],
    })
  }
}
