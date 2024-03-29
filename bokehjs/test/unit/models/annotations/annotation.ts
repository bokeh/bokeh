import {expect} from "assertions"

import {DataAnnotation, DataAnnotationView} from "@bokehjs/models/annotations/data_annotation"
import type {PlotView} from "@bokehjs/models/plots/plot"
import {Plot} from "@bokehjs/models/plots/plot"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {build_view} from "@bokehjs/core/build_views"
import * as p from "@bokehjs/core/properties"

class SubclassWithNumberSpecView extends DataAnnotationView {
  declare model: SubclassWithNumberSpec
  map_data(): void {}
  _paint_data(): void {}
  foo: p.Uniform<number>
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
  foo: p.Uniform<number>
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
    return await build_view(new Plot())
  }

  describe("set_data()", () => {
    it("should collect dataspecs", async () => {
      const ds = new ColumnDataSource({data: {colname: [1, 2, 3, 4]}})
      const obj = new SubclassWithNumberSpec()
      const view = await build_view(obj, {parent: await plot()})
      view.set_data(ds)
      expect(view.foo).to.be.equal(new p.UniformVector(new Float64Array([1, 2, 3, 4])))
    })

    it("should collect shapes when they are present", async () => {
      const array = ndarray([1, 2, 3, 4], {dtype: "float64", shape: [2, 2]})
      const ds = new ColumnDataSource({data: {colname: array}})
      const obj = new SubclassWithNumberSpec()
      const view = await build_view(obj, {parent: await plot()})
      view.set_data(ds)
      expect(view.foo).to.be.equal(new p.UniformVector(ndarray([1, 2, 3, 4], {dtype: "float64", shape: [2, 2]})))
    })
  })
})
