import {display} from "./_util"

import json5 from "json5"

import {Document, DocJson} from "@bokehjs/document"

async function test(name: string) {
  const response = await fetch(`/cases/${name}`)
  const text = await response.text()
  const doc_json = json5.parse<DocJson>(text)
  const doc = Document.from_json(doc_json)
  const result = await display(doc)
  return {doc, ...result}
}

describe("Bug", () => {
  describe("in issue #11694", () => {
    it("doesn't allow 'id' key in mappings and confuses them with refs", async () => {
      await test("regressions/issue_11694.json5")
    })
  })

  describe("in issue #11930", () => {
    it("doesn't allow overriding int major axis labels with floats", async () => {
      await test("regressions/issue_11930.json5")
    })
  })

  describe("in issue #13134", () => {
    it("doesn't allow using ndarrays in IndexFilter.indices", async () => {
      await test("regressions/issue_13134.json5")
    })
  })
})
