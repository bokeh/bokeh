import {expect} from "assertions"

import {FileInput} from "@bokehjs/models/widgets"
import {build_view} from "@bokehjs/core/build_views"

// FileList doesn't have a constructor (https://www.w3.org/TR/FileAPI/#filelist-section)
class _FileList extends Array<File> implements FileList {
  item(i: number): File {
    return this[i]
  }
}

describe("FileInputView", () => {
  it("should allow reading files from a FileList", async () => {
    const model = new FileInput({accept: ".csv,.json.,.txt", multiple: false})
    const view = (await build_view(model)).build()

    const file = new File(["foo bar"], "foo.txt", {type: "text/plain"})
    const files = new _FileList(file)

    await view.load_files(files)

    expect(model.value).to.be.equal(btoa("foo bar"))
    expect(model.filename).to.be.equal("foo.txt")
    expect(model.mime_type).to.be.equal("text/plain")
  })

  it("should allow reading empty files from a FileList", async () => {
    const model = new FileInput({accept: ".csv,.json.,.txt", multiple: false})
    const view = (await build_view(model)).build()

    const file = new File([], "foo.txt", {type: "text/plain"})
    const files = new _FileList(file)

    await view.load_files(files)

    expect(model.value).to.be.equal("")
    expect(model.filename).to.be.equal("foo.txt")
    expect(model.mime_type).to.be.equal("") // XXX: why not "text/plain"?
  })
})
