import {expect} from "chai"

import {OpenURL} from "@bokehjs/models/callbacks/open_url"

describe("OpenURL", () => {
  describe("default creation", () => {
    const r = new OpenURL()

    it("should have default url", () => {
      expect(r.url).to.be.deep.equal("http://")
    })
  })
})
