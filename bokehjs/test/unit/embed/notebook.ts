import {expect} from "#framework/assertions"

import type {Document} from "@bokehjs/document"
import {create_notebook_patch_receiver, NotebookPatchError} from "@bokehjs/embed/notebook"

describe("notebook artifact patches", () => {
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
