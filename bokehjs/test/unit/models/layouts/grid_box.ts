import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"

import {GridBox} from "@bokehjs/models/layouts/grid_box"
import {Div} from "@bokehjs/models/widgets/div"

describe("GridBox", () => {
  it("should not throw when layout is invalidated before child views are built", async () => {
    const grid = GridBox.create({children: [[Div.create({text: "initial"}), 0, 0]], min_height: 100})
    const {view} = await display(grid, [300, 300])

    // children triggers an async build of child views, min_height synchronously invalidates layout
    grid.children = [0, 1, 2].map((i) => [Div.create({text: `cell ${i}`}), 0, i])
    expect(() => {
      grid.min_height = 200
    }).to.not.throw()
    await view.ready

    expect(view.child_views.length).to.be.equal(3)
  })
})
