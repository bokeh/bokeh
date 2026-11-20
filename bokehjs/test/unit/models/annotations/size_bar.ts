import {expect} from "#framework/assertions"
import {display, fig} from "#framework/layouts"
import {container} from "#framework/framework"

import {SizeBar} from "@bokehjs/models/annotations/size_bar"
import {Column} from "@bokehjs/models/layouts/column"
import {PanTool} from "@bokehjs/models/tools/gestures/pan_tool"
import {build_view} from "@bokehjs/core/build_views"
import {div} from "@bokehjs/core/dom"

describe("SizeBar annotation", () => {

  function make_plot() {
    const p = fig([300, 300])
    const r = p.circle({x: [1, 2, 3], y: [1, 2, 3], radius: [0.1, 0.2, 0.3]})
    const size_bar = SizeBar.create({renderer: r})
    p.add_layout(size_bar, "right")
    return {p, size_bar}
  }

  it("should support being laid out before after_render()", async () => {
    const expected = await (async () => {
      const {p, size_bar} = make_plot()
      const {view} = await display(p, [350, 350])
      await view.ready
      return view.owner.get_one(size_bar).bbox
    })()

    const {p, size_bar} = make_plot()
    const view = await build_view(p, {parent: null})
    const el = div({style: {width: "350px", height: "350px"}})
    container.append(el)
    try {
      el.append(view.el)

      view.render()
      expect(() => view.update_layout()).to.not.throw()
      expect(() => view.compute_layout()).to.not.throw()
      view.r_after_render()
      await view.ready

      const size_bar_view = view.owner.get_one(size_bar)
      expect(size_bar_view.bbox).to.be.equal(expected)
    } finally {
      view.remove()
      el.remove()
    }
  })

  it("should keep its placement when its figure is re-rendered inside a layout", async () => {
    const {p, size_bar} = make_plot()
    const {view} = await display(Column.create({children: [p]}), [350, 350])
    const plot_view = view.owner.get_one(p)
    const size_bar_view = view.owner.get_one(size_bar)
    await plot_view.ready
    const expected = size_bar_view.bbox

    p.toolbar.tools = [...p.toolbar.tools, PanTool.create({})]
    await plot_view.ready
    expect(size_bar_view.bbox).to.be.equal(expected)

    view.invalidate_render()
    await plot_view.ready
    expect(size_bar_view.bbox).to.be.equal(expected)
  })
})
