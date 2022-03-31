import {expect} from "assertions"

import {PanTool, TapTool, ToolProxy} from "@bokehjs/models"
import {group_tools} from "@bokehjs/api/gridplot"
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

    const tools = group_tools([pan0, tap0, pan2, pan1, tap1, pan5, pan4, pan3, tap2])

    expect(tools.length).to.be.equal(5)
    const [t0, t1, t2, t3, t4] = tools

    assert(t0 instanceof ToolProxy)
    assert(t1 instanceof ToolProxy)
    assert(t3 instanceof ToolProxy)

    expect(t0.tools).to.be.equal([pan0, pan1])
    expect(t1.tools).to.be.equal([pan2, pan4, pan3])
    expect(t2).to.be.equal(pan5)
    expect(t3.tools).to.be.equal([tap0, tap1])
    expect(t4).to.be.equal(tap2)
  })
})
