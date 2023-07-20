import {expect} from "assertions"

import {
  PanTool, TapTool, SaveTool, BoxSelectTool, HoverTool,
  ToolProxy, BoxAnnotation, GlyphRenderer,
} from "@bokehjs/models"

import {gridplot, group_tools} from "@bokehjs/api/gridplot"
import {figure} from "@bokehjs/api/figure"
import {assert} from "@bokehjs/core/util/assert"

describe("api/gridplot module", () => {
  it("should support group_tools() function", () => {
    const pan0 = new PanTool({dimensions: "both"})
    const pan1 = new PanTool({dimensions: "both"})
    const pan2 = new PanTool({dimensions: "width"})
    const pan3 = new PanTool({dimensions: "width"})
    const pan4 = new PanTool({dimensions: "width"})
    const pan5 = new PanTool({dimensions: "height"})
    const tap0 = new TapTool({behavior: "select"})
    const tap1 = new TapTool({behavior: "select"})
    const tap2 = new TapTool({behavior: "inspect"})
    const save0 = new SaveTool({filename: "foo.png"})
    const save1 = new SaveTool({filename: "foo.png"})
    const select0 = new BoxSelectTool({overlay: new BoxAnnotation()})
    const select1 = new BoxSelectTool({overlay: new BoxAnnotation()})
    const select2 = new BoxSelectTool({overlay: new BoxAnnotation()})
    const hover0 = new HoverTool({renderers: [new GlyphRenderer()]})
    const hover1 = new HoverTool({renderers: [new GlyphRenderer()]})
    const hover2 = new HoverTool({renderers: [new GlyphRenderer()]})

    const tools = group_tools([
      pan0, tap0, pan2, pan1, tap1, pan5, pan4, pan3, tap2, save0,
      save1, select0, hover0, hover1, select1, select2, hover2,
    ], (_cls, group) => {
      return group[0] instanceof SaveTool ? new SaveTool() : null
    })

    expect(tools.length).to.be.equal(8)
    const [t0, t1, t2, t3, t4, t5, t6, t7] = tools

    assert(t0 instanceof ToolProxy)
    assert(t1 instanceof ToolProxy)
    assert(t2 instanceof PanTool)
    assert(t3 instanceof ToolProxy)
    assert(t4 instanceof TapTool)
    assert(t5 instanceof SaveTool)
    assert(t6 instanceof ToolProxy)
    assert(t7 instanceof ToolProxy)

    expect(t0.tools).to.be.equal([pan0, pan1])
    expect(t1.tools).to.be.equal([pan2, pan4, pan3])
    expect(t2).to.be.equal(pan5)
    expect(t3.tools).to.be.equal([tap0, tap1])
    expect(t4).to.be.equal(tap2)
    expect(t5).to.not.be.equal(save0)
    expect(t5).to.not.be.equal(save1)
    expect(t5.filename).to.be.equal(null)
    expect(t6.tools).to.be.equal([select0, select1, select2])
    expect(t7.tools).to.be.equal([hover0, hover1, hover2])
  })

  describe("implements gridplot() function", () => {
    it("that allows to merge toolbars' active_* and other properties (issue #13265)", () => {
      const p1 = figure({active_inspect: null})
      const p2 = figure({active_inspect: null})
      const p3 = figure({active_inspect: null})

      const gp0 = gridplot([[p1, p2, p3]], {merge_tools: true})
      expect(gp0.toolbar.active_inspect).to.be.null

      const p4 = figure({active_inspect: null})
      const p5 = figure({active_inspect: null})
      const p6 = figure({active_inspect: "auto"})

      const gp1 = gridplot([[p4, p5, p6]], {merge_tools: true})
      expect(gp1.toolbar.active_inspect).to.be.equal("auto")
    })
  })
})
