const {Grid: SlickGrid} = require('slickgrid')

const {EventData, Group} = require('slickgrid/slick.core')
type EventData = typeof EventData

import * as p from 'core/properties'
import {span} from 'core/dom'
import {Item, Formatter, Column, SlickGrid, Group} from 'external/slickgrid'
import {DataProvider, DTINDEX_NAME, DataTableView, DataTable} from './data_table'
import {ColumnDataSource} from '../../sources/column_data_source'
import {CDSView} from '../../sources/cds_view'
import {RowAggregator, GroupTotals} from './row_aggregators'
import {Model} from 'model'

export type Metadata = {
  selectable: boolean,
  focusable: boolean,
  cssClasses: string,
  columns: Partial<Column>[],
}

interface GroupDataContext {
  collapsed: boolean,
  level: number,
  title: string,
}

function groupCellFormatter(_row: number, _cell: number, _value: unknown, _columnDef: Column, dataContext: GroupDataContext): string {
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

function indentFormatter(formatter?: Formatter, indent?: number): (...args: any[]) => string|null {
  return (row: number, cell: number, value: unknown, columnDef: Column, dataContext: Object) => {
    const spacer = span({
      class: 'slick-group-toggle',
      style: { 'margin-left': `${(indent || 0) * 15}px`},
    })
    const formatted = formatter ? formatter(row, cell, value, columnDef, dataContext) : `${value}`

    return `${spacer.outerHTML}${formatted && formatted.replace(/^<div/, '<span').replace(/div>$/, 'span>')}`
  }
}

function handleGridClick(this: SlickGrid, event: EventData, args: { row: number }): void {
  const item = this.getDataItem(args.row)

  if (item instanceof Group && event.target.classList.contains('slick-group-toggle')) {
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

  static initClass(): void {
    this.prototype.type = 'GroupingInfo'

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
GroupingInfo.initClass()

export class DataCubeProvider extends DataProvider {

  readonly columns: Column[]
  groupingInfos: GroupingInfo[]
  readonly groupingDelimiter: string
  toggledGroupsByLevel: {[key: string]: boolean}[]
  private rows: (Group | number)[]
  target: ColumnDataSource

  constructor(source: ColumnDataSource, view: CDSView, columns: Column[], target: ColumnDataSource) {
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

  private extractGroups(rows: number[], parentGroup?: Group): Group[] {
    const groups: Group[] = []
    const groupsByValue: Map<any, Group> = new Map()
    const level = parentGroup ? parentGroup.level + 1 : 0
    const { comparer, getter } = this.groupingInfos[level]

    rows.forEach((row: number) => {
      const value = this.source.data[getter][row]
      let group = groupsByValue.get(value)

      if (!group) {
        const groupingKey = parentGroup ? `${parentGroup.groupingKey}${this.groupingDelimiter}${value}` : `${value}`
        group = Object.assign(new Group(), {
          value,
          level,
          groupingKey,
        })
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

  private calculateTotals(group: Group, aggregators: RowAggregator[]): GroupTotals {
    const totals: GroupTotals = { avg: {}, max: {}, min: {}, sum: {} }
    const { source: { data } } = this
    const keys = Object.keys(data)
    const items = group.rows.map(i => keys.reduce((o, c) => ({ ...o, [c]: data[c][i] }), {}))

    aggregators.forEach((aggregator: RowAggregator) => {
      aggregator.init()
      items.forEach((item: Item) => aggregator.accumulate(item))
      aggregator.storeResult(totals)
    })
    return totals
  }

  private addTotals(groups: Group[], level = 0): void {
    const { aggregators, collapsed: groupCollapsed } = this.groupingInfos[level]
    const toggledGroups = this.toggledGroupsByLevel[level]

    groups.forEach((group: Group) => {
      if (group.groups) {
        this.addTotals(group.groups, level + 1)
      }

      if (aggregators.length && group.rows.length) {
        group.totals = this.calculateTotals(group, aggregators)
      }

      group.collapsed = groupCollapsed !== toggledGroups[group.groupingKey]
      group.title = group.value ? `${group.value}` : null
    })
  }

  private flattenedGroupedRows(groups: Group[], level = 0): (Group | number)[] {
    const rows: (Group | number)[] = []

    groups.forEach((group: Group) => {
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
    const groups = this.extractGroups(this.view.indices)
    const labels = this.source.data[this.columns[0].field]

    if (groups.length) {
      this.addTotals(groups)
      this.rows = this.flattenedGroupedRows(groups)
      this.target.data = {
        row_indices: this.rows.map(value => value instanceof Group ? (value as Group).rows : value),
        labels: this.rows.map(value => value instanceof Group ? (value as Group).title : labels[value as number]),
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

  getItemMetadata(i: number): Metadata | null {
    const myItem = this.rows[i]
    const columns = this.columns.slice(1)

    const aggregators = myItem instanceof Group
      ? this.groupingInfos[(myItem as Group).level].aggregators
      : []

    function adapter(column: Column): Partial<Column> {
      const {field: myField, formatter} = column
      const aggregator = aggregators.find(({ field_ }) => field_ === myField)

      if (aggregator) {
        const {key} = aggregator
        return {
          formatter(row: number, cell: number, _value: unknown, columnDef: Column, dataContext: Item): string|null {
            return formatter
              ? formatter(row, cell, dataContext.totals[key][myField], columnDef, dataContext)
              : ''
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
        columns: [{ formatter: groupCellFormatter }, ...columns.map(adapter)],
      }
      : null
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

  private data_: DataCubeProvider
  private grid_: SlickGrid

  render(): void {
    const options = {
      enableCellNavigation: this.model.selectable !== false,
      enableColumnReorder: false,
      forceFitColumns: this.model.fit_columns,
      multiColumnSort: false,
      editable: this.model.editable,
      autoEdit: false,
      rowHeight: this.model.row_height,
    }

    const columns = this.model.columns.map(column => column.toColumn())
    columns[0].formatter = indentFormatter(columns[0].formatter, this.model.grouping.length)
    delete columns[0].editor

    this.data_ = new DataCubeProvider(
      this.model.source,
      this.model.view,
      columns,
      this.model.target,
    )
    this.data_.setGrouping(this.model.grouping)

    this.el.style.width = `${this.model.width}px`

    this.grid_ = new SlickGrid(
      this.el,
      this.data_,
      columns,
      options,
    )

    this.grid_.onClick.subscribe(handleGridClick)
  }
}

export namespace DataCube {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DataTable.Props & {
    grouping: p.Property<GroupingInfo[]>,
    target:   p.Property<ColumnDataSource>,
  }
}

export interface DataCube extends DataCube.Attrs {}

export class DataCube extends DataTable {
  properties: DataCube.Props

  constructor(attrs?: Partial<DataCube.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'DataCube'
    this.prototype.default_view = DataCubeView

    this.define<DataCube.Props>({
      grouping: [p.Array,   []],
      target:   [p.Instance   ],
    })
  }
}
DataCube.initClass()
