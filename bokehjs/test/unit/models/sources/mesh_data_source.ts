import {expect} from "#framework/assertions"

import {GroupFilter} from "@bokehjs/models/filters/group_filter"
import {IndexedLookup} from "@bokehjs/models/expressions/indexed_lookup"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {DataView} from "@bokehjs/models/sources/data_view"
import {MeshDataSource} from "@bokehjs/models/sources/mesh_data_source"

describe("MeshDataSource", () => {
  it("normalizes natural vertex and cell inputs", () => {
    const source = MeshDataSource.create({
      vertices: [[0, 0], [2, 0], [2, 2], [0, 2]],
      cells: [[0, 1, 2], [0, 2, 3]],
    })

    expect(source.vertices.get("x")).to.be.equal([0, 2, 2, 0])
    expect(source.vertices.get("y")).to.be.equal([0, 0, 2, 2])
    expect(source.cells.get("vertices")).to.be.equal([[0, 1, 2], [0, 2, 3]])
    expect(source.selected).to.be.equal(source.cells.selected)
    expect(source.selection_policy).to.be.equal(source.cells.selection_policy)

    const single = MeshDataSource.create({vertices: [[0, 0], [1, 0], [0, 1]], cells: [0, 1, 2]})
    expect(single.cells.get("vertices")).to.be.equal([[0, 1, 2]])
  })

  it("exposes cell fields and gathered coordinate fields", () => {
    const source = MeshDataSource.create({
      vertices: {x: [0, 2, 2, 0], y: [0, 0, 2, 2], z: [1, 2, 3, 4]},
      cells: {vertices: [[0, 1, 2], [0, 2, 3]], material: ["a", "b"]},
    })

    expect(source.length).to.be.equal(2)
    expect(source.fields()).to.be.equal(["vertices", "material", "xs", "ys", "zs"])
    expect(source.get("xs")).to.be.equal([[0, 2, 2], [0, 2, 0]])
    expect(source.get("ys")).to.be.equal([[0, 0, 2], [0, 2, 2]])
    expect(source.get("zs")).to.be.equal([[1, 2, 3], [1, 3, 4]])
    expect(source.get_record(1)).to.be.equal({
      vertices: [0, 2, 3], material: "b", xs: [0, 2, 0], ys: [0, 2, 2], zs: [1, 3, 4],
    })
  })

  it("accepts cell records", () => {
    const source = MeshDataSource.create({
      vertices: [[0, 0], [1, 0], [1, 1], [0, 1]],
      cells: [
        [[0, 1, 2], {material: "a", value: 10}],
        {vertices: [0, 2, 3], material: "b", value: 20},
      ],
    })

    expect(source.cells.get("vertices")).to.be.equal([[0, 1, 2], [0, 2, 3]])
    expect(source.cells.get("material")).to.be.equal(["a", "b"])
    expect(source.cells.get("value")).to.be.equal([10, 20])
  })

  it("rejects reserved connectivity in cell attributes", () => {
    expect(() => MeshDataSource.create({
      vertices: [[0, 0], [1, 0], [0, 1]],
      cells: [[[0, 1, 2], {faces: [2, 1, 0]}]],
      connectivity_field: "faces",
    })).to.throw(Error, "mesh cell attributes cannot contain the reserved 'faces' field")
  })

  it("filters and selects on the cell axis", () => {
    const source = MeshDataSource.create({
      vertices: [[0, 0], [1, 0], [1, 1], [0, 1]],
      cells: {vertices: [[0, 1, 2], [0, 2, 3]], material: ["a", "b"]},
    })
    const view = DataView.create({filter: GroupFilter.create({field_name: "material", group: "b"})})

    view.compute_indices(source)
    source.selected.indices = [1]

    expect([...view.indices]).to.be.equal([1])
    expect(source.selected.indices).to.be.equal([1])
    expect(source.cells.selected.indices).to.be.equal([1])
    expect(source.vertices.selected.indices).to.be.equal([])
  })

  it("invalidates gathered coordinates when either child source changes", () => {
    const source = MeshDataSource.create({
      vertices: {x: [0, 1, 2], y: [0, 0, 0]},
      cells: [[0, 1]],
    })

    expect(source.get("xs")).to.be.equal([[0, 1]])

    expect(source.vertices).to.be.instanceof(ColumnDataSource)
    const vertices = source.vertices as ColumnDataSource
    vertices.data = {x: [10, 11, 12], y: [0, 0, 0]}
    expect(source.get("xs")).to.be.equal([[10, 11]])

    expect(source.cells).to.be.instanceof(ColumnDataSource)
    const cells = source.cells as ColumnDataSource
    cells.data = {vertices: [[2, 0]]}
    expect(source.get("xs")).to.be.equal([[12, 10]])

    vertices.data = {x: [10, 11, 12], u: [20, 21, 22], y: [0, 0, 0]}
    source.x_field = "u"
    expect(source.get("xs")).to.be.equal([[22, 20]])
  })

  it("invalidates expressions evaluated against the cell axis", () => {
    const source = MeshDataSource.create({
      vertices: {x: [10, 20, 30], y: [0, 0, 0]},
      cells: [[0, 1]],
    })
    const lookup = IndexedLookup.create({source: source.vertices, field: "x"})

    expect(lookup.v_compute(source)).to.be.equal([[10, 20]])
    expect(lookup.v_compute(source)).to.be.equal([[10, 20]])

    expect(source.cells).to.be.instanceof(ColumnDataSource)
    const cells = source.cells as ColumnDataSource
    cells.data = {vertices: [[1, 2]]}

    expect(lookup.v_compute(source)).to.be.equal([[20, 30]])
  })

  it("doesn't forward vertex patch indices as cell indices", () => {
    const source = MeshDataSource.create({
      vertices: {x: [0, 1, 2], y: [0, 0, 0]},
      cells: [[0, 1], [1, 2]],
    })
    const changes: {path?: string[], indices?: number[]}[] = []
    source.data_changed.connect((change) => changes.push(change))

    expect(source.vertices).to.be.instanceof(ColumnDataSource)
    const vertices = source.vertices as ColumnDataSource
    vertices.patch({x: [[1, 10]]})

    expect(changes.at(-1)?.path).to.be.equal(["vertices"])
    expect(changes.at(-1)?.indices).to.be.undefined
  })
})
