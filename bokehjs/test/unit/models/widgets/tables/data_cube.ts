import {expect} from "assertions"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {CDSView} from "@bokehjs/models/sources/cds_view"
import {TableColumn} from "@bokehjs/models/widgets/tables/table_column"

import {GroupingInfo, DataCubeProvider, DataCube} from "@bokehjs/models/widgets/tables/data_cube"
import {SumAggregator} from "@bokehjs/models/widgets/tables/row_aggregators"

describe("data_cube module", () => {

  describe("DataCube class", () => {
    it("DataCube constructs", () => {
      const dataCube = new DataCube()
      expect(dataCube).to.not.be.null
    })
  })

  describe("DataCubeProvider class", () => {
    let source: ColumnDataSource
    let view: CDSView
    let columns: any[] // XXX TableColumn[]
    let grouping: GroupingInfo[]

    before_each(() => {
      source = new ColumnDataSource({
        data: {
          color: ['red', 'red', 'red', 'green', 'green', 'blue'],
          width: ['wide', 'wide', 'narrow', 'wide', 'narrow', 'wide'],
          value: [10, 20, 30, 40, 50, 60],
        },
      })
      view = new CDSView({source})
      columns = [
        new TableColumn({field: 'color'}),
        new TableColumn({field: 'width'}),
        new TableColumn({field: 'value'}),
      ]

      const aggregators = [new SumAggregator({field_: 'value'})]
      grouping = [
        new GroupingInfo({getter: 'color', aggregators, collapsed: true}),
        new GroupingInfo({getter: 'width', aggregators, collapsed: true}),
      ]
    })

    it("DataCube groups as expected", () => {
      const target = new ColumnDataSource({data: {row_indices: [], labels: []}})
      const provider = new DataCubeProvider(source, view, columns, target)
      provider.setGrouping(grouping)
      expect(target.data.row_indices).to.be.equal([[5], [3, 4], [0, 1, 2]])
    })

    it("Expanding modifies groups", () => {
      const target = new ColumnDataSource({data: {row_indices: [], labels: []}})
      const provider = new DataCubeProvider(source, view, columns, target)
      provider.setGrouping(grouping)
      provider.expandGroup("red")
      provider.refresh()
      expect(target.data.row_indices).to.be.equal([[5], [3, 4], [0, 1, 2], [2], [0, 1]])
      provider.expandGroup("red:|:wide")
      provider.refresh()
      expect(target.data.row_indices).to.be.equal([[5], [3, 4], [0, 1, 2], [2], [0, 1], 0, 1])
    })

    it("Collapsing inverts expanding", () => {
      const target = new ColumnDataSource({data: {row_indices: [], labels: []}})
      const provider = new DataCubeProvider(source, view, columns, target)
      provider.setGrouping(grouping)
      provider.expandGroup("red")
      provider.expandGroup("red:|:wide")
      provider.refresh()
      expect(target.data.row_indices).to.be.equal([[5], [3, 4], [0, 1, 2], [2], [0, 1], 0, 1])
      provider.collapseGroup("red:|:wide")
      provider.refresh()
      expect(target.data.row_indices).to.be.equal([[5], [3, 4], [0, 1, 2], [2], [0, 1]])
      provider.collapseGroup("red")
      provider.refresh()
      expect(target.data.row_indices).to.be.equal([[5], [3, 4], [0, 1, 2]])
    })
  })
})
