import {expect} from "#framework/assertions"

import {ImageLoader} from "@bokehjs/core/util/image"

describe("core/util/image module", () => {
  it("doesn't apply a cross-origin policy to data images", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>`
    const loader = new ImageLoader(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)

    expect(loader.image.crossOrigin).to.be.null
    await loader.promise
  })

  it("doesn't apply a cross-origin policy to document Blob images", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>`
    const url = URL.createObjectURL(new Blob([svg], {type: "image/svg+xml;charset=utf-8"}))
    try {
      const loader = new ImageLoader(url)
      expect(loader.image.crossOrigin).to.be.null
      await loader.promise
    } finally {
      URL.revokeObjectURL(url)
    }
  })

  it("retains anonymous CORS mode for ordinary image URLs", async () => {
    const loader = new ImageLoader("/assets/images/pattern_small.png")

    expect(loader.image.crossOrigin).to.be.equal("anonymous")
    await loader.promise
  })
})
