import {expect} from "assertions"
import {display} from "../../_util"

import {FileInput} from "@bokehjs/models/widgets"
import type {MessageSent, Patch} from "@bokehjs/document"
import {zip} from "@bokehjs/core/util/array"

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

  it("should support ClearInput server-sent event", async () => {
    const file_input = new FileInput({accept: ".csv,.json.,.txt", multiple: false})
    const {view, doc} = await display(file_input, null)

    const file = new File(["foo bar"], "foo.txt", {type: "text/plain"})
    const files = new _FileList(file)

    await view.load_files(files)
    expect(file_input.filename).to.be.equal("foo.txt")

    const msg: MessageSent = {
      kind: "MessageSent",
      msg_type: "bokeh_event",
      msg_data: {
        type: "event",
        name: "clear_input",
        values: {
          type: "map",
          entries: [
            ["model", file_input.ref()],
          ],
        },
      },
    }

    const patch: Patch = {events: [msg]}
    doc.apply_json_patch(patch)
    await view.ready

    expect(file_input.filename).to.be.equal("") // TODO should be `unset`
  })

  it("should upload a directory", async () => {
    const model = new FileInput({directory: true})
    const {view} = await display(model, null)

    const getFileList = () => {
      const dt = new DataTransfer()
      const filenames = ["foo", "bar", "baz"]
      for (const filename of filenames) {
        const file = new File([filename], `${filename}.txt`, {type: "text/plain"})
        // To set the `webkitRelativePath` property as it is a read-only
        Object.defineProperty(file, "webkitRelativePath", {value: `subdir/${filename}.txt`})
        dt.items.add(file)
      }
      return dt.files
    }

    const files = getFileList()
    await view.load_files(files)

    expect(model.value).to.be.equal([btoa("foo"), btoa("bar"), btoa("baz")])
    expect(model.filename).to.be.equal(["subdir/foo.txt", "subdir/bar.txt", "subdir/baz.txt"])
    expect(model.mime_type).to.be.equal(["text/plain", "text/plain", "text/plain"])
  })

  it("should upload a directory with accept", async () => {
    const model = new FileInput({directory: true, accept: ".txt"})
    const {view} = await display(model, null)

    const getFileList = () => {
      const dt = new DataTransfer()
      const filenames = ["foo", "bar", "baz"]
      const exts = ["txt", "csv", "json"]
      for (const [ filename, ext ] of zip(filenames, exts)) {
        const file = new File([filename], `${filename}.${ext}`, {type: "text/plain"})
        // To set the `webkitRelativePath` property as it is a read-only
        Object.defineProperty(file, "webkitRelativePath", {value: `subdir/${filename}.${ext}`})
        dt.items.add(file)
      }
      return dt.files
    }

    const files = getFileList()
    await view.load_files(files)

    expect(model.value).to.be.equal([btoa("foo")])
    expect(model.filename).to.be.equal(["subdir/foo.txt"])
    expect(model.mime_type).to.be.equal(["text/plain"])
  })
})
