import {describe, expect, it, vi} from "vitest"

import {NotebookExtension} from "../src/notebook"
import {DISPLAY_MIME_TYPE} from "../src/protocol"

class TestSignal {
  private callbacks = new Set<(...args: any[]) => void>()
  connect(callback: (...args: any[]) => void): void {this.callbacks.add(callback)}
  disconnect(callback: (...args: any[]) => void): void {this.callbacks.delete(callback)}
  emit(sender: unknown, args: unknown): void {
    for (const callback of this.callbacks) callback(sender, args)
  }
}

function output(viewId: string, trusted = true) {
  return {
    data: {[DISPLAY_MIME_TYPE]: {kind: "artifact", view_id: viewId}},
    metadata: {},
    trusted,
  }
}

function harness(initial: ReturnType<typeof output>[], extension = new NotebookExtension({} as any)) {
  const opened: any[] = []
  const outputs = {
    values: initial,
    trusted: true,
    changed: new TestSignal(),
    get length() {return this.values.length},
    get(index: number) {return this.values[index]},
  }
  const cell = {
    type: "code",
    trusted: true,
    outputs,
    stateChanged: new TestSignal(),
  }
  const cells = {
    values: [cell],
    changed: new TestSignal(),
    [Symbol.iterator]() {return this.values[Symbol.iterator]()},
  }
  const kernel = {
    createComm() {
      return {
        open(data: any) {opened.push(data)},
        close() {return {done: Promise.resolve()}},
      }
    },
  }
  const context = {
    path: "notebook.ipynb",
    model: {cells},
    sessionContext: {
      ready: Promise.resolve(),
      session: {kernel},
      kernelChanged: new TestSignal(),
    },
  }
  const rendermime = {addFactory: vi.fn(), removeMimeType: vi.fn()}
  const disposable = extension.createNew({content: {rendermime}} as any, context as any)
  return {cell, cells, context, disposable, extension, opened, outputs}
}

describe("notebook output ownership", () => {
  it("retains repeated display IDs until the last output is removed", async () => {
    const test = harness([output("shared"), output("shared")])
    test.outputs.values.pop()
    test.outputs.changed.emit(test.outputs, {})
    await Promise.resolve()
    expect(test.opened).toEqual([])

    test.outputs.values.pop()
    test.outputs.changed.emit(test.outputs, {})
    await vi.waitFor(() => expect(test.opened).toEqual([{kind: "release", view_id: "shared"}]))
    test.disposable.dispose()
  })

  it("releases replaced, deleted, and newly untrusted output owners", async () => {
    const test = harness([output("first")])
    test.outputs.values = [output("second")]
    test.outputs.changed.emit(test.outputs, {})
    await vi.waitFor(() => expect(test.opened).toContainEqual({kind: "release", view_id: "first"}))

    test.cell.trusted = false
    test.cell.stateChanged.emit(test.cell, {name: "trusted", newValue: false})
    await vi.waitFor(() => expect(test.opened).toContainEqual({kind: "release", view_id: "second"}))

    test.cell.trusted = true
    test.cell.stateChanged.emit(test.cell, {name: "trusted", newValue: true})
    test.cells.values = []
    test.cells.changed.emit(test.cells, {oldValues: [test.cell], newValues: []})
    await vi.waitFor(() => expect(test.opened.filter((item) => item.view_id === "second")).toHaveLength(2))
    test.disposable.dispose()
  })

  it("keeps a shared view alive until the last notebook panel releases it", async () => {
    const extension = new NotebookExtension({} as any)
    const first = harness([output("shared")], extension)
    const second = harness([output("shared")], extension)

    first.outputs.values = []
    first.outputs.changed.emit(first.outputs, {})
    await Promise.resolve()
    expect(first.opened).toEqual([])

    second.outputs.values = []
    second.outputs.changed.emit(second.outputs, {})
    await vi.waitFor(() => expect(second.opened).toEqual([{kind: "release", view_id: "shared"}]))
    first.disposable.dispose()
    second.disposable.dispose()
  })
})
