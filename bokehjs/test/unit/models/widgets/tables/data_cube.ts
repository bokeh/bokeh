import { expect } from "chai"

import { ColumnDataSource } from "@bokehjs/models/sources/column_data_source"
import { CDSView } from "@bokehjs/models/sources/cds_view"
import { TableColumn } from "@bokehjs/models/widgets/tables/table_column"

import { GroupingInfo, DataCubeProvider, DataCube } from "@bokehjs/models/widgets/tables/data_cube"
import { SumAggregator } from "@bokehjs/models/widgets/tables/row_aggregators"

describe("data_cube module", function() {

  describe("DataCube class", function() {
    it("DataCube constructs", function() {
      const dataCube = new DataCube(this.attrs)
      expect(dataCube).is.not.null
    })
  })

  describe("DataCubeProvider class", function() {
    before("setup a new datacube", function() {
      this.source = new ColumnDataSource({
        data: {
          color: ['red', 'red', 'red', 'green', 'green', 'blue'],
          width: ['wide', 'wide', 'narrow', 'wide', 'narrow', 'wide'],
          value: [10, 20, 30, 40, 50, 60],
        },
      })
      this.view = new CDSView({ source: this.source })
      this.columns = [
        new TableColumn({ field: 'color' }),
        new TableColumn({ field: 'width' }),
        new TableColumn({ field: 'value' }),
      ]

      const aggregators = [new SumAggregator({ field_: 'value' })]
      this.grouping = [
        new GroupingInfo({ getter: 'color', aggregators, collapsed: true }),
        new GroupingInfo({ getter: 'width', aggregators, collapsed: true }),
      ]
    })

    it("DataCube groups as expected", function() {
      const target = new ColumnDataSource({ data: { row_indices: [], labels: [] } })
      const provider = new DataCubeProvider(this.source, this.view, this.columns, target)
      provider.setGrouping(this.grouping)
      expect(target.data.row_indices).to.deep.equal([[5], [3, 4], [0, 1, 2]])
    })

    it("Expanding modifies groups", function() {
      const target = new ColumnDataSource({ data: { row_indices: [], labels: [] } })
      const provider = new DataCubeProvider(this.source, this.view, this.columns, target)
      provider.setGrouping(this.grouping)
      provider.expandGroup("red")
      provider.refresh()
      expect(target.data.row_indices).to.deep.equal([[5], [3, 4], [0, 1, 2], [2], [0, 1]])
      provider.expandGroup("red:|:wide")
      provider.refresh()
      expect(target.data.row_indices).to.deep.equal([[5], [3, 4], [0, 1, 2], [2], [0, 1], 0, 1])
    })

    it("Collapsing inverts expanding", function() {
      const target = new ColumnDataSource({ data: { row_indices: [], labels: [] } })
      const provider = new DataCubeProvider(this.source, this.view, this.columns, target)
      provider.setGrouping(this.grouping)
      provider.expandGroup("red")
      provider.expandGroup("red:|:wide")
      provider.refresh()
      expect(target.data.row_indices).to.deep.equal([[5], [3, 4], [0, 1, 2], [2], [0, 1], 0, 1])
      provider.collapseGroup("red:|:wide")
      provider.refresh()
      expect(target.data.row_indices).to.deep.equal([[5], [3, 4], [0, 1, 2], [2], [0, 1]])
      provider.collapseGroup("red")
      provider.refresh()
      expect(target.data.row_indices).to.deep.equal([[5], [3, 4], [0, 1, 2]])
    })
  })
})
