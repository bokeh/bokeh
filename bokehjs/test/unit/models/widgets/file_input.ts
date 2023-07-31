import {expect} from "assertions"
import {display} from "../../_util"

import {FileInput} from "@bokehjs/models/widgets"

// FileList doesn't have a constructor (https://www.w3.org/TR/FileAPI/#filelist-section)
class _FileList extends Array<File> implements FileList {
  item(i: number): File {
    return this[i]
  }
}

describe("FileInputView", () => {
  it("should allow reading files from a FileList", async () => {
    const model = new FileInput({accept: ".csv,.json.,.txt", multiple: false})
    const {view} = await display(model, null)

    const file = new File(["foo bar"], "foo.txt", {type: "text/plain"})
    const files = new _FileList(file)

    await view.load_files(files)

    expect(model.value).to.be.equal(btoa("foo bar"))
    expect(model.filename).to.be.equal("foo.txt")
    expect(model.mime_type).to.be.equal("text/plain")
  })

  it("should allow reading empty files from a FileList", async (ctx) => {
    const model = new FileInput({accept: ".csv,.json.,.txt", multiple: false})
    const {view} = await display(model, null)

    const file = new File([], "foo.txt", {type: "text/plain"})
    const files = new _FileList(file)

    await view.load_files(files)

    expect(model.value).to.be.equal("")
    expect(model.filename).to.be.equal("foo.txt")
    if (ctx.chromium_version >= 115) {
      expect(model.mime_type).to.be.equal("text/plain")
    } else {
      expect(model.mime_type).to.be.equal("") // bug in chromium
    }
  })

  it("should allow reading multiple files from a FileList", async () => {
    const model = new FileInput({accept: ".csv,.json.,.txt", multiple: true})
    const {view} = await display(model, null)

    const getFileList = () => {
      const dt = new DataTransfer()
      dt.items.add(new File(["foo"], "foo.txt", {type: "text/plain"}))
      dt.items.add(new File(["bar"], "bar.txt", {type: "text/plain"}))
      dt.items.add(new File(["baz"], "baz.txt", {type: "text/plain"}))
      return dt.files
    }

    const files = getFileList()

    await view.load_files(files)

    expect(model.value).to.be.equal([btoa("foo"), btoa("bar"), btoa("baz")])
    expect(model.filename).to.be.equal(["foo.txt", "bar.txt", "baz.txt"])
    expect(model.mime_type).to.be.equal(["text/plain", "text/plain", "text/plain"])
  })
})
