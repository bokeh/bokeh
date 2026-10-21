import {expect} from "#framework/assertions"

import {Selection} from "@bokehjs/models/selections/selection"
import {Patch} from "@bokehjs/models/glyphs/patch"
import {Document, type Patch as DocumentPatch} from "@bokehjs/document"
import {ModelChangedEvent} from "@bokehjs/document/events"
import {Serializer} from "@bokehjs/core/serialization"
import {Message} from "@bokehjs/protocol/message"
import {BYTE_ORDER} from "@bokehjs/core/util/platform"
import {Deserializer} from "@bokehjs/core/serialization/deserializer"
import {default_resolver} from "@bokehjs/base"

const some_1d_selection = Selection.create({indices: [4, 5]})
const other_1d_selection = Selection.create({indices: [0, 1]})

const some_2d_selection = Selection.create({multiline_indices: new Map([[2, [2, 3]]])})
const other_2d_selection = Selection.create({multiline_indices: new Map([[2, [0, 1]]])})

describe("Selection", () => {

  describe("binary indices", () => {
    function send(value: unknown): (string | ArrayBuffer)[] {
      const sent: (string | ArrayBuffer)[] = []
      Message.create("PATCH-DOC", new Serializer({binary: true}).encode(value)).send({
        send(data: string | ArrayBuffer) { sent.push(data) },
      })
      return sent
    }

    function decode(sent: (string | ArrayBuffer)[]): unknown {
      const {content, buffers} = Message.decode(sent[0] as string)
      return new Deserializer(default_resolver).decode(content,
        new Map(buffers.map((id, i) => [id, sent[i + 1] as ArrayBuffer])))
    }

    it("should send three million selected indices below the default websocket limit", () => {
      const indices = Array.from({length: 3_000_000}, (_, i) => i)
      const selection = Selection.create({indices})
      const doc = new Document()
      doc.add_root(selection)
      const event = new ModelChangedEvent(doc, selection, "indices", indices)
      const sent = send(event)

      expect(sent.length).to.be.equal(2)
      expect((sent[0] as string).length < 1024).to.be.true
      expect((sent[1] as ArrayBuffer).byteLength).to.be.equal(12_000_000)
      const packed = new Int32Array(sent[1] as ArrayBuffer)
      expect(packed[0]).to.be.equal(0)
      expect(packed[packed.length - 1]).to.be.equal(2_999_999)
      expect(selection.indices === indices).to.be.true
    })

    for (const attr of ["indices", "line_indices"] as const) {
      it(`should pack ${attr} in full model serialization and patches`, () => {
        const selection = Selection.create({[attr]: [1, 4, 9]})
        const [envelope, buffer] = send(selection)
        const rep = JSON.parse(envelope as string).content.attributes[attr]
        expect(rep).to.be.equal({
          type: "typed_array", dtype: "int32", order: BYTE_ORDER,
          array: {type: "bytes", data: {id: "0"}},
        })
        expect(new Int32Array(buffer as ArrayBuffer)).to.be.equal(new Int32Array([1, 4, 9]))

        const doc = new Document()
        doc.add_root(selection)
        const event = new ModelChangedEvent(doc, selection, attr, [2, 5])
        selection[attr] = [7]
        const [, patch_buffer] = send(event)
        expect(new Int32Array(patch_buffer as ArrayBuffer)).to.be.equal(new Int32Array([2, 5]))
      })
    }

    it("should pack multiline point indices without changing the map", () => {
      const indices = new Map([[2, [0, 3]], [5, [1, 4]]])
      const selection = Selection.create({multiline_indices: indices})
      const sent = send(selection)
      expect(sent.length).to.be.equal(2)
      expect(new Int32Array(sent[1] as ArrayBuffer)).to.be.equal(new Int32Array([0, 3, 1, 4]))
      const decoded = decode(sent) as Selection
      expect(Array.from(decoded.multiline_indices.get(2)!)).to.be.equal([0, 3])
      expect(Array.from(decoded.multiline_indices.get(5)!)).to.be.equal([1, 4])
      expect(selection.multiline_indices === indices).to.be.true

      const doc = new Document()
      doc.add_root(selection)
      const event = new ModelChangedEvent(doc, selection, "multiline_indices", indices)
      const patch = send(event)
      expect(patch.length).to.be.equal(2)
      expect(new Int32Array(patch[1] as ArrayBuffer)).to.be.equal(new Int32Array([0, 3, 1, 4]))
    })

    it("should send more than ten thousand multiline selections in one shared buffer", () => {
      const indices = new Map(Array.from({length: 10_001}, (_, i) => [i, [i, i + 1]]))
      const selection = Selection.create({multiline_indices: indices})
      const sent = send(selection)
      expect(sent.length).to.be.equal(2)
      expect((sent[1] as ArrayBuffer).byteLength).to.be.equal(10_001*2*4)
      expect(selection.multiline_indices === indices).to.be.true
      const decoded = decode(sent) as Selection
      expect(decoded.multiline_indices.size).to.be.equal(indices.size)
      for (const [key, values] of decoded.multiline_indices) {
        expect(Array.from(values)).to.be.equal([key, key + 1])
        expect((values as Int32Array).buffer === sent[1]).to.be.true
      }
    })

    it("should export received shared multiline views without repeating the full buffer", () => {
      const count = 2000
      const original = Selection.create({multiline_indices: new Map(Array.from({length: count}, (_, i) => [i, [i]]))})
      const received = decode(send(original)) as Selection
      const doc = new Document()
      doc.add_root(received)
      const json = doc.to_json_string(false)
      expect(json.length < count*512).to.be.true
      const restored = Document.from_json_string(json).roots()[0] as Selection
      expect(restored.multiline_indices.size).to.be.equal(count)
      for (const [key, values] of restored.multiline_indices) {
        expect(Array.from(values)).to.be.equal([key])
      }
    })

    it("should preserve sender arrays while exposing typed sequences to receiving clients", () => {
      const indices = [1, 2]
      const line_indices = [3, 4]
      const points = [0, 1]
      const sender = Selection.create({indices, line_indices, multiline_indices: new Map([[7, points]])})
      const received = decode(send(sender)) as Selection
      for (const [sent, value] of [
        [indices, received.indices], [line_indices, received.line_indices],
        [points, received.multiline_indices.get(7)!],
      ]) {
        expect(Array.isArray(sent)).to.be.true
        expect(value).to.be.instanceof(Int32Array)
        expect(Array.from(value)).to.be.equal(Array.from(sent))
        expect(JSON.stringify(Array.from(value))).to.be.equal(JSON.stringify(sent))
      }
      expect(sender.indices === indices).to.be.true
      expect(sender.line_indices === line_indices).to.be.true
      expect(sender.multiline_indices.get(7) === points).to.be.true
    })

    it("should notify once when an equal-valued received patch changes the sequence type", () => {
      const selection = Selection.create({indices: [1, 2]})
      const doc = new Document()
      doc.add_root(selection)
      let changes = 0
      selection.properties.indices.change.connect(() => changes++)
      const event = new ModelChangedEvent(doc, selection, "indices", [1, 2])
      const sent = send(event)
      const {content, buffers} = Message.decode(sent[0] as string)
      const data = new Map(buffers.map((id, i) => [id, sent[i + 1] as ArrayBuffer]))
      const patch = {events: [content]} as DocumentPatch
      doc.apply_json_patch(patch, data)
      expect(selection.indices).to.be.instanceof(Int32Array)
      expect(Array.from(selection.indices)).to.be.equal([1, 2])
      expect(changes).to.be.equal(1)
      doc.apply_json_patch(patch, data)
      expect(changes).to.be.equal(1)
    })

    it("should preserve sparse keys, empty lines, slices, and unequal line lengths", () => {
      const slice = new Int32Array([99, 7, 8, 99]).subarray(1, 3)
      const indices = new Map<number, number[] | Int32Array>([[42, []], [7, slice], [100, [3]], [2, []]])
      const selection = Selection.create({multiline_indices: indices})
      const sent = send(selection)
      expect(sent.length).to.be.equal(2)
      expect(new Int32Array(sent[1] as ArrayBuffer)).to.be.equal(new Int32Array([7, 8, 3]))
      const decoded = decode(sent) as Selection
      expect([...decoded.multiline_indices.keys()]).to.be.equal([42, 7, 100, 2])
      expect([...decoded.multiline_indices.values()].map((value) => Array.from(value))).to.be.equal([[], [7, 8], [3], []])
      expect(selection.multiline_indices === indices).to.be.true
      expect(slice).to.be.equal(new Int32Array([7, 8]))
    })

    it("should retain multiline event snapshots after the property is replaced", () => {
      const selection = Selection.create()
      const doc = new Document()
      doc.add_root(selection)
      const event = new ModelChangedEvent(doc, selection, "multiline_indices", new Map([[1, [3]], [8, [4, 5]]]))
      selection.multiline_indices = new Map([[2, [9]]])
      const sent = send(event)
      const content = JSON.parse(sent[0] as string).content
      const values = new Deserializer(default_resolver).decode(content.new, new Map([["0", sent[1] as ArrayBuffer]])) as Map<number, Int32Array>
      expect([...values.keys()]).to.be.equal([1, 8])
      expect([...values.values()].map((value) => Array.from(value))).to.be.equal([[3], [4, 5]])
    })

    it("should preserve multiline values that cannot be packed as int32", () => {
      for (const value of [2147483648, -2147483649, 2.5]) {
        const selection = Selection.create({multiline_indices: new Map([[1, [value]], [2, [3]]])})
        const sent = send(selection)
        expect(sent.length).to.be.equal(1)
        const decoded = decode(sent) as Selection
        expect(decoded.multiline_indices).to.be.equal(new Map([[1, [value]], [2, [3]]]))
      }
    })

    it("should keep an empty selection in the envelope without a binary frame", () => {
      const selection = Selection.create({indices: []})
      const doc = new Document()
      doc.add_root(selection)
      const sent = send(new ModelChangedEvent(doc, selection, "indices", []))
      expect(sent.length).to.be.equal(1)
      expect(JSON.parse(sent[0] as string).content.new).to.be.equal([])
    })

    it("should serialize only the visible elements of a typed-array view", () => {
      const indices = new Int32Array([99, 1, 2, 99]).subarray(1, 3)
      const selection = Selection.create({indices})
      const [, buffer] = send(selection)
      expect(new Int32Array(buffer as ArrayBuffer)).to.be.equal(new Int32Array([1, 2]))
    })

    it("should preserve integers outside int32 without truncation", () => {
      const indices = [-2147483649, 2147483648, Number.MAX_SAFE_INTEGER]
      const selection = Selection.create({indices})
      const sent = send(selection)
      expect(sent.length).to.be.equal(1)
      expect(JSON.parse(sent[0] as string).content.attributes.indices).to.be.equal(indices)
    })

    it("should not silently convert fractional indices to integers", () => {
      const selection = Selection.create({indices: [1, 2.5]})
      const sent = send(selection)
      expect(sent.length).to.be.equal(1)
      expect(JSON.parse(sent[0] as string).content.attributes.indices).to.be.equal([1, 2.5])
    })

    for (const compact of [false, true]) {
      it(`should round trip inline serialization with compact=${compact}`, () => {
        const selection = Selection.create({indices: [1, 2]})
        const rep = new Serializer({compact}).encode(selection)
        const decoded = new Deserializer(default_resolver).decode(JSON.parse(JSON.stringify(rep))) as Selection
        expect(decoded.indices).to.be.equal([1, 2])
      })
    }
  })

  it("should be updatable", () => {
    const s = Selection.create()
    s.update(some_1d_selection, true, "replace")
    expect(s.indices).to.be.equal([4, 5])
  })

  it("should be updatable with 'replace' mode", () => {
    const s = Selection.create()
    s.update(some_1d_selection, true, "replace")
    s.update(other_1d_selection, true, "replace")
    expect(s.indices).to.be.equal([0, 1])
  })

  it("should be updatable with 'append' mode", () => {
    const s = Selection.create()
    s.update(some_1d_selection, true, "append")
    s.update(other_1d_selection, true, "append")
    expect(s.indices).to.be.equal([4, 5, 0, 1])
  })

  it("should update 2d selections with 'replace' mode", () => {
    const s = Selection.create()
    s.update(some_2d_selection, true, "replace")
    s.update(other_2d_selection, true, "replace")
    expect(s.multiline_indices).to.be.equal(new Map([[2, [0, 1]]]))
  })

  it("should merge 2d selections with 'append' mode", () => {
    const s = Selection.create()
    s.update(some_2d_selection, true, "append")
    s.update(other_2d_selection, true, "append")
    expect(s.multiline_indices).to.be.equal(new Map([[2, [0, 1, 2, 3]]]))
  })

  it("should be clearable", () => {
    const s = Selection.create()
    s.update(some_1d_selection, true, "replace")
    s.clear()
    expect(s.indices).to.be.equal([])
  })

  it("should be invertible", () => {
    const s = Selection.create()
    s.update(some_1d_selection, true, "replace")
    s.invert(10)
    expect(s.indices).to.be.equal([0, 1, 2, 3, 6, 7, 8, 9])
  })

  describe("is_empty", () => {
    it("should return true for newly created selection", () => {
      const s = Selection.create()
      expect(s.is_empty()).to.be.true
    })

    it("should return false when indices are set", () => {
      const s = Selection.create({indices: [1, 2]})
      expect(s.is_empty()).to.be.false
    })

    it("should return false when line_indices are set", () => {
      const s = Selection.create({line_indices: [0, 1]})
      expect(s.is_empty()).to.be.false
    })

    it("should return false when image_indices are set", () => {
      const s = Selection.create({image_indices: [{index: 0, i: 1, j: 2, flat_index: 10}]})
      expect(s.is_empty()).to.be.false
    })

    it("should return false when selected_glyphs are set", () => {
      const s = Selection.create()
      const glyph = Patch.create()
      s.add_to_selected_glyphs(glyph)
      expect(s.is_empty()).to.be.false
    })

    it("should return true after clear", () => {
      const s = Selection.create({indices: [1, 2]})
      const glyph = Patch.create()
      s.add_to_selected_glyphs(glyph)
      s.clear()
      expect(s.is_empty()).to.be.true
    })
  })
})
