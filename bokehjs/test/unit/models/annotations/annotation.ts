import {expect} from "#framework/assertions"
import {restorable} from "#framework/util"
import {spy} from "sinon"

import {DataAnnotation, DataAnnotationView} from "@bokehjs/models/annotations/data_annotation"
import type {PlotView} from "@bokehjs/models/plots/plot"
import {Plot} from "@bokehjs/models/plots/plot"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {HTMLLabelSet} from "@bokehjs/models/annotations/html/label_set"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {build_view} from "@bokehjs/core/build_views"
import * as p from "@bokehjs/core/properties"

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
    it("should collect dataspecs", async () => {
      const ds = ColumnDataSource.create({data: {colname: [1, 2, 3, 4]}})
      const obj = SubclassWithNumberSpec.create()
      const view = await build_view(obj, {parent: await plot()})
      view.set_data(ds)
      expect(view.foo).to.be.equal(new p.UniformVector(new Float64Array([1, 2, 3, 4])))
    })

    it("should collect shapes when they are present", async () => {
      const array = ndarray([1, 2, 3, 4], {dtype: "float64", shape: [2, 2]})
      const ds = ColumnDataSource.create({data: {colname: array}})
      const obj = SubclassWithNumberSpec.create()
      const view = await build_view(obj, {parent: await plot()})
      view.set_data(ds)
      expect(view.foo).to.be.equal(new p.UniformVector(ndarray([1, 2, 3, 4], {dtype: "float64", shape: [2, 2]})))
    })
  })

  describe("source updates", () => {
    it("prepares data once per assignment, stream, or patch", async () => {
      const source = ColumnDataSource.create({data: {colname: [1, 2]}})
      const model = SubclassWithNumberSpec.create({source})
      const view = await build_view(model, {parent: await plot()})
      using prepare = restorable(spy(view, "set_data"))

      source.data = {colname: [3, 4]}
      await view.ready
      expect(prepare.callCount).to.be.equal(1)
      expect([...view.foo]).to.be.equal([3, 4])

      source.stream({colname: [5]})
      await view.ready
      expect(prepare.callCount).to.be.equal(2)
      expect([...view.foo]).to.be.equal([3, 4, 5])

      source.patch({colname: [[0, 6]]})
      await view.ready
      expect(prepare.callCount).to.be.equal(3)
      expect([...view.foo]).to.be.equal([6, 4, 5])
    })

    it("responds to either source signal and coalesces overlapping notifications", async () => {
      const values = [1, 2]
      const source = ColumnDataSource.create({data: {colname: values}})
      const model = SubclassWithNumberSpec.create({source})
      const view = await build_view(model, {parent: await plot()})
      using prepare = restorable(spy(view, "set_data"))

      values[0] = 3
      source.change.emit()
      await view.ready
      expect(prepare.callCount).to.be.equal(1)
      expect([...view.foo]).to.be.equal([3, 2])

      values[0] = 4
      source.data_changed.emit({structural: false, indices: [0]})
      await view.ready
      expect(prepare.callCount).to.be.equal(2)
      expect([...view.foo]).to.be.equal([4, 2])

      values[0] = 5
      source.change.emit()
      source.data_changed.emit({structural: false, indices: [0]})
      await view.ready
      expect(prepare.callCount).to.be.equal(3)
      expect([...view.foo]).to.be.equal([5, 2])
    })

    it("prepares data when an annotation's dataspec changes", async () => {
      const source = ColumnDataSource.create({data: {colname: [1, 2]}})
      const model = SubclassWithNumberSpec.create({source})
      const view = await build_view(model, {parent: await plot()})
      using prepare = restorable(spy(view, "set_data"))

      model.foo = {value: 3}
      await view.ready
      expect(prepare.callCount).to.be.equal(1)
      expect([...view.foo]).to.be.equal([3, 3])
    })

    it("prepares the latest replacement once and disconnects previous sources", async () => {
      const original = ColumnDataSource.create({data: {colname: [1]}})
      const intermediate = ColumnDataSource.create({data: {colname: [2]}})
      const replacement = ColumnDataSource.create({data: {colname: [3]}})
      const model = SubclassWithNumberSpec.create({source: original})
      const view = await build_view(model, {parent: await plot()})
      using prepare = restorable(spy(view, "set_data"))

      original.change.emit()
      model.source = intermediate
      model.source = replacement
      replacement.data = {colname: [4]}
      await view.ready
      expect(prepare.callCount).to.be.equal(1)
      expect(prepare.firstCall.args).to.be.equal([replacement])
      expect([...view.foo]).to.be.equal([4])

      for (const source of [original, intermediate]) {
        source.change.emit()
        source.data_changed.emit({structural: true})
      }
      await view.ready
      expect(prepare.callCount).to.be.equal(1)

      replacement.data_changed.emit({structural: true})
      await view.ready
      expect(prepare.callCount).to.be.equal(2)
    })

    it("ignores queued preparation after removal", async () => {
      const source = ColumnDataSource.create({data: {colname: [1]}})
      const model = SubclassWithNumberSpec.create({source})
      const view = await build_view(model, {parent: await plot()})
      using prepare = restorable(spy(view, "set_data"))

      source.change.emit()
      view.remove()
      await Promise.resolve()
      source.data_changed.emit({structural: true})
      await Promise.resolve()
      expect(prepare.callCount).to.be.equal(0)
    })

    it("prepares HTML labels once when an update triggers their first paint", async () => {
      const source = ColumnDataSource.create({data: {x: [1], y: [2], text: ["before"]}})
      const model = HTMLLabelSet.create({source, text: {field: "text"}, x_units: "canvas", y_units: "canvas"})
      const view = await build_view(model, {parent: await plot()})
      using prepare = restorable(spy(view, "set_data"))

      source.data = {x: [3], y: [4], text: ["after"]}
      await view.ready
      expect(prepare.callCount).to.be.equal(1)
      expect(view.plot_view.canvas_view.overlays_el.textContent).to.be.equal("after")
      view.remove()
    })
  })
})
