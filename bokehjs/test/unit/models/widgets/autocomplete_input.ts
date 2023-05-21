import {expect} from "assertions"
import {display} from "../../_util"

import {AutocompleteInput} from "@bokehjs/models/widgets"

describe("AutocompleteInput", () => {
  it("should support search_strategy='starts_with'", async () => {
    const completions = ["123", "1123", "231", "1324", "3211"]
    const obj = new AutocompleteInput({completions, search_strategy: "starts_with"})
    const {view} = await display(obj, [500, 300])

    expect(view.compute_completions("23")).to.be.equal(["231"])
    expect(view.compute_completions("32")).to.be.equal(["3211"])
  })

  it("should support search_strategy='includes'", async () => {
    const completions = ["123", "1123", "231", "1324", "3211"]
    const obj = new AutocompleteInput({completions, search_strategy: "includes"})
    const {view} = await display(obj, [500, 300])

    expect(view.compute_completions("23")).to.be.equal(["123", "1123", "231"])
    expect(view.compute_completions("32")).to.be.equal(["1324", "3211"])
  })
})
