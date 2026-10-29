import * as sinon from "sinon"

import {expect, expect_not_null} from "#framework/assertions"
import {display} from "#framework/layouts"
import {restorable} from "#framework/util"

import {Marked} from "marked"

import {Markdown} from "@bokehjs/models/widgets/markdown"
import {Row} from "@bokehjs/models/layouts/row"
import {Column} from "@bokehjs/models/layouts/column"
import {Div, DivView} from "@bokehjs/models/widgets/div"
import {Plot} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {defer} from "@bokehjs/core/util/defer"
import {dedent, markdown_extensions} from "@bokehjs/models/widgets/markdown_extensions"

describe("Markdown", () => {
  let url: string
  before_each(() => {
    url = window.location.href
  })
  after_each(() => {
    window.history.replaceState(null, "", url)
  })

  it("should keep updated prose and recover from a rejected child build", async () => {
    const child = Div.create({text: "Recovered"})
    const markdown = Markdown.create({text: "Old prose", embeds: {child}})
    const {view} = await display(markdown, [600, 400])
    {
      using fail = restorable(sinon.stub(DivView.prototype, "lazy_initialize").rejects(new Error("Resource unavailable")))
      markdown.text = "New prose\n\n::bokeh[child]"
      await view.ready
      expect(fail.callCount).to.be.equal(1)
      expect(view.contents.textContent.includes("New prose")).to.be.true
      expect(view.contents.querySelector(".bokeh-embed-error")?.textContent).to.be.equal("Failed to build Bokeh embed: child")
    }
    markdown.text = "Retry\n\n::bokeh[child]"
    await view.ready
    expect(view.owner.get_one(child).shadow_el.textContent.includes("Recovered")).to.be.true
    expect(view.contents.querySelector(".bokeh-embed-error")).to.be.null
  })

  for (const initial of [false, true]) {
    it(`should build healthy embeds after a failure and reuse them across retries (initial=${initial})`, async () => {
      const bad = Div.create({text: "Recovered child"})
      const good = Div.create({text: "Healthy child"})
      const text = "Current prose\n\n::bokeh[bad]\n\n::bokeh[good]"
      const markdown = Markdown.create({text: initial ? text : "Old prose", embeds: {bad, good}})
      const initialize = DivView.prototype.lazy_initialize
      let fail_bad = true
      using initialize_stub = restorable(sinon.stub(DivView.prototype, "lazy_initialize").callsFake(async function(this: DivView) {
        if (this.model == bad && fail_bad) {
          throw new Error("Resource unavailable")
        }
        await initialize.call(this)
      }))
      const {view} = await display(markdown, [600, 400])
      if (!initial) {
        markdown.text = text
        // A second update shares the pending failing and successful builds.
        markdown.text = `Updated ${text}`
        await view.ready
      }
      const good_view = view.owner.get_one(good)
      const slots = view.contents.querySelectorAll(".bokeh-embed")
      expect(slots[0].textContent).to.be.equal("Failed to build Bokeh embed: bad")
      expect(slots[1].firstElementChild).to.be.equal(good_view.el)
      expect(slots[1].classList.contains("bokeh-embed-error")).to.be.false
      expect(good_view.shadow_el.textContent.includes("Healthy child")).to.be.true
      expect(view.contents.textContent.includes("Current prose")).to.be.true

      using render = restorable(sinon.spy(good_view, "render"))
      markdown.text = `Retry ${text}`
      await view.ready
      expect(view.owner.get_one(good)).to.be.equal(good_view)
      expect(render.callCount).to.be.equal(0)
      expect(view.contents.querySelectorAll(".bokeh-embed-error").length).to.be.equal(1)
      expect(initialize_stub.getCalls().filter((call) => call.thisValue.model == good).length).to.be.equal(1)

      fail_bad = false
      markdown.text = `Recovered ${text}`
      await view.ready
      expect(view.contents.querySelector(".bokeh-embed-error")).to.be.null
      expect(view.owner.get_one(good)).to.be.equal(good_view)
      expect(view.owner.get_one(bad).shadow_el.textContent.includes("Recovered child")).to.be.true
      expect(render.callCount).to.be.equal(0)
    })
  }

  it("should isolate two failed embeds around a healthy embed", async () => {
    const first = Div.create()
    const good = Div.create({text: "Healthy child"})
    const last = Div.create()
    const initialize = DivView.prototype.lazy_initialize
    using failures = restorable(sinon.stub(DivView.prototype, "lazy_initialize").callsFake(async function(this: DivView) {
      if (this.model == first || this.model == last) {
        throw new Error("Resource unavailable")
      }
      await initialize.call(this)
    }))
    const markdown = Markdown.create({text: "::bokeh[first]\n\n::bokeh[good]\n\n::bokeh[last]", embeds: {first, good, last}})
    const {view} = await display(markdown, [600, 400])
    const good_view = view.owner.get_one(good)
    const slots = view.contents.querySelectorAll(".bokeh-embed")
    expect(slots[0].textContent).to.be.equal("Failed to build Bokeh embed: first")
    expect(slots[1].firstElementChild).to.be.equal(good_view.el)
    expect(slots[1].classList.contains("bokeh-embed-error")).to.be.false
    expect(slots[2].textContent).to.be.equal("Failed to build Bokeh embed: last")
    expect(view.contents.querySelectorAll(".bokeh-embed-error").length).to.be.equal(2)
    expect(good_view.shadow_el.textContent.includes("Healthy child")).to.be.true
    expect(failures.callCount).to.be.equal(3)
  })

  it("should show a connection failure and recover without replacing healthy embeds", async () => {
    const bad = Div.create({text: "Recovered child"})
    const good = Div.create({text: "Healthy child"})
    const connect = DivView.prototype.connect_signals
    let fail_bad = true
    using connections = restorable(sinon.stub(DivView.prototype, "connect_signals").callsFake(function(this: DivView) {
      connect.call(this)
      if (this.model == bad && fail_bad) {
        throw new Error("Connection unavailable")
      }
    }))
    using remove = restorable(sinon.spy(DivView.prototype, "remove"))
    const text = "::bokeh[bad]\n\n::bokeh[good]"
    const markdown = Markdown.create({text, embeds: {bad, good}})
    const {view} = await display(markdown, [600, 400])
    const good_view = view.owner.get_one(good)
    const failed = remove.getCalls().filter((call) => call.thisValue.model == bad)
    expect(failed.length).to.be.equal(1)
    expect(failed[0].thisValue.is_destroyed).to.be.true
    expect(view.contents.querySelector(".bokeh-embed-error")?.textContent).to.be.equal("Failed to build Bokeh embed: bad")
    expect(view.child_views).to.be.equal([good_view])

    using render = restorable(sinon.spy(good_view, "render"))
    fail_bad = false
    markdown.text = `Retry\n\n${text}`
    await view.ready
    expect(view.contents.querySelector(".bokeh-embed-error")).to.be.null
    expect(view.owner.get_one(bad).shadow_el.textContent.includes("Recovered child")).to.be.true
    expect(view.owner.get_one(good)).to.be.equal(good_view)
    expect(render.callCount).to.be.equal(0)
    expect(connections.getCalls().filter((call) => call.thisValue.model == bad).length).to.be.equal(2)
  })

  it("should dispose a pending failed embed without observing it after parent removal", async () => {
    const child = Div.create()
    const markdown = Markdown.create({embeds: {child}})
    const {view} = await display(markdown, [600, 400])
    let started: () => void = () => {}
    const initializing = new Promise<void>((resolve) => { started = resolve })
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => { release = resolve })
    const pending: DivView[] = []
    const initialize = DivView.prototype.lazy_initialize
    using failure = restorable(sinon.stub(DivView.prototype, "lazy_initialize").callsFake(async function(this: DivView) {
      await initialize.call(this)
      pending.push(this)
      started()
      await gate
      throw new Error("Resource unavailable")
    }))
    using observe = restorable(sinon.spy(ResizeObserver.prototype, "observe"))
    using builds = restorable(sinon.spy(view, "build_child_views"))
    markdown.text = "::bokeh[child]"
    await initializing
    expect(builds.callCount).to.be.equal(1)
    view.remove()
    observe.resetHistory()
    release()
    // Removed views' ready resolves before their pending builds finish.
    await builds.returnValues[0]
    expect(failure.callCount).to.be.equal(1)
    expect(pending[0].is_destroyed).to.be.true
    expect(observe.callCount).to.be.equal(0)
    expect(view.child_views.length).to.be.equal(0)
    expect(view.sig_child_views.length).to.be.equal(0)
  })

  it("should ignore a stale failure after an embed mapping changes", async () => {
    const bad = Div.create()
    const replacement = Div.create({text: "Replacement child"})
    const markdown = Markdown.create({embeds: {child: bad}})
    const {view} = await display(markdown, [600, 400])
    let started: () => void = () => {}
    const initializing = new Promise<void>((resolve) => { started = resolve })
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => { release = resolve })
    const initialize = DivView.prototype.lazy_initialize
    const pending: DivView[] = []
    using failure = restorable(sinon.stub(DivView.prototype, "lazy_initialize").callsFake(async function(this: DivView) {
      await initialize.call(this)
      if (this.model == bad) {
        pending.push(this)
        started()
        await gate
        throw new Error("Resource unavailable")
      }
    }))
    markdown.text = "::bokeh[child]"
    await initializing
    markdown.embeds = {child: replacement}
    await defer()
    const replacement_view = view.owner.get_one(replacement)
    release()
    await view.ready
    expect(failure.callCount).to.be.equal(2)
    expect(pending[0].is_destroyed).to.be.true
    expect(view.owner.get_one(replacement)).to.be.equal(replacement_view)
    expect(replacement_view.shadow_el.textContent.includes("Replacement child")).to.be.true
    expect(view.contents.querySelector(".bokeh-embed-error")).to.be.null
    expect(view.contents.querySelector(".bokeh-embed")?.firstElementChild).to.be.equal(replacement_view.el)
    expect(view.sig_child_views).to.be.equal([replacement_view])
  })

  it("should retain and clean up successful views when a later child build fails", async () => {
    const good = Div.create({text: "Good child"})
    const bad = Div.create({text: "Bad child"})
    const markdown = Markdown.create({text: "Old prose", embeds: {good, bad}})
    const {view} = await display(markdown, [600, 400])
    const initialize = DivView.prototype.lazy_initialize
    using fail = restorable(sinon.stub(DivView.prototype, "lazy_initialize"))
    fail.onFirstCall().callsFake(initialize)
    fail.onSecondCall().rejects(new Error("Resource unavailable"))
    markdown.text = "New prose\n\n::bokeh[good]\n\n::bokeh[bad]"
    await view.ready
    const good_view = view.owner.get_one(good)
    expect(good_view.shadow_el.textContent.includes("Good child")).to.be.true
    expect(view.contents.querySelectorAll(".bokeh-embed-error").length).to.be.equal(1)
    markdown.text = "No embeds"
    await view.ready
    expect(good_view.is_destroyed).to.be.true
    expect(view.sig_child_views.length).to.be.equal(0)
  })

  it("should render prose when an initial child build fails", async () => {
    const child = Div.create()
    using fail = restorable(sinon.stub(DivView.prototype, "lazy_initialize").rejects(new Error("Resource unavailable")))
    const markdown = Markdown.create({text: "Initial prose\n\n::bokeh[child]", embeds: {child}})
    const {view} = await display(markdown, [600, 400])
    expect(fail.callCount).to.be.equal(1)
    expect(view.contents.textContent.includes("Initial prose")).to.be.true
    expect_not_null(view.contents.querySelector(".bokeh-embed-error"))
  })

  it("should fill remaining row width for embeds while respecting explicit sizing policies", async () => {
    const plot = Plot.create({sizing_mode: "stretch_width", height: 160, margin: 0})
    const markdown = Markdown.create({text: "Short.\n\n::bokeh[plot]", embeds: {plot}, margin: 0})
    const other = Div.create({width: 100, margin: 0})
    const root = Row.create({children: [markdown, other], sizing_mode: "stretch_width", spacing: 0, margin: 0})
    const {view} = await display(root, [600, 400])
    const child = view.owner.get_one(markdown)
    expect(Math.round(child.el.getBoundingClientRect().width)).to.be.equal(500)
    expect(Math.round(view.owner.get_one(plot).el.getBoundingClientRect().width)).to.be.equal(500)
    markdown.width_policy = "fit"
    await view.ready
    expect(child.box_sizing().width_policy).to.be.equal("fit")
    markdown.width_policy = "min"
    await view.ready
    expect(child.el.getBoundingClientRect().width).to.be.below(100)
    markdown.width_policy = "auto"
    markdown.width = 250
    await view.ready
    expect(Math.round(child.el.getBoundingClientRect().width)).to.be.equal(250)
  })

  it("should reserve later explicit IDs before assigning suffixes", async () => {
    const markdown = Markdown.create({text: "## A {#x}\n\n## B {#x}\n\n## C {#x-1}\n\n[go](#x-1)"})
    const {view} = await display(markdown, null)
    expect([...view.contents.querySelectorAll("h2")].map((heading) => heading.id)).to.be.equal(["x", "x-2", "x-1"])
    expect(view.contents.querySelector('p a[href="#x-1"]')?.textContent).to.be.equal("go")
  })

  it("should ignore raw HTML embed and heading markers while retaining real extensions", async () => {
    const child = Div.create({text: "Real embed"})
    const markdown = Markdown.create({text: 'Inline <span class="bokeh-embed" data-bokeh-embed="child"></span> text\n\n<h2 data-heading-id="has space&quot;x">Raw heading</h2>\n\n::bokeh[child]\n\n## Explicit {#real-id}', embeds: {child}})
    const {view} = await display(markdown, [600, 400])
    expect(view.contents.querySelector("span")?.childElementCount).to.be.equal(0)
    expect(view.contents.querySelectorAll("[data-bokeh-embed]").length).to.be.equal(1)
    expect(view.contents.querySelector(".bokeh-embed-error")).to.be.null
    expect([...view.contents.querySelectorAll("h2")].map((heading) => heading.id)).to.be.equal(["raw-heading", "real-id"])
    expect(view.child_views.length).to.be.equal(1)
  })

  it("should parse heading-interrupted paragraphs without quadratic scans", () => {
    const parser = new Marked(markdown_extensions())
    parser.parse("# Warmup\nText\n", {async: false})
    const start = performance.now()
    const html = parser.parse("# H\nText line\n".repeat(8000), {async: false})
    expect(performance.now() - start).to.be.below(1000)
    expect(html.match(/<h1>/g)?.length).to.be.equal(8000)
    expect(html.match(/<p>/g)?.length).to.be.equal(8000)
  })

  it("should reject ancestor embeds through nested layouts", async () => {
    const markdown = Markdown.create({text: "::bokeh[parent]"})
    const nested = Column.create({children: [markdown]})
    const parent = Column.create({children: [nested]})
    markdown.embeds = {parent}
    const {view} = await display(parent, [600, 400])
    const markdown_view = view.owner.get_one(markdown)
    expect(markdown_view.child_views.length).to.be.equal(0)
    expect(markdown_view.contents.querySelector(".bokeh-embed-error")?.textContent)
      .to.be.equal("Cannot embed an ancestor layout: parent")
  })

  it("should reject a directly containing layout and self embeds", async () => {
    const markdown = Markdown.create({text: "::bokeh[parent]\n\n::bokeh[self]"})
    const parent = Column.create({children: [markdown]})
    markdown.embeds = {parent, self: markdown}
    const {view} = await display(parent, [600, 400])
    const markdown_view = view.owner.get_one(markdown)
    expect(markdown_view.child_views.length).to.be.equal(0)
    expect([...markdown_view.contents.querySelectorAll(".bokeh-embed-error")].map((el) => el.textContent))
      .to.be.equal(["Cannot embed an ancestor layout: parent", "Cannot embed Markdown in itself: self"])
  })

  it("should bound mutually recursive Markdown embeds", async () => {
    const first = Markdown.create({text: "::bokeh[other]"})
    const second = Markdown.create({text: "::bokeh[other]", embeds: {other: first}})
    first.embeds = {other: second}
    const {view} = await display(first, [600, 400])
    const second_view = view.owner.get_one(second)
    expect(view.child_views.length).to.be.equal(1)
    expect(second_view.child_views.length).to.be.equal(0)
    expect(second_view.contents.querySelector(".bokeh-embed-error")?.textContent)
      .to.be.equal("Cannot embed an ancestor layout: other")
  })

  it("should render an embed once when synchronous updates share its pending build", async () => {
    const child = Div.create({text: "Embedded content"})
    const markdown = Markdown.create({embeds: {child}})
    const {view} = await display(markdown, [600, 400])
    using spy = restorable(sinon.spy(DivView.prototype, "render"))
    markdown.text = "::bokeh[child]"
    markdown.text = "Prose\n\n::bokeh[child]"
    await view.ready
    const child_view = view.owner.get_one(child)
    expect(spy.callCount).to.be.equal(1)
    expect(child_view.shadow_el.textContent.includes("Embedded content")).to.be.true
    expect(view.contents.querySelector(".bokeh-embed")?.firstElementChild).to.be.equal(child_view.el)
  })

  it("should render after synchronous mapping and text updates", async () => {
    const child = Div.create({text: "New child"})
    const markdown = Markdown.create({text: "::bokeh[child]"})
    const {view} = await display(markdown, [600, 400])
    using render = restorable(sinon.spy(DivView.prototype, "render"))
    markdown.embeds = {child}
    markdown.text = "Prose\n\n::bokeh[child]"
    await view.ready
    expect(render.callCount).to.be.equal(1)
    expect(view.owner.get_one(child).shadow_el.textContent.includes("New child")).to.be.true
  })

  it("should dispose a pending embed removed synchronously and render it when re-added", async () => {
    const child = Div.create({text: "Embedded content"})
    const markdown = Markdown.create({embeds: {child}})
    const {view} = await display(markdown, [600, 400])
    using remove = restorable(sinon.spy(DivView.prototype, "remove"))
    using render = restorable(sinon.spy(DivView.prototype, "render"))
    markdown.text = "::bokeh[child]"
    markdown.text = "No embeds"
    await view.ready
    expect(view.child_views.length).to.be.equal(0)
    expect(remove.callCount).to.be.equal(1)
    expect(view.sig_child_views.length).to.be.equal(0)
    markdown.text = "::bokeh[child]"
    await view.ready
    expect(render.callCount).to.be.equal(1)
    expect(view.owner.get_one(child).shadow_el.textContent.includes("Embedded content")).to.be.true
  })

  for (const nested of [false, true]) {
    it(`should fill available width for an embed without an explicit Markdown width (nested=${nested})`, async () => {
      const plot = Plot.create({height: 160, sizing_mode: "stretch_width", margin: 0})
      const markdown = Markdown.create({text: "Short.\n\n::bokeh[plot]", embeds: {plot}, margin: 0})
      const root = nested ? Column.create({children: [markdown], sizing_mode: "stretch_width"}) : markdown
      const {view} = await display(root, [600, 400])
      expect(Math.round(view.owner.get_one(plot).el.getBoundingClientRect().width)).to.be.equal(600)
    })
  }

  it("should allocate unique explicit heading IDs without stealing footnote targets", async () => {
    const markdown = Markdown.create({text: "## A {#same}\n\n## B {#same}\n\n## Note {#footnote-note}\n\nText[^note].\n\n[^note]: Details.", disable_anchors: true})
    const {view} = await display(markdown, null)
    const ids = [...view.contents.querySelectorAll("[id]")].map((el) => el.id)
    expect(new Set(ids).size).to.be.equal(ids.length)
    expect([...view.contents.querySelectorAll("h2:not(#footnote-label)")].map((el) => el.id))
      .to.be.equal(["same", "same-1", "footnote-note-1"])
    expect_not_null(view.contents.querySelector("li#footnote-note"))
  })

  it("should recognize definition lists interrupting prose with blank-line lookahead", () => {
    const parser = new Marked(markdown_extensions())
    const html = parser.parse("Intro\nTerm\n\n: Definition\n\nAfter\n\n::bokeh[plot]", {async: false})
    expect(html.includes("<dt>Term</dt>")).to.be.true
    expect(html.includes("<dd><p>Definition</p>")).to.be.true
    expect(html.includes('data-bokeh-embed="plot"')).to.be.true
    expect(html.includes("<p>After</p>")).to.be.true
  })

  it("should parse long documents without repeatedly scanning their remaining paragraphs", () => {
    const parser = new Marked(markdown_extensions())
    // A generous bound catches the former multi-second quadratic scan without relying on ratios.
    parser.parse("Warmup\n\nTerm\n: Definition\n", {async: false})
    const source = `${"A short paragraph.\n\n".repeat(8000)}Term\n: Definition\n`
    const start = performance.now()
    const html = parser.parse(source, {async: false})
    expect(performance.now() - start).to.be.below(1000)
    expect(html.match(/<p>/g)?.length).to.be.equal(8001)
    expect(html.includes("<dl>")).to.be.true
  })

  it("should dedent common whitespace while preserving relative indentation", async () => {
    expect(dedent("\tText\n\t\tCode\n\t \n")).to.be.equal("Text\n\tCode\n\n")
    expect(dedent("  Text\n\tOther")).to.be.equal("  Text\n\tOther")
    expect(dedent("    Text\r\n        Code\r\n")).to.be.equal("Text\n    Code\n")
    const markdown = Markdown.create({text: "    # Heading\n\n        literal code\n"})
    const {view} = await display(markdown, null)
    expect(view.contents.querySelector("h1")?.textContent).to.be.equal("Heading #")
    expect(view.contents.querySelector("pre code")?.textContent).to.be.equal("literal code\n")
    markdown.dedent = false
    expect(view.contents.querySelector("h1")).to.be.null
    expect(view.contents.querySelector("pre code")?.textContent.startsWith("# Heading")).to.be.true
    markdown.dedent = true
    expect_not_null(view.contents.querySelector("h1"))
  })

  it("should toggle soft line breaks without changing code or adding blank callout lines", async () => {
    const markdown = Markdown.create({text: "First line\nSecond line\n\n> [!NOTE]\n> Callout\n\n```text\nfirst\nsecond\n```"})
    const {view} = await display(markdown, null)
    expect(view.contents.querySelectorAll("br").length).to.be.equal(0)
    markdown.hard_line_break = true
    expect(view.contents.querySelectorAll("br").length).to.be.equal(1)
    expect(view.contents.querySelector(".admonition")?.textContent.includes("Callout")).to.be.true
    expect(view.contents.querySelector("pre code")?.textContent).to.be.equal("first\nsecond\n")
    markdown.hard_line_break = false
    expect(view.contents.querySelectorAll("br").length).to.be.equal(0)
  })

  it("should preserve multiline math with hard line breaks without removing prose breaks", async () => {
    const markdown = Markdown.create({text: "Before\n$$\nx+1\n$$\nMiddle\n$$\ny+1\n$$\nAfter", hard_line_break: true})
    const {view} = await display(markdown, null)
    expect(view.contents.querySelectorAll("svg").length).to.be.equal(2)
    expect(view.contents.querySelectorAll("br").length).to.be.equal(4)
    expect(view.contents.querySelector("[data-mjx-error]")).to.be.null
    markdown.disable_math = true
    expect(view.contents.querySelectorAll("svg").length).to.be.equal(0)
    expect(view.contents.querySelectorAll("br").length).to.be.equal(8)
  })

  it("should disable automatic heading anchors while retaining explicit IDs and footnotes", async () => {
    const markdown = Markdown.create({text: '# Automatic\n\n## Explicit {#custom}\n\n<h2 id="html-id">HTML</h2>\n\nNote[^n].\n\n[^n]: Details.'})
    const {view} = await display(markdown, null)
    markdown.disable_anchors = true
    expect(view.contents.querySelector("h1")?.hasAttribute("id")).to.be.false
    expect(view.contents.querySelector(".heading-anchor")).to.be.null
    expect_not_null(view.shadow_el.getElementById("custom"))
    expect_not_null(view.shadow_el.getElementById("html-id"))
    expect_not_null(view.contents.querySelector("[data-footnote-ref]"))
    markdown.disable_anchors = false
    expect(view.contents.querySelector("h1")?.id).to.be.equal("automatic")
    expect(view.contents.querySelectorAll(".heading-anchor").length).to.be.equal(3)
  })

  it("should reconcile embeds exposed by dedenting and retain them across presentation changes", async () => {
    const child = Div.create({text: "Child"})
    const markdown = Markdown.create({text: "    ::bokeh[child]", dedent: false, embeds: {child}})
    const {view} = await display(markdown, null)
    expect(view.child_views.length).to.be.equal(0)
    markdown.dedent = true
    await view.ready
    const child_view = view.owner.get_one(child)
    markdown.hard_line_break = true
    markdown.disable_anchors = true
    await view.ready
    expect(view.owner.get_one(child)).to.be.equal(child_view)
    markdown.dedent = false
    await view.ready
    expect(child_view.is_destroyed).to.be.true
    expect(view.child_views.length).to.be.equal(0)
  })

  it("should embed named models as blocks and leave unused models unbuilt", async () => {
    const child = Div.create({text: "Embedded content"})
    const unused = Div.create({text: "Unused"})
    const markdown = Markdown.create({text: "Before\n\n::bokeh[content]\n\nAfter", embeds: new Map([["content", child], ["unused", unused]])})
    const {view} = await display(markdown, null)
    expect(view.child_models).to.be.equal([child])
    const slot = view.contents.querySelector(".bokeh-embed")
    expect_not_null(slot)
    expect(slot.firstElementChild).to.be.equal(view.child_views[0].el)
    expect(view.contents.firstElementChild?.textContent).to.be.equal("Before")
    expect(view.contents.lastElementChild?.textContent).to.be.equal("After")
  })

  it("should preserve embedded views and state while editing or reordering prose", async () => {
    const first = Div.create({text: "First"})
    const second = Div.create({text: "Second"})
    const markdown = Markdown.create({text: "::bokeh[first]\n\n::bokeh[second]", embeds: {first, second}})
    const {view} = await display(markdown, null)
    const first_view = view.owner.get_one(first)
    const second_view = view.owner.get_one(second)
    using spy = restorable(sinon.spy(first_view, "render"))
    first.text = "Updated child"
    markdown.text = "New prose\n\n::bokeh[second]\n\n::bokeh[first]"
    await view.ready
    expect(view.owner.get_one(first)).to.be.equal(first_view)
    expect(spy.callCount).to.be.equal(0)
    expect([...view.contents.querySelectorAll(".bokeh-embed")].map((el) => el.firstElementChild))
      .to.be.equal([second_view.el, first_view.el])
    expect(first.text).to.be.equal("Updated child")
  })

  it("should reconcile mappings and remove unused or destroyed child views", async () => {
    const first = Div.create({text: "First"})
    const second = Div.create({text: "Second"})
    const markdown = Markdown.create({text: "::bokeh[child]", embeds: {child: first}})
    const {view} = await display(markdown, null)
    const first_view = view.owner.get_one(first)
    markdown.embeds = {child: second}
    await view.ready
    const second_view = view.owner.get_one(second)
    expect(first_view.is_destroyed).to.be.true
    expect(view.contents.querySelector(".bokeh-embed")?.firstElementChild).to.be.equal(second_view.el)
    markdown.text = "No embed"
    await view.ready
    expect(second_view.is_destroyed).to.be.true
    expect(view.child_views.length).to.be.equal(0)
    markdown.text = "::bokeh[child]"
    await view.ready
    const restored = view.owner.get_one(second)
    expect(restored).to.not.be.equal(second_view)
    view.remove()
    expect(restored.is_destroyed).to.be.true
  })

  it("should explain missing and duplicate embeds without mounting a model twice", async () => {
    const child = Div.create({text: "Content"})
    const markdown = Markdown.create({text: "::bokeh[missing]\n\n::bokeh[constructor]\n\n::bokeh[first]\n\n::bokeh[alias]", embeds: {first: child, alias: child}})
    const {view} = await display(markdown, null)
    expect(view.child_models).to.be.equal([child])
    expect([...view.contents.querySelectorAll(".bokeh-embed-error")].map((el) => el.textContent)).to.be.equal([
      "Unknown Bokeh embed: missing", "Unknown Bokeh embed: constructor", "Bokeh model is already embedded: alias",
    ])
  })

  it("should treat embed syntax in code and inline prose as literal text", async () => {
    const child = Div.create({text: "Content"})
    const markdown = Markdown.create({text: "Inline ::bokeh[child] text\n\n`::bokeh[child]`\n\n```text\n::bokeh[child]\n```", embeds: {child}})
    const {view} = await display(markdown, null)
    expect(view.child_models).to.be.equal([])
    expect(view.contents.querySelector(".bokeh-embed")).to.be.null
  })

  it("should reconcile rapid text and mapping changes without stale child views", async () => {
    const first = Div.create({text: "First"})
    const second = Div.create({text: "Second"})
    const markdown = Markdown.create()
    const {view} = await display(markdown, null)
    markdown.embeds = {first}
    markdown.text = "::bokeh[first]"
    markdown.embeds = {second}
    markdown.text = "::bokeh[second]"
    await view.ready
    expect(view.child_views.map((child) => child.model)).to.be.equal([second])
    expect(view.contents.querySelector(".bokeh-embed")?.firstElementChild).to.be.equal(view.child_views[0].el)
    expect(view.contents.querySelector(".bokeh-embed-error")).to.be.null
  })

  it("should dispose an embedded view still being built when its parent is removed", async () => {
    const child = Div.create({text: "Content"})
    const markdown = Markdown.create({embeds: {child}})
    const {view} = await display(markdown, null)
    let started: () => void = () => {}
    const initializing = new Promise<void>((resolve) => { started = resolve })
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => { release = resolve })
    const initialize = DivView.prototype.lazy_initialize
    using pending = restorable(sinon.stub(DivView.prototype, "lazy_initialize").callsFake(async function(this: DivView) {
      await initialize.call(this)
      started()
      await gate
    }))
    using spy = restorable(sinon.spy(DivView.prototype, "remove"))
    using builds = restorable(sinon.spy(view, "build_child_views"))
    markdown.text = "::bokeh[child]"
    await initializing
    expect(builds.callCount).to.be.equal(1)
    view.remove()
    release()
    await builds.returnValues[0]
    expect(pending.callCount).to.be.equal(1)
    expect(view.child_views.length).to.be.equal(0)
    expect(view.sig_child_views.length).to.be.equal(0)
    expect(spy.callCount).to.be.equal(1)
  })

  it("should size an embedded plot to the text width and preserve its range", async () => {
    const x_range = Range1d.create({start: 0, end: 10})
    const plot = Plot.create({x_range, y_range: Range1d.create({start: 0, end: 10}), height: 160, sizing_mode: "stretch_width", margin: 0})
    const markdown = Markdown.create({text: "::bokeh[trend]", embeds: {trend: plot}, width: 400})
    const {view} = await display(markdown, null)
    const plot_view = view.owner.get_one(plot)
    expect(Math.round(plot_view.el.getBoundingClientRect().width)).to.be.equal(400)
    expect(Math.round(plot_view.el.getBoundingClientRect().height)).to.be.equal(160)
    x_range.start = 2
    markdown.text = "Updated prose\n\n::bokeh[trend]"
    await view.ready
    expect(view.owner.get_one(plot)).to.be.equal(plot_view)
    expect(x_range.start).to.be.equal(2)
  })

  it("should lay out a plot embedded in an initially collapsed section when opened", async () => {
    const plot = Plot.create({x_range: Range1d.create({start: 0, end: 10}), y_range: Range1d.create({start: 0, end: 10}), width: 250, height: 160})
    const markdown = Markdown.create({text: "<details>\n<summary>Plot</summary>\n\n::bokeh[plot]\n\n</details>", embeds: {plot}, width: 400})
    const {view} = await display(markdown, null)
    view.contents.querySelector("summary")!.click()
    await defer()
    await view.ready
    expect(Math.round(view.owner.get_one(plot).el.getBoundingClientRect().width)).to.be.equal(250)
  })

  it("should render supported admonitions and preserve ordinary blockquotes and code", async () => {
    const markdown = Markdown.create()
    const {view} = await display(markdown, null)
    for (const kind of ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"]) {
      markdown.text = `> [!${kind}]\n> A **formatted** callout.\n>\n> - One\n> - Two`
      const quote = view.contents.querySelector("blockquote")
      expect_not_null(quote)
      expect(quote.classList.contains(`admonition-${kind.toLowerCase()}`)).to.be.true
      expect(quote.querySelector(".admonition-title")?.textContent).to.be.equal(kind[0] + kind.slice(1).toLowerCase())
      expect(quote.querySelector("strong")?.textContent).to.be.equal("formatted")
      expect(quote.querySelectorAll("li").length).to.be.equal(2)
    }
    markdown.text = "> [!UNKNOWN]\n> Ordinary quote\n\n```text\n> [!NOTE]\n```"
    expect(view.contents.querySelector(".admonition")).to.be.null
    expect(view.contents.querySelector("code")?.textContent).to.be.equal("> [!NOTE]\n")
  })

  it("should render definition lists with multiple definitions, continuation blocks, and references", async () => {
    const markdown = Markdown.create({text: "Intro paragraph.\n\n**Term**\n: First [link][ref].\n: Second definition.\n\n    More **details**.\n\nAnother term\n: Another definition.\n\nAfter paragraph.\n\n[ref]: https://bokeh.org"})
    const {view} = await display(markdown, null)
    expect(view.contents.querySelectorAll("dl").length).to.be.equal(1)
    expect(view.contents.querySelectorAll("dt").length).to.be.equal(2)
    expect(view.contents.querySelectorAll("dd").length).to.be.equal(3)
    expect(view.contents.querySelector("dt strong")?.textContent).to.be.equal("Term")
    expect(view.contents.querySelector("dd a")?.getAttribute("href")).to.be.equal("https://bokeh.org")
    expect(view.contents.querySelector("dd strong")?.textContent).to.be.equal("details")
    expect(view.contents.firstElementChild?.textContent).to.be.equal("Intro paragraph.")
    expect(view.contents.lastElementChild?.textContent).to.be.equal("After paragraph.")
    markdown.text = "```text\nTerm\n: Definition\n```\n\nNot a definition: ordinary prose."
    expect(view.contents.querySelector("dl")).to.be.null
  })

  it("should support interactive collapsible sections with Markdown and sanitized HTML", async () => {
    const markdown = Markdown.create({text: '<details>\n<summary>More</summary>\n\n**Details**\n\n```python\nprint(42)\n```\n\n<img src=x onerror="alert(1)">\n\n</details>'})
    const {view} = await display(markdown, null)
    const details = view.contents.querySelector("details")
    expect_not_null(details)
    expect(details.open).to.be.false
    expect(details.querySelector("strong")?.textContent).to.be.equal("Details")
    expect_not_null(details.querySelector("code.hljs"))
    expect(view.contents.querySelector("[onerror]")).to.be.null
    details.querySelector("summary")!.click()
    expect(details.open).to.be.true
    details.querySelector("summary")!.click()
    expect(details.open).to.be.false
  })

  it("should combine definition lists with footnotes, callouts, math, and sanitization", async () => {
    const markdown = Markdown.create({text: 'Term\n: A note[^note] and $$f\'(x)$$.\n\n    > [!TIP]\n    > More **details**.\n\n    <img src=x onerror="alert(1)">\n\n[^note]: Supporting text.'})
    const {view} = await display(markdown, null)
    expect_not_null(view.contents.querySelector("dd [data-footnote-ref]"))
    expect_not_null(view.contents.querySelector(".footnotes li"))
    expect(view.contents.querySelector("dd .admonition-tip strong")?.textContent).to.be.equal("details")
    expect_not_null(view.contents.querySelector("dd svg use"))
    expect(view.contents.querySelector("[data-mjx-error], [onerror]")).to.be.null
    markdown.text = "Term\n: Definition at end of input"
    expect(view.contents.querySelector("dd")?.textContent).to.be.equal("Definition at end of input\n")
  })

  it("should preserve explicit Markdown heading IDs and reserve them before automatic IDs", async () => {
    const markdown = Markdown.create({text: "# Stable\n\n## A **title** {#stable}\n\n## Images {#images}\n\n[Jump](#stable)"})
    const {view} = await display(markdown, null)
    expect(view.contents.querySelector("h1")?.id).to.be.equal("stable-1")
    expect(view.contents.querySelector("h2#stable strong")?.textContent).to.be.equal("title")
    expect(view.contents.querySelector("h2#stable")?.textContent).to.be.equal("A title #")
    expect_not_null(view.contents.querySelector("h2#images"))
    using spy = restorable(sinon.spy(Element.prototype, "scrollIntoView"))
    view.contents.querySelector<HTMLAnchorElement>("p a")!.click()
    expect(spy.thisValues.at(-1)).to.be.equal(view.shadow_el.getElementById("stable"))
    markdown.text = "## Renamed {#stable}"
    expect(view.contents.querySelector("h2#stable")?.textContent).to.be.equal("Renamed #")
    markdown.text = "# Literal `text {#code}`\n\n## Escaped \\{#escaped\\}\n\n## Invalid {#has spaces}"
    expect(view.shadow_el.getElementById("code")).to.be.null
    expect(view.shadow_el.getElementById("escaped")).to.be.null
    expect(view.contents.querySelector("h2")?.textContent).to.be.equal("Escaped {#escaped} #")
  })

  it("should render raw TeX characters without interpreting surrounding text as HTML", async () => {
    const markdown = Markdown.create()
    const {view} = await display(markdown, null)
    for (const formula of ["f'(x)", "x < y", '\\text{"hello"}', "\\begin{matrix}a & b\\end{matrix}"]) {
      markdown.text = `&lt;img src=x onerror=alert(1)&gt; $$${formula}$$ &amp; text`
      const svg = view.contents.querySelector<SVGSVGElement>("svg")
      expect_not_null(svg)
      expect(view.contents.querySelector("[data-mjx-error]")).to.be.null
      expect(svg.getBBox().width).to.be.above(0)
      expect(view.contents.querySelector("img")).to.be.null
      expect(view.contents.textContent.startsWith("<img src=x onerror=alert(1)> ")).to.be.true
      expect(view.contents.textContent.endsWith(" & text\n")).to.be.true
    }
  })

  it("should reserve footnote and HTML targets when generating heading IDs", async () => {
    const markdown = Markdown.create({text: '# Footnote note\n\n# Custom\n\nA note[^note].\n\n<h2 id="custom">Heading</h2>\n\n[^note]: Details.'})
    const {view} = await display(markdown, null)
    const ids = [...view.contents.querySelectorAll("[id]")].map((el) => el.id)
    expect(new Set(ids).size).to.be.equal(ids.length)
    expect(view.contents.querySelector("h1")?.id).to.be.equal("footnote-note-1")
    expect_not_null(view.contents.querySelector("li#footnote-note"))
    expect_not_null(view.contents.querySelector("h1#custom-1"))
    expect(view.contents.querySelector("h2#custom")?.textContent).to.be.equal("Heading #")
  })

  it("should preserve explicit HTML heading IDs and their links", async () => {
    const markdown = Markdown.create({text: '[Jump](#custom)\n\n<h2 id="custom">Heading</h2>'})
    const {view} = await display(markdown, null)
    const heading = view.shadow_el.getElementById("custom")
    expect_not_null(heading)
    expect(heading.querySelector(".heading-anchor")?.getAttribute("href")).to.be.equal("#custom")
    using spy = restorable(sinon.spy(Element.prototype, "scrollIntoView"))
    view.contents.querySelector<HTMLAnchorElement>("p a")!.click()
    expect(spy.thisValues.at(-1)).to.be.equal(heading)
  })

  it("should keep fragment clicks in their originating Markdown widget", async () => {
    window.history.replaceState(null, "", window.location.pathname + window.location.search)
    const text = "[Jump](#shared)\n\n# Shared"
    const first = Markdown.create({text})
    const second = Markdown.create({text})
    const {view} = await display(Column.create({children: [first, second]}), null)
    const first_view = view.owner.get_one(first)
    const second_view = view.owner.get_one(second)
    using spy = restorable(sinon.spy(Element.prototype, "scrollIntoView"))
    const changed = new Promise<void>((resolve) => window.addEventListener("hashchange", () => resolve(), {once: true}))
    first_view.contents.querySelector<HTMLAnchorElement>("p a")!.click()
    await changed
    expect(spy.callCount).to.be.equal(1)
    expect(spy.thisValues.at(-1)).to.be.equal(first_view.shadow_el.getElementById("shared"))
    second_view.contents.querySelector<HTMLAnchorElement>("p a")!.click()
    expect(spy.thisValues.at(-1)).to.be.equal(second_view.shadow_el.getElementById("shared"))
  })

  it("should resolve unscoped duplicate fragments once in document order", async () => {
    window.history.replaceState(null, "", "#shared")
    const first = Markdown.create({text: "# Shared"})
    const second = Markdown.create({text: "# Shared"})
    using spy = restorable(sinon.spy(Element.prototype, "scrollIntoView"))
    const {view} = await display(Column.create({children: [first, second]}), null)
    const target = view.owner.get_one(first).shadow_el.getElementById("shared")
    expect(spy.callCount).to.be.equal(1)
    expect(spy.thisValues.at(-1)).to.be.equal(target)
    spy.resetHistory()
    window.dispatchEvent(new HashChangeEvent("hashchange"))
    expect(spy.callCount).to.be.equal(1)
    expect(spy.thisValues.at(-1)).to.be.equal(target)
  })

  it("should generate unique heading IDs and permalinks and reset them on updates", async () => {
    const text = "# Hello, *World*!\n\n## Hello, World!\n\n## Café\n\n## Images"
    const markdown = Markdown.create({text})
    const {view} = await display(markdown, null)
    const ids = () => [...view.contents.querySelectorAll("h1, h2")].map((el) => el.id)
    expect(ids()).to.be.equal(["hello-world", "hello-world-1", "café", "images"])
    const anchor = view.contents.querySelector<HTMLAnchorElement>("#hello-world .heading-anchor")
    expect_not_null(anchor)
    expect(anchor.getAttribute("href")).to.be.equal("#hello-world")
    expect(anchor.getAttribute("aria-label")).to.be.equal("Link to Hello, World!")
    markdown.text = "# Other"
    markdown.text = text
    expect(ids()).to.be.equal(["hello-world", "hello-world-1", "café", "images"])
  })

  it("should render repeated footnote references with distinct backlinks and reset on updates", async () => {
    const text = "First[^note], again[^note].\n\n[^note]: A **bold** note."
    const markdown = Markdown.create({text})
    const {view} = await display(markdown, null)
    expect(view.contents.querySelectorAll("[data-footnote-ref]").length).to.be.equal(2)
    expect(view.contents.querySelectorAll("[data-footnote-backref]").length).to.be.equal(2)
    expect(view.contents.querySelector(".footnotes strong")?.textContent).to.be.equal("bold")
    const ids = [...view.contents.querySelectorAll("[id]")].map((el) => el.id)
    expect(new Set(ids).size).to.be.equal(ids.length)
    markdown.text = "No notes"
    expect(view.contents.querySelector(".footnotes")).to.be.null
    markdown.text = text
    expect(view.contents.querySelectorAll(".footnotes li").length).to.be.equal(1)
    expect(view.contents.querySelector("[data-footnote-ref]")?.textContent).to.be.equal("1")
  })

  it("should follow heading and footnote links within the same shadow root", async () => {
    const markdown = Markdown.create({text: "[Jump](#café)\n\n## Café\n\nA note[^a b].\n\n[^a b]: Details."})
    const {view} = await display(markdown, null)
    using spy = restorable(sinon.spy(Element.prototype, "scrollIntoView"))
    for (const selector of ["p a", "[data-footnote-ref]", "[data-footnote-backref]"]) {
      const anchor = view.contents.querySelector<HTMLAnchorElement>(selector)
      expect_not_null(anchor)
      const id = decodeURIComponent(anchor.hash.slice(1))
      const target = view.shadow_el.getElementById(id) ?? view.shadow_el.getElementById(anchor.hash.slice(1))
      expect_not_null(target)
      anchor.click()
      expect(spy.thisValues.at(-1)).to.be.equal(target)
      expect(decodeURIComponent(window.location.hash.slice(1))).to.be.equal(id)
    }
  })

  it("should scroll to initial fragments and respond to hash navigation", async () => {
    window.history.replaceState(null, "", "#second")
    using spy = restorable(sinon.spy(Element.prototype, "scrollIntoView"))
    const markdown = Markdown.create({text: "# First\n\n# Second"})
    const {view} = await display(markdown, null)
    expect(spy.thisValues.at(-1)).to.be.equal(view.shadow_el.getElementById("second"))
    window.history.replaceState(null, "", "#first")
    window.dispatchEvent(new HashChangeEvent("hashchange"))
    expect(spy.thisValues.at(-1)).to.be.equal(view.shadow_el.getElementById("first"))
  })

  it("should highlight fenced code and apply its stylesheet in the shadow root", async () => {
    const markdown = Markdown.create({text: "```python\ndef square(x):\n    return x**2\n```"})
    const {view} = await display(markdown, null)
    const keyword = view.contents.querySelector<HTMLElement>("pre code.hljs .hljs-keyword")
    expect_not_null(keyword)
    expect(keyword.textContent).to.be.equal("def")
    const code = view.contents.querySelector<HTMLElement>("pre code")!
    expect(getComputedStyle(keyword).color).to.not.be.equal(getComputedStyle(code).color)
  })

  it("should highlight updated text and recognize language aliases", async () => {
    const markdown = Markdown.create({text: "plain text"})
    const {view} = await display(markdown, null)
    markdown.text = "```js\nconst answer = 42\n```"
    expect(view.contents.querySelector(".hljs-keyword")?.textContent).to.be.equal("const")
    markdown.text = "plain text again"
    expect(view.contents.querySelector(".hljs")).to.be.null
    expect(view.contents.textContent).to.be.equal("plain text again\n")
  })

  it("should preserve blocks with unknown or absent languages and inline code", async () => {
    for (const language of ["", "unknown-language", "text"]) {
      const markdown = Markdown.create({text: `\`\`\`${language}\nconst answer = 42\n\`\`\`\n\n\`const answer = 42\``})
      const {view} = await display(markdown, null)
      expect(view.contents.querySelector("pre code")?.textContent).to.be.equal("const answer = 42\n")
      expect(view.contents.querySelector("p code")?.textContent).to.be.equal("const answer = 42")
      expect(view.contents.querySelector(".hljs-keyword")).to.be.null
    }
  })

  it("should preserve HTML as literal code and sanitize prose", async () => {
    const source = '<img src="x" onerror="alert(1)">'
    const markdown = Markdown.create({text: `\`\`\`html\n${source}\n\`\`\`\n\n${source}`})
    const {view} = await display(markdown, null)
    expect(view.contents.querySelector("pre code")?.textContent).to.be.equal(`${source}\n`)
    expect(view.contents.querySelector("pre img")).to.be.null
    expect(view.contents.querySelector("[onerror]")).to.be.null
  })

  it("should render math in prose while preserving TeX inside code", async () => {
    const markdown = Markdown.create({
      text: 'Math: $$x^2$$\n\n\\\\[x^2\\\\]\n\n```python\nformula = "$$x^2$$"\n```\n\n`$$x^2$$`',
    })
    const {view} = await display(markdown, null)
    const svg = view.contents.querySelector<SVGSVGElement>("p svg")
    expect_not_null(svg)
    expect_not_null(svg.querySelector("use"))
    expect(svg.getBBox().width).to.be.above(0)
    expect(view.contents.querySelectorAll("p svg").length).to.be.equal(2)
    expect(view.contents.querySelector("pre code")?.textContent).to.be.equal('formula = "$$x^2$$"\n')
    expect(view.contents.querySelector("p code")?.textContent).to.be.equal("$$x^2$$")
    expect(view.contents.querySelector("code svg")).to.be.null

    markdown.disable_math = true
    expect(view.contents.querySelector("svg")).to.be.null
    expect_not_null(view.contents.querySelector(".hljs-string"))
  })

  it("should recognize math delimiters after Markdown unescapes them", async () => {
    const markdown = Markdown.create({text: "Inline: \\\\(x^2\\\\)\n\n\\\\[x^2\\\\]"})
    const {view} = await display(markdown, null)
    expect(view.contents.querySelectorAll("svg").length).to.be.equal(2)
  })
})
