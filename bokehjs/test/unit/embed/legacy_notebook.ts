import {expect, expect_instanceof, expect_not_null} from "#framework/assertions"
import * as sinon from "sinon"

import {Document} from "@bokehjs/document"
import {embed_items_notebook, kernels} from "@bokehjs/embed/legacy_notebook"
import {CustomJS} from "@bokehjs/models/callbacks/customjs"
import {Message} from "@bokehjs/protocol/message"

type CommMessage = {buffers: DataView[], content: {data: string}}
type Comm = {on_msg(callback: (message: CommMessage) => void): void}
type Kernel = {comm_manager: {register_target(target: string, callback: (comm: Comm) => void): void}}
type Jupyter = {notebook: {kernel: Kernel}}

function notebook_output() {
  const model = CustomJS.create({code: "initial"})
  const source = new Document({roots: [model]})
  const target = document.createElement("div")
  target.id = `${model.id}-notebook`
  document.body.append(target)
  const items = [{
    roots: {[model.id]: target.id}, root_ids: [model.id], notebook_comms_target: `${model.id}-comms`,
  }]
  return {model, source, target, items, docs: {doc: source.to_json()}}
}

function patch(code: string, id: string): CommMessage {
  return {
    buffers: [],
    content: {data: JSON.stringify({
      header: Message.create_header("PATCH-DOC"),
      content: {events: [{kind: "ModelChanged", model: {id}, attr: "code", new: code}]},
      buffers: [],
    })},
  }
}

describe("legacy notebook resource loading", () => {
  it("registers classic comms before delayed assets and applies queued patches in order", async () => {
    const output = notebook_output()
    let open: ((comm: Comm) => void) | undefined
    const register_target = (target: string, callback: (comm: Comm) => void) => {
      expect(target).to.be.equal(output.items[0].notebook_comms_target)
      open = callback
    }
    const state = globalThis as typeof globalThis & {Jupyter?: Jupyter}
    const original = state.Jupyter
    state.Jupyter = {notebook: {kernel: {comm_manager: {register_target}} as Kernel}}
    const deserialize = sinon.spy(Document, "from_json")
    let finish_loading!: () => void
    const resources = new Promise<void>((resolve) => finish_loading = resolve)
    const displayed = embed_items_notebook(output.docs, output.items, () => {
      expect_not_null(open)
      return resources
    })
    try {
      expect_not_null(open)
      expect(deserialize.called).to.be.false
      let receive: ((message: CommMessage) => void) | undefined
      open({on_msg(callback) { receive = callback }} as Comm)
      expect_not_null(receive)
      receive(patch("first", output.model.id))
      receive(patch("second", output.model.id))
      finish_loading()
      await displayed
      const copied = deserialize.returnValues[0]
      expect_instanceof(copied, Document)
      const model = copied.get_model_by_id(output.model.id)
      expect_instanceof(model, CustomJS)
      expect(model.code).to.be.equal("second")
      receive(patch("after-ready", output.model.id))
      expect(model.code).to.be.equal("after-ready")
    } finally {
      finish_loading()
      await displayed
      deserialize.returnValues.forEach((doc) => doc.destroy())
      deserialize.restore()
      if (original === undefined) {
        delete state.Jupyter
      } else {
        state.Jupyter = original
      }
      output.source.destroy()
      output.target.remove()
    }
  })

  it("registers JupyterLab comms from root metadata before loading assets", async () => {
    const output = notebook_output()
    const registerCommTarget = sinon.spy()
    kernels[output.model.id] = {registerCommTarget}
    const deserialize = sinon.spy(Document, "from_json")
    try {
      await embed_items_notebook(output.docs, output.items, async () => {
        expect(registerCommTarget.calledOnce).to.be.true
        expect(deserialize.called).to.be.false
      })
      expect(registerCommTarget.firstCall.args[0]).to.be.equal(output.items[0].notebook_comms_target)
    } finally {
      delete kernels[output.model.id]
      deserialize.returnValues.forEach((doc) => doc.destroy())
      deserialize.restore()
      output.source.destroy()
      output.target.remove()
    }
  })

  it("shows escaped resource failures and ignores patches after failure", async () => {
    const output = notebook_output()
    let open: ((comm: Comm) => void) | undefined
    const state = globalThis as typeof globalThis & {Jupyter?: Jupyter}
    const original = state.Jupyter
    state.Jupyter = {notebook: {kernel: {comm_manager: {
      register_target(_target, callback) { open = callback },
    }} as Kernel}}
    const error = new Error("could not load <script>extension</script>")
    let reject_loading!: (error: Error) => void
    const resources = new Promise<void>((_resolve, reject) => reject_loading = reject)
    try {
      const displayed = embed_items_notebook(output.docs, output.items, () => {
        expect_not_null(open)
        return resources
      })
      expect_not_null(open)
      let receive: ((message: CommMessage) => void) | undefined
      open({on_msg(callback) { receive = callback }} as Comm)
      expect_not_null(receive)
      receive(patch("queued-before-failure", output.model.id))
      reject_loading(error)
      expect(await displayed.then(() => null, (failure: unknown) => failure)).to.be.identical(error)
      expect(output.target.querySelector("[role=alert]")?.textContent).to.be.equal(
        `Bokeh notebook display failed: ${error.message}`,
      )
      expect(output.target.querySelector("script")).to.be.null
      expect(() => receive!(patch("ignored", output.model.id))).to.not.throw()
    } finally {
      if (original === undefined) {
        delete state.Jupyter
      } else {
        state.Jupyter = original
      }
      output.source.destroy()
      output.target.remove()
    }
  })

  it("replays queued envelopes and binary fragments through the same comm receiver", async () => {
    const output = notebook_output()
    let open: ((comm: Comm) => void) | undefined
    const state = globalThis as typeof globalThis & {Jupyter?: Jupyter}
    const original = state.Jupyter
    state.Jupyter = {notebook: {kernel: {comm_manager: {
      register_target(_target, callback) { open = callback },
    }}}}
    const deserialize = sinon.spy(Document, "from_json")
    const apply = sinon.spy(Document.prototype, "apply_json_patch")
    let finish_loading!: () => void
    const resources = new Promise<void>((resolve) => finish_loading = resolve)
    const displayed = embed_items_notebook(output.docs, output.items, () => resources)
    try {
      expect_not_null(open)
      let receive: ((message: CommMessage) => void) | undefined
      open({on_msg(callback) { receive = callback }})
      expect_not_null(receive)
      receive({buffers: [], content: {data: JSON.stringify({
        header: Message.create_header("PATCH-DOC"), content: {events: []}, buffers: ["array"],
      })}})
      receive({buffers: [new DataView(Uint8Array.from([1, 2, 3]).buffer)], content: {data: ""}})
      expect(apply.called).to.be.false
      finish_loading()
      await displayed
      expect(apply.calledOnce).to.be.true
      const buffers = apply.firstCall.args[1]
      expect_not_null(buffers)
      const buffer = buffers.get("array")
      expect_not_null(buffer)
      expect([...new Uint8Array(buffer)]).to.be.equal([1, 2, 3])
    } finally {
      finish_loading()
      await displayed
      deserialize.returnValues.forEach((doc) => doc.destroy())
      deserialize.restore()
      apply.restore()
      if (original === undefined) {
        delete state.Jupyter
      } else {
        state.Jupyter = original
      }
      output.source.destroy()
      output.target.remove()
    }
  })
})
