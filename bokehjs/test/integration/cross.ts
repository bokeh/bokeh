import {display} from "./_util"

import json5 from "json5"

import type {DocJson} from "@bokehjs/document"
import {Document} from "@bokehjs/document"

async function test(name: string) {
  const response = await fetch(`/cases/${name}`)
  const text = await response.text()
  const doc_json = json5.parse<DocJson>(text)
  const doc = Document.from_json(doc_json)
  return await display(doc)
}

describe("Bug", () => {
  describe("in issue #11694", () => {
    it.no_image("doesn't allow 'id' key in mappings and confuses them with refs", async () => {
      await test("regressions/issue_11694.json5")
    })
  })

  describe("in issue #11930", () => {
    it("doesn't allow overriding int major axis labels with floats", async () => {
      await test("regressions/issue_11930.json5")
    })
  })

  describe("in issue #13134", () => {
    it.no_image("doesn't allow using ndarrays in IndexFilter.indices", async () => {
      await test("regressions/issue_13134.json5")
    })
  })

  describe("in issue #13660", () => {
    it.no_image("doesn't allow using ndarrays in BooleanFilter.booleans", async () => {
      await test("regressions/issue_13660.json5")
    })
  })
})
