import {expect} from "#framework/assertions"

import {Selection} from "@bokehjs/models/selections/selection"
import {Patch} from "@bokehjs/models/glyphs/patch"
import {Document, type Patch as DocumentPatch} from "@bokehjs/document"
import {ModelChangedEvent} from "@bokehjs/document/events"
import {Serializer} from "@bokehjs/core/serialization"
import {Message} from "@bokehjs/protocol/message"
import {CustomJS} from "@bokehjs/models/callbacks/customjs"
import {Deserializer} from "@bokehjs/core/serialization/deserializer"
import {default_resolver} from "@bokehjs/base"

const some_1d_selection = Selection.create({indices: [4, 5]})
const other_1d_selection = Selection.create({indices: [0, 1]})

const some_2d_selection = Selection.create({multiline_indices: new Map([[2, [2, 3]]])})
const other_2d_selection = Selection.create({multiline_indices: new Map([[2, [0, 1]]])})

describe("Selection", () => {

  describe("adaptive transport", () => {
    function send(value: unknown): (string | ArrayBuffer)[] {
      const frames: (string | ArrayBuffer)[] = []
      Message.create("PATCH-DOC", new Serializer({binary: true}).encode(value)).send({
        send(data: string | ArrayBuffer) { frames.push(data) },
      })
      return frames
    }

    function decode(frames: (string | ArrayBuffer)[]): unknown {
      const {content, buffers} = Message.decode(frames[0] as string)
      return new Deserializer(default_resolver).decode(content,
        new Map(buffers.map((id, i) => [id, frames[i + 1] as ArrayBuffer])))
    }

    function apply(doc: Document, event: ModelChangedEvent): void {
      const frames = send(event)
      const {content, buffers} = Message.decode(frames[0] as string)
      doc.apply_json_patch({events: [content]} as DocumentPatch,
        new Map(buffers.map((id, i) => [id, frames[i + 1] as ArrayBuffer])))
    }

    it("should send three million dense indices using a bitmap", () => {
      const indices = Array.from({length: 3_000_000}, (_, i) => i)
      const selection = Selection.create({indices})
      const frames = send(selection)
      expect(frames.length).to.be.equal(2)
      expect((frames[1] as ArrayBuffer).byteLength).to.be.equal(375_000)
      const restored = decode(frames) as Selection
      expect(restored.indices).to.be.equal(indices)
      expect(Array.isArray(selection.indices)).to.be.true
      expect(Array.isArray(restored.indices)).to.be.true
    })

    for (const attr of ["indices", "line_indices", "multiline_indices"] as const) {
      const value = (values: number[]) => attr == "multiline_indices" ? new Map([[7, values], [42, []]]) : values
      it(`should normalize ${attr} and notify only for changed sets, including received patches`, () => {
        const selection = Selection.create({[attr]: value([9, 2, 9, 1])})
        const doc = new Document()
        doc.add_root(selection)
        let changes = 0
        selection.properties[attr].change.connect(() => {
          changes++
          const actual = attr == "multiline_indices" ? selection.multiline_indices.get(7) : selection[attr]
          expect(Array.isArray(actual)).to.be.true
        })
        expect(selection[attr]).to.be.equal(value([1, 2, 9]))
        selection.setv({[attr]: value([2, 9, 1, 9])})
        expect(changes).to.be.equal(0)
        apply(doc, new ModelChangedEvent(doc, selection, attr, value([9, 1, 2])))
        expect(changes).to.be.equal(0)
        apply(doc, new ModelChangedEvent(doc, selection, attr, value(Array.from({length: 300}, (_, i) => i))))
        expect(changes).to.be.equal(1)
        expect(selection[attr]).to.be.equal(value(Array.from({length: 300}, (_, i) => i)))
        apply(doc, new ModelChangedEvent(doc, selection, attr, value([2147483647, 0])))
        expect(changes).to.be.equal(2)
        expect(selection[attr]).to.be.equal(value([0, 2147483647]))
      })

      it(`should serialize the captured ${attr} event value`, () => {
        const selection = Selection.create()
        const doc = new Document()
        doc.add_root(selection)
        const event = new ModelChangedEvent(doc, selection, attr, value([3, 1, 3]))
        selection.setv({[attr]: value([99])})
        const frames = send(event)
        const {content, buffers} = Message.decode(frames[0] as string)
        const actual = new Deserializer(default_resolver).decode((content as {new: unknown}).new,
          new Map(buffers.map((id, i) => [id, frames[i + 1] as ArrayBuffer])))
        expect(actual).to.be.equal(value([1, 3]))
      })
    }

    it("should execute CustomJS callbacks with ordinary arrays", async () => {
      const output = Selection.create()
      const callback = CustomJS.create({args: {output}, code: "output.indices = cb_obj.indices.concat([42])"})
      await callback.compile()
      const selection = Selection.create({js_property_callbacks: {"change:indices": [callback]}})
      const doc = new Document()
      doc.add_root(selection)
      apply(doc, new ModelChangedEvent(doc, selection, "indices", [3, 1, 3]))
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(output.indices).to.be.equal([1, 3, 42])
    })

    it("should mix bitmap and int32 rows in one shared buffer above ten thousand lines", () => {
      const indices = new Map(Array.from({length: 10_001}, (_, i) => [i*3,
        i%2 == 0 ? [0, 2147483647] : Array.from({length: 300}, (_, j) => j)]))
      indices.set(40_000, [])
      const selection = Selection.create({multiline_indices: indices})
      const frames = send(selection)
      expect(frames.length).to.be.equal(2)
      const restored = decode(frames) as Selection
      expect(restored.multiline_indices).to.be.equal(indices)
      expect([...restored.multiline_indices.values()].every(Array.isArray)).to.be.true
    })

    it("should retain sparse int32 indices including the maximum index", () => {
      const selection = Selection.create({indices: new Int32Array([2147483647, 1, 1])})
      const frames = send(selection)
      expect(new Int32Array(frames[1] as ArrayBuffer)).to.be.equal(new Int32Array([1, 2147483647]))
      expect((decode(frames) as Selection).indices).to.be.equal([1, 2147483647])
    })

    it("should export received multiline selections with linear text growth", () => {
      function exported(count: number): string {
        const sender = Selection.create({multiline_indices: new Map(Array.from({length: count}, (_, i) => [i, [i]]))})
        const doc = new Document()
        doc.add_root(decode(send(sender)) as Selection)
        const json = doc.to_json_string(false)
        const restored = Document.from_json_string(json).roots()[0] as Selection
        expect(restored.multiline_indices.size).to.be.equal(count)
        expect(restored.multiline_indices.get(count - 1)).to.be.equal([count - 1])
        return json
      }
      expect(exported(2000).length < exported(1000).length*2.2).to.be.true
    })

    it("should preserve input arrays and normalize defaults, typed ingestion and clear", () => {
      const input = [3, 1, 3]
      const selection = Selection.create({indices: input, line_indices: new Uint32Array([2, 1])})
      expect(input).to.be.equal([3, 1, 3])
      expect(selection.indices).to.be.equal([1, 3])
      expect(selection.line_indices).to.be.equal([1, 2])
      selection.clear()
      expect(selection.indices).to.be.equal([])
      expect(selection.line_indices).to.be.equal([])
    })

    it("should reject malformed bitmap and int32 wire values", () => {
      const cases = [
        [{mode: "int32", count: 2}, [0, 0, 0, 0]],
        [{mode: "int32", count: 2}, [1, 0, 0, 0, 1, 0, 0, 0]],
        [{mode: "int32", count: 1}, [255, 255, 255, 255]],
        [{mode: "bitmap", count: 2, span: 8, origin: 0}, [1]],
        [{mode: "bitmap", count: 8, span: 8, origin: 0}, [127]],
        [{mode: "bitmap", count: 1, span: 1, origin: 0}, [128]],
        [{mode: "bitmap", count: 1, span: 2, origin: 2147483647}, [1]],
        [{mode: "bitmap", count: 1, span: 9, origin: 0}, [1]],
      ] as const
      for (const [meta, bytes] of cases) {
        const data = new Serializer().encode(new Uint8Array(bytes).buffer)
        expect(() => new Deserializer(default_resolver).decode({type: "selection_indices_v1", ...meta, data})).to.throw()
      }
    })

    it("should recheck interior values of dense arrays after ordinary mutations", () => {
      const selection = Selection.create({indices: [0, 1, 2, 3]})
      selection.indices[1] = 99
      expect((decode(send(selection)) as Selection).indices).to.be.equal([0, 2, 3, 99])
      selection.indices[1] = -1
      expect(() => send(selection)).to.throw()
      expect(() => Selection.create({indices: [0, 1, 2, "3"] as unknown as number[]})).to.throw()
      for (const value of [NaN, Infinity, 1.5, 2147483648]) {
        expect(() => Selection.create({indices: [0, value, 2, 3]})).to.throw()
      }
    })

    it("should reject invalid index values and multiline keys", () => {
      for (const invalid of [-1, 2147483648, 1.5, NaN, Infinity]) {
        expect(() => Selection.create({indices: [invalid]})).to.throw()
        expect(() => Selection.create({multiline_indices: new Map([[invalid, [1]]])})).to.throw()
      }
    })

    for (const compact of [false, true]) {
      it(`should round trip text serialization with compact=${compact}`, () => {
        const selection = Selection.create({indices: [3, 1, 3]})
        const rep = new Serializer({compact}).encode(selection)
        const restored = new Deserializer(default_resolver).decode(JSON.parse(JSON.stringify(rep))) as Selection
        expect(restored.indices).to.be.equal([1, 3])
        expect(Array.isArray(restored.indices)).to.be.true
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
    expect(s.indices).to.be.equal([0, 1, 4, 5])
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
