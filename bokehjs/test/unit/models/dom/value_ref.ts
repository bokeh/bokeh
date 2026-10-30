import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"

import type {FilterDef} from "@bokehjs/models/dom/value_ref"
import {ValueRef} from "@bokehjs/models/dom/value_ref"
import {CustomJS} from "@bokehjs/models/callbacks/customjs"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {Float64NDArray} from "@bokehjs/core/util/ndarray"

describe("models/dom/value_ref", () => {
  it("should pass consistent shaped values and rows to filters", async () => {
    const source = ColumnDataSource.create({data: {
      values: new Float64NDArray([0, 1, 2, 0, 2, 3], [2, 3]),
    }})
    const filters: FilterDef[] = [
      (_, {value, row}) => {
        expect(value).to.be.equal([0, 2, 3])
        expect(row.values).to.be.equal(value)
        return true
      },
      CustomJS.create({code: `
        export default (args, ref, {value, row}) =>
          Array.isArray(row.values) && JSON.stringify(row.values) == JSON.stringify(value)
      `}),
    ]
    for (const filter of filters) {
      const ref = ValueRef.create({field: "values", filter})
      const {view} = await display(ref, [200, 50])
      view.update(source, 1, {})
      expect(view.el.textContent).to.be.equal("0,2,3")
    }
  })
})
