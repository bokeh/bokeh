import {many} from "@bokehjs/core/collections"
import {with_log_level} from "@bokehjs/core/logging"
import {LinearAxis} from "@bokehjs/models/axes/linear_axis"
import {expect} from "#framework/assertions"

describe("core/collections module", () => {
  it("Many should preserve array operations", () => {
    const axis0 = LinearAxis.create({axis_label: "A"})
    const axis1 = LinearAxis.create({axis_label: "B"})
    const axes = many([axis0, axis1])

    expect(axes.length).to.be.equal(2)
    expect(axes.map((axis) => axis.axis_label)).to.be.equal(["A", "B"])
    expect([...axes]).to.be.equal([axis0, axis1])
  })

  it("Many should forward attribute access and assignment", () => {
    const axis0 = LinearAxis.create({axis_label: "A"})
    const axis1 = LinearAxis.create({axis_label: "B"})
    const axes = many([axis0, axis1])

    expect(axes.axis_label as unknown).to.be.equal(["A", "B"])

    axes.axis_label = "C"

    expect(axis0.axis_label).to.be.equal("C")
    expect(axis1.axis_label).to.be.equal("C")
  })

  it("Many should provide first and one", () => {
    const axis0 = LinearAxis.create()
    const axis1 = LinearAxis.create()

    expect(many<LinearAxis>([]).first).to.be.undefined
    expect(many([axis0]).first).to.be.identical(axis0)
    expect(many([axis0, axis1]).first).to.be.identical(axis0)
    expect(many([axis0]).one()).to.be.identical(axis0)
    expect(() => many<LinearAxis>([]).one()).to.throw(Error, "expected exactly one item, found 0")
    expect(() => many([axis0, axis1]).one()).to.throw(Error, "expected exactly one item, found 2")
  })

  it("Many should reject attribute access on an empty collection", () => {
    const axes = many<LinearAxis>([])

    with_log_level("off", () => axes.visible = false)

    expect(axes).to.be.empty
    expect(() => axes.axis_label).to.throw(Error, "Trying to access 'axis_label' attribute on an empty Many collection")
  })

  it("Many should be a snapshot", () => {
    const axis0 = LinearAxis.create()
    const axis1 = LinearAxis.create()
    const source = [axis0, axis1]
    const axes = many(source)

    source.pop()
    expect([...axes]).to.be.equal([axis0, axis1])

    axes.pop()
    expect(source).to.be.equal([axis0])
  })
})
