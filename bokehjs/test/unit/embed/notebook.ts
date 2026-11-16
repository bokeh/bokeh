import {expect} from "#framework/assertions"

import {Document} from "@bokehjs/document"
import {create_notebook_patch_receiver, create_notebook_session, NotebookPatchError} from "@bokehjs/embed/notebook"
import type {NotebookPatch} from "@bokehjs/embed/notebook"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {Range1d} from "@bokehjs/models/ranges/range1d"

describe("notebook embed patches", () => {
  it("applies consecutive revisions and ignores stale replay", () => {
    const applied: unknown[] = []
    const document = {
      apply_json_patch(patch: unknown) { applied.push(patch) },
    } as unknown as Document
    const receive = create_notebook_patch_receiver(document, 4)
    const content = {events: []}

    receive({kind: "patch", revision: 5, content})
    receive({kind: "patch", revision: 5, content})

    expect(applied).to.be.equal([content])
  })

  it("rejects revision gaps and inconsistent binary metadata", () => {
    const document = {apply_json_patch() {}} as unknown as Document
    const receive = create_notebook_patch_receiver(document, 2)
    expect(() => receive({kind: "patch", revision: 4, content: {events: []}})).to.throw(NotebookPatchError)
    expect(() => receive({
      kind: "patch",
      revision: 3,
      content: {events: []},
      buffer_ids: ["buffer"],
    })).to.throw(NotebookPatchError)
  })

  it("maps DataView slices without retaining unrelated bytes", () => {
    let received: Map<string, ArrayBuffer> | undefined
    const document = {
      apply_json_patch(_patch: unknown, buffers: Map<string, ArrayBuffer>) { received = buffers },
    } as unknown as Document
    const receive = create_notebook_patch_receiver(document)
    const backing = new Uint8Array([9, 1, 2, 8])

    receive({
      kind: "patch",
      revision: 1,
      content: {events: []},
      buffer_ids: ["buffer"],
    }, [new DataView(backing.buffer, 1, 2)])

    expect([...new Uint8Array(received!.get("buffer")!)]).to.be.equal([1, 2])
  })

  it("doesn't advance the revision when applying a patch fails", () => {
    let attempts = 0
    const document = {
      apply_json_patch() {
        attempts++
        if (attempts == 1) {
          throw new Error("model rejected patch")
        }
      },
    } as unknown as Document
    const receive = create_notebook_patch_receiver(document)
    const patch = {kind: "patch", revision: 1, content: {events: []}}

    expect(() => receive(patch)).to.throw(Error)
    receive(patch)
    expect(attempts).to.be.equal(2)
  })
})

describe("notebook sessions", () => {
  function session_for(...roots: (Range1d | ColumnDataSource)[]) {
    const sent: [NotebookPatch, ArrayBuffer[]][] = []
    const session = create_notebook_session(new Document({roots}), 2, (patch, buffers) => sent.push([patch, buffers]))
    return {session, sent}
  }

  it("sends local changes based on the last applied kernel revision without echoing kernel patches", () => {
    const range = Range1d.create({start: 0, end: 10})
    const {session, sent} = session_for(range)

    range.start = 1
    session.receive({
      kind: "patch",
      revision: 3,
      content: {events: [{kind: "ModelChanged", model: range.ref(), attr: "end", new: 20}]},
    })
    range.start = 2

    expect(range.end).to.be.equal(20)
    expect(sent.map(([patch]) => [patch.kind, patch.revision])).to.be.equal([["patch", 2], ["patch", 3]])
    expect(sent.map(([patch]) => patch.content.events.map((event) => event.kind == "ModelChanged" ? [event.attr, event.new] : null)))
      .to.be.equal([[["start", 1]], [["start", 2]]])
    session.close()
  })

  it("sends binary data as buffers referenced by id", () => {
    const source = ColumnDataSource.create({data: {x: new Float64Array([1, 2])}})
    const {session, sent} = session_for(source)

    source.data = {x: new Float64Array([3, 4])}

    const [[patch, buffers]] = sent
    expect(patch.buffer_ids).to.be.equal(["0"])
    expect(JSON.stringify(patch.content).includes("{\"id\":\"0\"}")).to.be.true
    expect([...new Float64Array(buffers[0])]).to.be.equal([3, 4])
    session.close()
  })

  it("stops sending local changes when closed", () => {
    const range = Range1d.create({start: 0, end: 10})
    const {session, sent} = session_for(range)

    session.close()
    range.start = 1

    expect(sent).to.be.equal([])
  })
})
