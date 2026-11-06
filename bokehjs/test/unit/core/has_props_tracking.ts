import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"

import {Model} from "@bokehjs/model"
import {UIElement, UIElementView} from "@bokehjs/models/ui/ui_element"
import {UIComponent, h} from "@bokehjs/core/vdom"
import type {VNode} from "@bokehjs/core/vdom"
import * as p from "@bokehjs/core/properties"

namespace Source {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    value: p.Property<number>
    label: p.NullStringSpec
    unused: p.Property<number>
  }
}
interface Source extends Source.Attrs {}
class Source extends Model {
  declare properties: Source.Props

  constructor(attrs?: Partial<Source.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Source.Props>(({Float}) => ({
      value: [ Float, 1 ],
      label: [ p.NullStringSpec, null ],
      unused: [ Float, 0 ],
    }))
  }

  /** A derived attribute, to verify that tracking is transitive. */
  get doubled(): number {
    return 2*this.value
  }
}

class ProbeView extends UIElementView {
  declare model: Probe

  renders = 0

  override component(): VNode {
    this.renders += 1
    // Read through model getters, not view's `signals` or `values`.
    const {source} = this.model
    const label = source.label as {value: string | null} | null
    const text = `${source.value}|${source.doubled}|${label?.value ?? "-"}`
    return h(UIComponent, {parent: this.resolved_props}, h("span", {}, text)) as VNode
  }

  get text(): string {
    return this.shadow_el.querySelector("span")?.textContent ?? ""
  }
}

namespace Probe {
  export type Attrs = p.AttrsOf<Props>
  export type Props = UIElement.Props & {
    source: p.Property<Source>
  }
}
interface Probe extends Probe.Attrs {}
class Probe extends UIElement {
  declare properties: Probe.Props
  declare __view_type__: ProbeView

  constructor(attrs?: Partial<Probe.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ProbeView

    this.define<Probe.Props>(({Ref}) => ({
      source: [ Ref(Source) ],
    }))
  }
}

describe("model getters", () => {
  async function probe(source: Source) {
    const model = Probe.create({source})
    const {view} = await display(model, [200, 50])
    return view
  }

  it("should register preact signals when accessed in vdom components", async () => {
    const source = Source.create({value: 1})
    const view = await probe(source)
    expect(view.text).to.be.equal("1|2|-")

    const renders = view.renders
    source.value = 5
    await view.ready
    expect(view.text).to.be.equal("5|10|-")
    expect(view.renders).to.be.equal(renders + 1)
  })

  it("should register preact signals of spec properties", async () => {
    const source = Source.create({label: "foo"})
    const view = await probe(source)
    expect(view.text).to.be.equal("1|2|foo")

    source.label = "bar"
    await view.ready
    expect(view.text).to.be.equal("1|2|bar")
  })

  it("should not re-render when properties that weren't accessed change", async () => {
    const source = Source.create()
    const view = await probe(source)

    const renders = view.renders
    source.unused = 1
    await view.ready
    expect(view.renders).to.be.equal(renders)
  })

  it("should follow references to other models", async () => {
    const source0 = Source.create({value: 1})
    const source1 = Source.create({value: 10})
    const view = await probe(source0)
    expect(view.text).to.be.equal("1|2|-")

    view.model.source = source1
    await view.ready
    expect(view.text).to.be.equal("10|20|-")

    // The previous model isn't tracked anymore.
    const renders = view.renders
    source0.value = 2
    await view.ready
    expect(view.renders).to.be.equal(renders)
    expect(view.text).to.be.equal("10|20|-")

    source1.value = 11
    await view.ready
    expect(view.text).to.be.equal("11|22|-")
  })
})
