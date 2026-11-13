import {expect} from "#framework/assertions"
import {restorable} from "#framework/util"
import {spy} from "sinon"

import {DataAnnotation, DataAnnotationView} from "@bokehjs/models/annotations/data_annotation"
import type {PlotView} from "@bokehjs/models/plots/plot"
import {Plot} from "@bokehjs/models/plots/plot"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {build_view} from "@bokehjs/core/build_views"
import * as p from "@bokehjs/core/properties"
import {RecordSource} from "../sources/record_source"

class SubclassWithNumberSpecView extends DataAnnotationView {
  declare model: SubclassWithNumberSpec
  map_data(): void {}
  _paint_data(): void {}
  foo!: p.Uniform<number>
}
namespace SubclassWithNumberSpec {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DataAnnotation.Props & {
    foo: p.NumberSpec
    bar: p.Property<boolean>
  }
}
interface SubclassWithNumberSpec extends SubclassWithNumberSpec.Attrs {}
class SubclassWithNumberSpec extends DataAnnotation {
  declare properties: SubclassWithNumberSpec.Props
  declare __view_type__: SubclassWithNumberSpecView

  constructor(attrs?: Partial<SubclassWithNumberSpec.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SubclassWithNumberSpecView

    this.define<SubclassWithNumberSpec.Props>(({Bool}) => ({
      foo: [ p.NumberSpec, {field: "colname"} ],
      bar: [ Bool, true ],
    }))
  }
}

class SubclassWithDistanceSpecView extends DataAnnotationView {
  declare model: SubclassWithDistanceSpec
  map_data(): void {}
  _paint_data(): void {}
  foo!: p.Uniform<number>
}
namespace SubclassWithDistanceSpec {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DataAnnotation.Props & {
    foo: p.DistanceSpec
    bar: p.Property<boolean>
  }
}
interface SubclassWithDistanceSpec extends SubclassWithDistanceSpec.Attrs {}
class SubclassWithDistanceSpec extends DataAnnotation {
  declare properties: SubclassWithDistanceSpec.Props
  declare __view_type__: SubclassWithDistanceSpecView

  constructor(attrs?: Partial<SubclassWithDistanceSpec.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SubclassWithDistanceSpecView

    this.define<SubclassWithDistanceSpec.Props>(({Bool}) => ({
      foo: [ p.DistanceSpec, {field: "colname"} ],
      bar: [ Bool, true ],
    }))
  }
}

describe("AnnotationView", () => {
  async function plot(): Promise<PlotView> {
    return await build_view(Plot.create())
  }

  describe("set_data()", () => {
    for (const ds of [
      ColumnDataSource.create({data: {colname: [1, 2, 3, 4]}}),
      RecordSource.create({records: [1, 2, 3, 4].map((colname) => ({colname}))}),
    ]) {
      it(`collects dataspecs from ${ds.type}`, async () => {
        const obj = SubclassWithNumberSpec.create()
        const view = await build_view(obj, {parent: await plot()})
        view.set_data(ds)
        expect(view.foo).to.be.equal(new p.UniformVector(new Float64Array([1, 2, 3, 4])))
      })
    }

    it("should collect shapes when they are present", async () => {
      const array = ndarray([1, 2, 3, 4], {dtype: "float64", shape: [2, 2]})
      const ds = ColumnDataSource.create({data: {colname: array}})
      const obj = SubclassWithNumberSpec.create()
      const view = await build_view(obj, {parent: await plot()})
      view.set_data(ds)
      expect(view.foo).to.be.equal(new p.UniformVector(ndarray([1, 2, 3, 4], {dtype: "float64", shape: [2, 2]})))
    })
  })

  it("updates synchronously and follows source replacement", async () => {
    const source = ColumnDataSource.create({data: {colname: [1]}})
    const replacement = RecordSource.create({records: [{colname: 2}]})
    const model = SubclassWithNumberSpec.create({source})
    const parent = await plot()
    const view = await build_view(model, {parent})
    using prepare = restorable(spy(view, "set_data"))

    source.patch({colname: [[0, 3]]})
    expect([...view.foo]).to.be.equal([3])

    model.source = replacement
    expect([...view.foo]).to.be.equal([2])
    prepare.resetHistory()
    source.data = {colname: [4]}
    expect(prepare.callCount).to.be.equal(0)

    replacement.records = [{colname: 5}]
    expect([...view.foo]).to.be.equal([5])
    view.remove()
    prepare.resetHistory()
    replacement.data_changed.emit({structural: true})
    expect(prepare.callCount).to.be.equal(0)
    parent.remove()
  })
})
