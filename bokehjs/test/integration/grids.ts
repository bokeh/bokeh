import {display, fig} from "#framework/layouts"

describe("Grid", () => {
  it("should support cross bounds", async () => {
    const p = fig([300, 300])
    p.scatter({x: [4, 5, 6], y: [1, 2, 3], size: 20})

    p.xaxes.fixed_location = 1.5
    p.xaxes.bounds = [4, 5]
    p.xgrids.cross_bounds = [1, 3]

    p.yaxes.fixed_location = 4.5
    p.yaxes.bounds = [1, 3]
    p.ygrids.cross_bounds = [4, 5]

    await display(p)
  })
})
