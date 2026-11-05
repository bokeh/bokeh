import {expect} from "#framework/assertions"
import {restorable} from "#framework/util"
import {spy} from "sinon"

import {DataAnnotation, DataAnnotationView} from "@bokehjs/models/annotations/data_annotation"
import type {PlotView} from "@bokehjs/models/plots/plot"
import {Plot} from "@bokehjs/models/plots/plot"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {HTMLLabelSet} from "@bokehjs/models/annotations/html/label_set"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {project_xy, project_xsys} from "@bokehjs/core/util/projections"
import type {Arrayable} from "@bokehjs/core/types"
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

class CoordinateAnnotationView extends DataAnnotationView {
  _x!: Arrayable<number>
  _y!: Arrayable<number>
  _xs!: Arrayable<number>[]
  _ys!: Arrayable<number>[]
  map_data(): void {}
  _paint_data(): void {}
}

namespace CoordinateAnnotation {
  export type Props = DataAnnotation.Props & {
    x: p.XCoordinateSpec
    y: p.YCoordinateSpec
    xs: p.XCoordinateSeqSpec
    ys: p.YCoordinateSeqSpec
  }
  export type Attrs = p.AttrsOf<Props>
}
interface CoordinateAnnotation extends CoordinateAnnotation.Attrs {}
class CoordinateAnnotation extends DataAnnotation {
  declare properties: CoordinateAnnotation.Props
  declare __view_type__: CoordinateAnnotationView

  static {
    this.prototype.default_view = CoordinateAnnotationView
    this.define<CoordinateAnnotation.Props>(() => ({
      x: [ p.XCoordinateSpec, {field: "x"} ],
      y: [ p.YCoordinateSpec, {field: "y"} ],
      xs: [ p.XCoordinateSeqSpec, {field: "xs"} ],
      ys: [ p.YCoordinateSeqSpec, {field: "ys"} ],
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

  describe("map projection", () => {
    class MapPlot extends Plot {
      override readonly use_map = true
    }

    it("reuses view-owned buffers without modifying shared source coordinates", async () => {
      const data = {x: [1, 2], y: [3, 4], xs: [[5], [6, 7]], ys: [[8], [9, 10]]}
      const original = structuredClone(data)
      const source = ColumnDataSource.create({data})
      const parent = await build_view(MapPlot.create())
      const view = await build_view(CoordinateAnnotation.create({source}), {parent})
      const other = await build_view(CoordinateAnnotation.create({source}), {parent})
      view.set_data(source)
      other.set_data(source)
      const {_x: x, _y: y, _xs: xs, _ys: ys} = view
      const [first_x] = xs
      const [first_y] = ys
      expect(source.data).to.be.equal(original)
      expect([x, y]).to.be.equal(project_xy(data.x, data.y))
      expect([xs, ys]).to.be.equal(project_xsys(data.xs, data.ys))
      expect(other._x).to.not.be.identical(x)
      expect(other._y).to.not.be.identical(y)
      expect(other._xs[0]).to.not.be.identical(first_x)
      expect(other._ys[0]).to.not.be.identical(first_y)

      data.x[0] = 11
      data.y[0] = 12
      data.xs[0][0] = 13
      data.ys[0][0] = 14
      const updated = structuredClone(data)
      source.data_changed.emit({structural: false, indices: [0]})
      await view.ready
      await other.ready
      expect(view._x).to.be.identical(x)
      expect(view._y).to.be.identical(y)
      expect(view._xs).to.be.identical(xs)
      expect(view._ys).to.be.identical(ys)
      expect(xs[0]).to.be.identical(first_x)
      expect(ys[0]).to.be.identical(first_y)
      expect([x, y]).to.be.equal(project_xy(data.x, data.y))
      expect([xs, ys]).to.be.equal(project_xsys(data.xs, data.ys))
      expect([other._x, other._y]).to.be.equal([x, y])
      expect(source.data).to.be.equal(updated)
      parent.remove()
    })

    it("resizes projection buffers on stream, source replacement, and empty data", async () => {
      const source = ColumnDataSource.create({data: {x: [1], y: [2], xs: [[3]], ys: [[4]]}})
      const parent = await build_view(MapPlot.create())
      const view = await build_view(CoordinateAnnotation.create({source}), {parent})
      view.set_data(source)
      const {_x: x, _y: y, _xs: xs, _ys: ys} = view
      const [first_x] = xs
      const [first_y] = ys

      source.stream({x: [5], y: [6], xs: [[7, 8]], ys: [[9, 10]]})
      await view.ready
      expect(view._x.length).to.be.equal(2)
      expect(view._y.length).to.be.equal(2)
      expect(view._x).to.not.be.identical(x)
      expect(view._y).to.not.be.identical(y)
      expect(view._xs).to.be.identical(xs)
      expect(view._ys).to.be.identical(ys)
      expect(xs[0]).to.be.identical(first_x)
      expect(ys[0]).to.be.identical(first_y)
      expect([view._x, view._y]).to.be.equal(project_xy([1, 5], [2, 6]))
      expect([xs, ys]).to.be.equal(project_xsys([[3], [7, 8]], [[4], [9, 10]]))
      expect(source.data).to.be.equal({x: [1, 5], y: [2, 6], xs: [[3], [7, 8]], ys: [[4], [9, 10]]})

      const replacement = ColumnDataSource.create({data: {x: [11], y: [12], xs: [[13, 14]], ys: [[15, 16]]}})
      view.model.source = replacement
      await view.ready
      expect([view._x, view._y]).to.be.equal(project_xy([11], [12]))
      expect(view._xs).to.be.identical(xs)
      expect(view._ys).to.be.identical(ys)
      expect(xs.length).to.be.equal(1)
      expect(ys.length).to.be.equal(1)
      expect(xs[0]).to.not.be.identical(first_x)
      expect(ys[0]).to.not.be.identical(first_y)
      expect([xs, ys]).to.be.equal(project_xsys([[13, 14]], [[15, 16]]))
      expect(replacement.data).to.be.equal({x: [11], y: [12], xs: [[13, 14]], ys: [[15, 16]]})

      replacement.data = {x: [], y: [], xs: [], ys: []}
      await view.ready
      expect(view._x.length).to.be.equal(0)
      expect(view._y.length).to.be.equal(0)
      expect(view._xs).to.be.identical(xs)
      expect(view._ys).to.be.identical(ys)
      expect(xs).to.be.equal([])
      expect(ys).to.be.equal([])
      parent.remove()
    })
  })
})
