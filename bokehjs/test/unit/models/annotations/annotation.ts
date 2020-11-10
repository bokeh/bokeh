import {expect} from "assertions"

import {Annotation, AnnotationView} from "@bokehjs/models/annotations/annotation"
import {Plot, PlotView} from "@bokehjs/models/plots/plot"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {Arrayable} from "@bokehjs/core/types"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {build_view} from "@bokehjs/core/build_views"
import * as p from "@bokehjs/core/properties"

class SubclassWithNumberSpecView extends AnnotationView {
  model: SubclassWithNumberSpec
  protected _render(): void {}
  _foo: Arrayable<number>
}
namespace SubclassWithNumberSpec {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Annotation.Props & {
    foo: p.NumberSpec
    bar: p.Property<boolean>
  }
}
interface SubclassWithNumberSpec extends SubclassWithNumberSpec.Attrs {}
class SubclassWithNumberSpec extends Annotation {
  properties: SubclassWithNumberSpec.Props
  __view_type__: SubclassWithNumberSpecView

  constructor(attrs?: Partial<SubclassWithNumberSpec.Attrs>) {
    super(attrs)
  }

  static init_SubclassWithNumberSpec() {
    this.prototype.default_view = SubclassWithNumberSpecView

    this.define<SubclassWithNumberSpec.Props>(({Boolean}) => ({
      foo: [ p.NumberSpec, {field: "colname"} ],
      bar: [ Boolean, true ],
    }))
  }
}

class SubclassWithDistanceSpecView extends AnnotationView {
  model: SubclassWithDistanceSpec
  protected _render(): void {}
  _foo: Arrayable<number>
  max_foo: number
}
namespace SubclassWithDistanceSpec {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Annotation.Props & {
    foo: p.DistanceSpec
    bar: p.Property<boolean>
  }
}
interface SubclassWithDistanceSpec extends SubclassWithDistanceSpec.Attrs {}
class SubclassWithDistanceSpec extends Annotation {
  properties: SubclassWithDistanceSpec.Props
  __view_type__: SubclassWithDistanceSpecView

  constructor(attrs?: Partial<SubclassWithDistanceSpec.Attrs>) {
    super(attrs)
  }

  static init_SubclassWithDistanceSpec() {
    this.prototype.default_view = SubclassWithDistanceSpecView

    this.define<SubclassWithDistanceSpec.Props>(({Boolean}) => ({
      foo: [ p.DistanceSpec, {field: "colname"} ],
      bar: [ Boolean, true ],
    }))
  }
}

class SubclassWithOptionalSpecView extends AnnotationView {
  model: SubclassWithOptionalSpec
  protected _render(): void {}
  _foo: Arrayable<number>
  _baz: Arrayable<number>
}
namespace SubclassWithOptionalSpec {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Annotation.Props & {
    foo: p.NumberSpec
    bar: p.Property<boolean>
    baz: p.NumberSpec
  }
}
interface SubclassWithOptionalSpec extends SubclassWithOptionalSpec.Attrs {}
class SubclassWithOptionalSpec extends Annotation {
  properties: SubclassWithOptionalSpec.Props
  __view_type__: SubclassWithOptionalSpecView

  constructor(attrs?: Partial<SubclassWithOptionalSpec.Attrs>) {
    super(attrs)
  }

  static init_SubclassWithOptionalSpec() {
    this.prototype.default_view = SubclassWithOptionalSpecView

    this.define<SubclassWithOptionalSpec.Props>(({Boolean}) => ({
      foo: [ p.NumberSpec, undefined, {optional: true} ],
      bar: [ Boolean, true ],
      baz: [ p.NumberSpec, {field: "colname"} ],
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
      expect(view._foo).to.be.equal(new Float32Array([1, 2, 3, 4]))
    })

    it("should collect shapes when they are present", async () => {
      const array = ndarray([1, 2, 3, 4], {shape: [2, 2]})
      const ds = new ColumnDataSource({data: {colname: array}})
      const obj = new SubclassWithNumberSpec()
      const view = await build_view(obj, {parent: await plot()})
      view.set_data(ds)
      expect(view._foo).to.be.equal(ndarray([1, 2, 3, 4], {shape: [2, 2]}))
    })

    it("should collect max vals for distance specs", async () => {
      const ds0 = new ColumnDataSource({data: {colname: [1, 2, 3, 4, 2]}})
      const obj0 = new SubclassWithDistanceSpec()
      const view0 = await build_view(obj0, {parent: await plot()})
      view0.set_data(ds0)
      expect(view0._foo).to.be.equal(new Float32Array([1, 2, 3, 4, 2]))
      expect(view0.max_foo).to.be.equal(4)

      const array1 = ndarray([1, 2, 3, 4, 2], {shape: [2, 2]})
      const ds1 = new ColumnDataSource({data: {colname: array1}})
      const obj1 = new SubclassWithDistanceSpec()
      const view1 = await build_view(obj1, {parent: await plot()})
      view1.set_data(ds1)
      expect(view1._foo).to.be.equal(ndarray([1, 2, 3, 4, 2], {shape: [2, 2]}))
      expect(view1.max_foo).to.be.equal(4)
    })

    it("should collect ignore optional specs with null values", async () => {
      const ds = new ColumnDataSource({data: {colname: [1, 2, 3, 4]}})
      const obj = new SubclassWithOptionalSpec()
      const view = await build_view(obj, {parent: await plot()})
      view.set_data(ds)
      expect(view._baz).to.be.equal(new Float32Array([1, 2, 3, 4]))
    })
  })
})
