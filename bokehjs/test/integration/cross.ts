import {expect, expect_instanceof} from "#framework/assertions"
import {display} from "#framework/layouts"
import {actions, xy} from "#framework/interactive"

import json5 from "json5"

import {version} from "@bokehjs/version"
import type {DocJson} from "@bokehjs/document"
import type {ColumnarDataSource} from "@bokehjs/models"
import {Document} from "@bokehjs/document"
import {GlyphRenderer} from "@bokehjs/models"
import {PlotView} from "@bokehjs/models/plots/plot"
import {GridPlotView} from "@bokehjs/models/plots/grid_plot"
import {DataTableView} from "@bokehjs/models/widgets/tables/data_table"

async function test(name: string) {
  const response = await fetch(`/cases/${name}`)
  const text = await response.text()
  const doc_json = json5.parse<DocJson>(text)
  doc_json.version = version // can't include version field in test cases; prevent spurious warnings
  const doc = Document.from_json(doc_json)
  return await display(doc, null)
}

describe("Bug", () => {
  describe("in issue #11694", () => {
    it.no_baseline("doesn't allow 'id' key in mappings and confuses them with refs", async () => {
      await test("regressions/issue_11694.json5")
    })
  })

  describe("in issue #11930", () => {
    it("doesn't allow overriding int major axis labels with floats", async () => {
      await test("regressions/issue_11930.json5")
    })
  })

  describe("in issue #13134", () => {
    it.no_baseline("doesn't allow using ndarrays in IndexFilter.indices", async () => {
      await test("regressions/issue_13134.json5")
    })
  })

  describe("in issue #13660", () => {
    it.no_baseline("doesn't allow using ndarrays in BooleanFilter.booleans", async () => {
      await test("regressions/issue_13660.json5")
    })
  })

  describe("in issue #13637", () => {
    it("doesn't allow using dict-based pseudo structs in model APIs", async () => {
      await test("regressions/issue_13637.json5")
    })

    it.no_baseline("doesn't allow deserialization of an empty dict as an empty Map", async () => {
      await test("regressions/issue_13637_empty_map.json5")
    })
  })

  describe("in issue #8766", () => {
    it("doesn't allow activation of proxied box zoom tools", async () => {
      const {views} = await test("regressions/issue_8766.json5")

      const [gp] = views
      expect_instanceof(gp, GridPlotView)
      const gb = gp.grid_box_view

      for (const pv of gb.child_views) {
        expect_instanceof(pv, PlotView)

        await actions(pv).pan(xy(0.5, 0.5), xy(1.5, 1.5))
        await pv.ready

        const [gr] = pv.model.renderers.filter((r) => r instanceof GlyphRenderer)
        expect(gr.data_source.selected.indices).to.be.equal([1])
      }
    })
  })

  describe("in issue #13964", () => {
    it.no_baseline("doesn't allow using 'constructor' key in maps or plain objects in may have refs contexts", async () => {
      await test("regressions/issue_13964.json5")
    })
  })

  describe("in issue #12187", () => {
    it("displays dates as zero epoch in a DataTable if one element isn't a date", async () => {
      const {views} = await test("regressions/issue_12187.json5")
      const [t] = views
      expect_instanceof(t, DataTableView)

      const source = t.model.source as ColumnarDataSource
      const dates = source.get_array("dates")

      expect(dates.length).to.be.equal(10)
      expect(Number.isNaN(dates[0])).to.be.true
      for (let i = 1; i < dates.length; i++) {
        const day = String(i + 1).padStart(2, "0")
        expect(dates[i]).to.be.equal(`2014-03-${day}`)
      }
    })
  })
})
