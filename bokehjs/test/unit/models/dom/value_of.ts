import {expect} from "assertions"
import {display} from "_util"

import {ValueOf} from "@bokehjs/models/dom/value_of"
import {Model} from "@bokehjs/model"
import type * as p from "@bokehjs/core/properties"

namespace SomeModel {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    p0: p.Property<number>
  }
}

interface SomeModel extends SomeModel.Attrs {}

class SomeModel extends Model {
  constructor(attrs?: Partial<SomeModel.Attrs>) {
    super(attrs)
  }

  static {
    this.define<SomeModel.Props>(({Float}) => ({
      p0: [ Float, 0 ],
    }))
  }
}

describe("models/dom/value_of", () => {
  it("should support ValueOf with default formatter", async () => {
    const obj = new SomeModel({p0: Math.PI})
    const val = new ValueOf({obj, attr: "p0"})

    const {view} = await display(val, [200, 50])
    expect(view.el.textContent).to.be.equal("3.141592653589793")

    obj.p0 = 2*Math.PI
    await view.ready

    expect(view.el.textContent).to.be.equal("6.283185307179586")
  })

  it("should support ValueOf with printf formatter", async () => {
    const obj = new SomeModel({p0: Math.PI})
    const val = new ValueOf({obj, attr: "p0", formatter: "printf", format: "%.4f"})

    const {view} = await display(val, [200, 50])
    expect(view.el.textContent).to.be.equal("3.1416")

    obj.p0 = 2*Math.PI
    await view.ready

    expect(view.el.textContent).to.be.equal("6.2832")
  })
})
