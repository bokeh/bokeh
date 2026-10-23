import {expect} from "#framework/assertions"

import type {AnyVal} from "@bokehjs/core/serialization"
import {Serializer, SerializationError, Base64Buffer} from "@bokehjs/core/serialization"
import {Deserializer, DeserializationError} from "@bokehjs/core/serialization/deserializer"
import type {MapRep, NDArrayRep, TypedArrayRep} from "@bokehjs/core/serialization/reps"
import {default_resolver} from "@bokehjs/base"
import {ModelResolver} from "@bokehjs/core/resolvers"
import {HasProps} from "@bokehjs/core/has_props"
import type {Dict} from "@bokehjs/core/types"
import type * as p from "@bokehjs/core/properties"
import {Slice} from "@bokehjs/core/util/slice"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {BYTE_ORDER} from "@bokehjs/core/util/platform"

function to_serializable(obj: unknown): {rep: AnyVal, json: string} {
  const serializer = new Serializer()
  const rep = serializer.encode(obj) as AnyVal
  const json = JSON.stringify(rep)
  return {rep, json}
}

namespace SomeModel {
  export type Attrs = p.AttrsOf<Props>
  export type Props = HasProps.Props & {
    value: p.Property<number>
    array: p.Property<number[]>
    dict: p.Property<Dict<number>>
    map: p.Property<Map<number[], number>>
    set: p.Property<Set<number[]>>
    obj: p.Property<SomeModel | null>
  }
}

interface SomeModel extends SomeModel.Attrs {}

class SomeModel extends HasProps {
  declare properties: SomeModel.Props

  constructor(attrs?: Partial<SomeModel.Attrs>) {
    super(attrs)
  }

  static {
    this.define<SomeModel.Props>(({Float, List, Dict, Ref, Nullable}) => ({
      value: [ Float, 1 ],
      array: [ List(Float), [] ],
      dict: [ Dict(Float), {} ],
      obj: [ Nullable(Ref(SomeModel)), null ],
    }))
  }
}

describe("core/serialization module", () => {
  describe("implements serialization protocol", () => {
    it("that supports null", () => {
      expect(to_serializable(null)).to.be.equal({rep: null, json: "null"})
    })

    it("that supports booleans", () => {
      expect(to_serializable(false)).to.be.equal({rep: false, json: "false"})
      expect(to_serializable(true)).to.be.equal({rep: true, json: "true"})
    })

    it("that supports numbers", () => {
      expect(to_serializable(0)).to.be.equal({rep: 0, json: "0"})
      expect(to_serializable(1)).to.be.equal({rep: 1, json: "1"})
      expect(to_serializable(-1)).to.be.equal({rep: -1, json: "-1"})
      expect(to_serializable(NaN)).to.be.equal({rep: {type: "number", value: "nan"}, json: '{"type":"number","value":"nan"}'})
      expect(to_serializable(Infinity)).to.be.equal({rep: {type: "number", value: "+inf"}, json: '{"type":"number","value":"+inf"}'})
      expect(to_serializable(-Infinity)).to.be.equal({rep: {type: "number", value: "-inf"}, json: '{"type":"number","value":"-inf"}'})
      expect(to_serializable(Number.MAX_SAFE_INTEGER)).to.be.equal({rep: Number.MAX_SAFE_INTEGER, json: `${Number.MAX_SAFE_INTEGER}`})
      expect(to_serializable(Number.MIN_SAFE_INTEGER)).to.be.equal({rep: Number.MIN_SAFE_INTEGER, json: `${Number.MIN_SAFE_INTEGER}`})
      expect(to_serializable(Number.MAX_VALUE)).to.be.equal({rep: Number.MAX_VALUE, json: `${Number.MAX_VALUE}`})
      expect(to_serializable(Number.MIN_VALUE)).to.be.equal({rep: Number.MIN_VALUE, json: `${Number.MIN_VALUE}`})
    })

    it("that supports strings", () => {
      expect(to_serializable("")).to.be.equal({rep: "", json: '""'})
      expect(to_serializable("a")).to.be.equal({rep: "a", json: '"a"'})
      expect(to_serializable("a'b'c")).to.be.equal({rep: "a'b'c", json: '"a\'b\'c"'})
    })

    it("that supports symbols", () => {
      expect(to_serializable(Symbol("foo"))).to.be.equal({rep: {type: "symbol", name: "foo"}, json: '{"type":"symbol","name":"foo"}'})
      expect(() => to_serializable(Symbol())).to.throw(SerializationError)
    })

    it("that supports arrays", () => {
      expect(to_serializable([])).to.be.equal({rep: [], json: "[]"})
      expect(to_serializable([1, 2, 3])).to.be.equal({rep: [1, 2, 3], json: "[1,2,3]"})
    })

    it("that supports plain objects", () => {
      const val0 = {}
      expect(to_serializable(val0)).to.be.equal({
        rep: {type: "map"},
        json: '{"type":"map"}'},
      )
      /*
      expect(to_serializable(val0)).to.be.equal({rep: {}, json: "{}"})
      */
      const val1 = {key0: 0, key1: NaN}
      expect(to_serializable(val1)).to.be.equal({
        rep: {type: "map", entries: [["key0", 0], ["key1", {type: "number", value: "nan"}]]},
        json: '{"type":"map","entries":[["key0",0],["key1",{"type":"number","value":"nan"}]]}',
      })
      /*
      expect(to_serializable(val1)).to.be.equal({
        rep: {key0: 0, key1: {type: "number", value: "nan"}},
        json: '{"key0":0,"key1":{"type":"number","value":"nan"}}',
      })
      */
    })

    it("that supports basic objects", () => {
      const val0 = Object.create(null)
      expect(to_serializable(val0)).to.be.equal({
        rep: {type: "map"},
        json: '{"type":"map"}'},
      )
      const val1 = Object.create(null)
      val1.key0 = 0
      val1.key1 = NaN
      expect(to_serializable(val1)).to.be.equal({
        rep: {type: "map", entries: [["key0", 0], ["key1", {type: "number", value: "nan"}]]},
        json: '{"type":"map","entries":[["key0",0],["key1",{"type":"number","value":"nan"}]]}',
      })
    })

    it("that supports Map<K, V> instances", () => {
      const val0 = new Map<number, string>()
      expect(to_serializable(val0)).to.be.equal({
        rep: {type: "map"},
        json: '{"type":"map"}'},
      )
      const val1 = new Map([[1.1, "a"], [2.2, "b"]])
      expect(to_serializable(val1)).to.be.equal({
        rep: {type: "map", entries: [[1.1, "a"], [2.2, "b"]]},
        json: '{"type":"map","entries":[[1.1,"a"],[2.2,"b"]]}',
      })
    })

    it("that supports Set<V> instances", () => {
      const val0 = new Set<number>()
      expect(to_serializable(val0)).to.be.equal({
        rep: {type: "set"},
        json: '{"type":"set"}'},
      )
      const val1 = new Set([1.1, 2.2, 3.3])
      expect(to_serializable(val1)).to.be.equal({
        rep: {type: "set", entries: [1.1, 2.2, 3.3]},
        json: '{"type":"set","entries":[1.1,2.2,3.3]}',
      })
    })

    it("should support HasProps instances", () => {
      const obj0 = SomeModel.create()
      expect(to_serializable(obj0)).to.be.equal({
        rep: {type: "object", name: "SomeModel", id: obj0.id},
        json: `{"type":"object","name":"SomeModel","id":"${obj0.id}"}`,
      })
    })

    it("should support Slice instances", () => {
      const slice0 = new Slice({start: 10, step: 2})
      expect(to_serializable(slice0)).to.be.equal({
        rep: {type: "slice", start: 10, stop: null, step: 2},
        json: '{"type":"slice","start":10,"stop":null,"step":2}',
      })
    })

    it("that supports Date instances", () => {
      const iso = "2023-02-13T13:48:29.712Z"
      expect(to_serializable(new Date(iso))).to.be.equal({rep: {type: "date", iso}, json: `{"type":"date","iso":"${iso}"}`})
    })

    it("should support ArrayBuffer instances", () => {
      const buf0 = new Uint8Array([0, 1, 2, 3, 4, 5, 6]).buffer
      expect(to_serializable(buf0)).to.be.equal({
        rep: {
          type: "bytes",
          data: new Base64Buffer(buf0),
        },
        json: '{"type":"bytes","data":"H4sIAAAAAAAAA2NgZGJmYWUDAPkJWK0HAAAA"}',
      })
    })

    it("should support typed arrays", () => {
      const arr0 = new Int32Array([1, 2, 3])

      expect(to_serializable(arr0)).to.be.equal({
        rep: {
          type: "typed_array",
          array: {
            type: "bytes",
            data: new Base64Buffer(arr0.buffer),
          },
          order: BYTE_ORDER,
          dtype: "int32",
        },
        json: `{"type":"typed_array","array":{"type":"bytes","data":"H4sIAAAAAAAAA2NkYGBgAmJmIAYAkyLgsAwAAAA="},"order":"${BYTE_ORDER}","dtype":"int32"}`,
      })

      const arr1 = new Float64Array([1.1, 2.1, 3.1, 4.1, 5.1, 6.1])

      expect(to_serializable(arr1)).to.be.equal({
        rep: {
          type: "typed_array",
          array: {
            type: "bytes",
            data: new Base64Buffer(arr1.buffer),
          },
          order: BYTE_ORDER,
          dtype: "float64",
        },
        json: `{"type":"typed_array","array":{"type":"bytes","data":"H4sIAAAAAAAAA5s1EwQ+2p89AwIMDhCawyENDASgtAiUlnAAALssYAAwAAAA"},"order":"${BYTE_ORDER}","dtype":"float64"}`,
      })
    })

    for (const ctor of [Uint8Array, Int8Array, Uint16Array, Int16Array, Uint32Array, Int32Array, Float32Array, Float64Array]) {
      it(`should round trip ${ctor.name} views with offsets and empty tails`, () => {
        const array = new ctor([99, 10, 20, 99])
        for (const view of [array.subarray(1, 3), array.subarray(4)]) {
          const rep = new Serializer({binary: true}).encode(view) as TypedArrayRep
          expect(rep.byte_offset).to.be.equal(view.byteOffset)
          expect(rep.length).to.be.equal(view.length)
          const decoded = new Deserializer(default_resolver).decode(rep) as typeof view
          expect(Array.from(decoded)).to.be.equal(Array.from(view))
          expect(decoded.buffer === array.buffer).to.be.true
        }
      })

      it(`should inline only the visible slice of ${ctor.name} views`, () => {
        const array = new ctor([99, 10, 20, 99])
        for (const view of [array.subarray(0, 2), array.subarray(1, 3), array.subarray(4)]) {
          const rep = new Serializer().encode(view) as TypedArrayRep
          expect(rep.byte_offset).to.be.undefined
          expect(rep.length).to.be.undefined
          const decoded = new Deserializer(default_resolver).decode(JSON.parse(JSON.stringify(rep))) as typeof view
          expect(Array.from(decoded)).to.be.equal(Array.from(view))
          expect(decoded.buffer.byteLength).to.be.equal(view.byteLength)
        }
      })
    }

    it("should decode overlapping opposite-endian views without modifying their shared buffer", () => {
      const buffer = new ArrayBuffer(16)
      const data = new DataView(buffer)
      for (const [i, value] of [99, 111, 222, 99].entries()) {
        data.setInt32(i*4, value, BYTE_ORDER != "little")
      }
      const original = buffer.slice(0)
      const rep: TypedArrayRep = {
        type: "typed_array", dtype: "int32", order: BYTE_ORDER == "little" ? "big" : "little",
        array: {type: "bytes", data: new Base64Buffer(buffer)}, byte_offset: 4, length: 2,
      }
      const decoded = new Deserializer(default_resolver).decode([rep, {...rep, byte_offset: 8, length: 1}, rep]) as Int32Array[]
      expect(decoded).to.be.equal([new Int32Array([111, 222]), new Int32Array([222]), new Int32Array([111, 222])])
      expect(buffer).to.be.equal(original)
    })

    for (const fields of [
      {byte_offset: -4}, {byte_offset: 1}, {byte_offset: 20}, {byte_offset: 1.5}, {byte_offset: null},
      {byte_offset: "4"}, {byte_offset: Infinity}, {length: -1}, {length: 1.5}, {length: 5},
      {length: null}, {length: "2"}, {length: Infinity}, {byte_offset: 12, length: 2},
    ]) {
      const label = Object.entries(fields).map(([key, value]) => `${key}=${value}`).join(" ")
      it(`should reject invalid typed-array view metadata ${label}`, () => {
        const rep = {
          type: "typed_array", dtype: "int32", order: BYTE_ORDER,
          array: {type: "bytes", data: new Base64Buffer(new ArrayBuffer(16))}, ...fields,
        }
        expect(() => new Deserializer(default_resolver).decode(rep)).to.throw(DeserializationError)
      })
    }

    it("should support ndarrays", () => {
      const nd0 = ndarray([1, 2, 3], {dtype: "int32", shape: [1, 3]})

      expect(to_serializable(nd0)).to.be.equal({
        rep: {
          type: "ndarray",
          array: {
            type: "bytes",
            data: new Base64Buffer(nd0.buffer),
          },
          order: BYTE_ORDER,
          dtype: "int32",
          shape: [1, 3],
        },
        json: `{"type":"ndarray","array":{"type":"bytes","data":"H4sIAAAAAAAAA2NkYGBgAmJmIAYAkyLgsAwAAAA="},"order":"${BYTE_ORDER}","dtype":"int32","shape":[1,3]}`,
      })

      const nd1 = ndarray([1.1, 2.1, 3.1, 4.1, 5.1, 6.1], {dtype: "float64", shape: [2, 3]})

      expect(to_serializable(nd1)).to.be.equal({
        rep: {
          type: "ndarray",
          array: {
            type: "bytes",
            data: new Base64Buffer(nd1.buffer),
          },
          order: BYTE_ORDER,
          dtype: "float64",
          shape: [2, 3],
        },
        json: `{"type":"ndarray","array":{"type":"bytes","data":"H4sIAAAAAAAAA5s1EwQ+2p89AwIMDhCawyENDASgtAiUlnAAALssYAAwAAAA"},"order":"${BYTE_ORDER}","dtype":"float64","shape":[2,3]}`,
      })
    })

    it("should support circular model references", () => {
      const obj0 = SomeModel.create({value: 10})
      const obj1 = SomeModel.create({value: 20, obj: obj0})
      const obj2 = SomeModel.create({value: 30, obj: obj1})
      obj0.obj = obj2

      const serializer = new Serializer()
      const rep = serializer.encode(obj2)

      expect(rep).to.be.equal({
        type: "object",
        name: "SomeModel",
        id: obj2.id,
        attributes: {
          value: 30,
          obj: {
            type: "object",
            name: "SomeModel",
            id: obj1.id,
            attributes: {
              value: 20,
              obj: {
                type: "object",
                name: "SomeModel",
                id: obj0.id,
                attributes: {
                  value: 10,
                  obj: {id: obj2.id},
                },
              },
            },
          },
        },
      })
    })

    it("should throw on circular object references", () => {
      const val: unknown[] = [1, 2, 3]
      val.push(val)

      const serializer = new Serializer()
      expect(() => serializer.encode(val)).to.throw(SerializationError, /circular reference/)
    })
  })

  describe("implements deserialization protocol", () => {
    it("that supports Date instances", () => {
      const iso = "2023-02-13T13:48:29.712Z"

      const resolver = new ModelResolver(default_resolver)
      const deserializer = new Deserializer(resolver)

      const val = deserializer.decode({type: "date", iso})
      expect(val).to.be.equal(new Date(iso))
    })

    it("that supports maps", () => {
      const rep: MapRep = {
        type: "map",
        entries: [
          ["a", {type: "map"}],
          ["b", {type: "map", entries: []}],
          ["c", {type: "map", entries: [["a", [1, 2, 3]]]}],
          ["d", {type: "map", entries: [[0, "a"], [1, "b"]]}],
          ["e", {type: "map", entries: [[0, "a"], ["x", "b"]]}],
          ["f", {type: "map", entries: [[[1], "a"], [[1, 2], "b"]]}],
        ],
      }

      const resolver = new ModelResolver(default_resolver)
      const deserializer = new Deserializer(resolver)

      const val = deserializer.decode(rep)
      expect(val).to.be.structurally.equal({
        a: {},
        b: {},
        c: {a: [1, 2, 3]},
        d: new Map([[0, "a"], [1, "b"]]),
        e: new Map<number | string, string>([[0, "a"], ["x", "b"]]),
        f: new Map([[[1], "a"], [[1, 2], "b"]]),
      })
    })

    it("decodes __proto__ as an own data property", () => {
      const resolver = new ModelResolver(default_resolver)
      const deserializer = new Deserializer(resolver)
      const rep = JSON.parse('{"__proto__":{"safe":true}}')

      const val = deserializer.decode(rep) as {[key: string]: unknown}

      expect(Object.getPrototypeOf(val)).to.be.equal(Object.prototype)
      expect(Object.hasOwn(val, "__proto__")).to.be.true
      expect(val.__proto__).to.be.equal({safe: true})
    })

    it("that supports ndarrays", () => {
      const nd0 = ndarray([1, 2, 3], {dtype: "int32", shape: [1, 3]})

      const rep: NDArrayRep = {
        type: "ndarray",
        array: {
          type: "bytes",
          data: new Base64Buffer(nd0.buffer),
        },
        order: BYTE_ORDER,
        dtype: "int32",
        shape: [1, 3],
      }

      const resolver = new ModelResolver(default_resolver)
      const deserializer = new Deserializer(resolver)

      const val = deserializer.decode(rep)
      expect(val).to.be.equal(nd0)
    })

    it("should not allow unknown types", () => {
      const resolver = new ModelResolver(default_resolver)
      const deserializer = new Deserializer(resolver)

      const rep = {type: "unknown", attributes: {foo: 1}}
      expect(() => deserializer.decode(rep)).to.throw(DeserializationError)
    })

    it("rejects duplicate model IDs", () => {
      const resolver = new ModelResolver(null, [SomeModel])
      const deserializer = new Deserializer(resolver)

      const rep = [
        {$type: "SomeModel", $id: "duplicate", value: 1},
        {$type: "SomeModel", $id: "duplicate", value: 2},
      ]
      expect(() => deserializer.decode(rep)).to.throw(DeserializationError, "duplicate model ID 'duplicate'")
    })

    it("resolves references declared later in the payload", () => {
      const resolver = new ModelResolver(null, [SomeModel])
      for (const rep of [
        [
          {type: "object", name: "SomeModel", attributes: {obj: {id: "later"}}},
          {type: "object", name: "SomeModel", id: "later", attributes: {value: 2}},
        ],
        [
          {$type: "SomeModel", obj: {$ref: "later"}},
          {$type: "SomeModel", $id: "later", value: 2},
        ],
      ]) {
        const deserializer = new Deserializer(resolver)
        const [first, later] = deserializer.decode(rep) as SomeModel[]

        expect(first.obj).to.be.equal(later)
        expect(later.value).to.be.equal(2)
      }
    })

    it("rejects definitions hidden in ignored representation fields", () => {
      const resolver = new ModelResolver(null, [SomeModel])
      const deserializer = new Deserializer(resolver)
      const rep = [
        {
          type: "object", name: "SomeModel", attributes: {obj: {id: "hidden"}},
          extra: {type: "object", name: "SomeModel", id: "hidden", attributes: {value: 2}},
        },
      ]

      expect(() => deserializer.decode(rep)).to.throw(DeserializationError, /model definitions were not decoded/)
      expect(deserializer.references.size).to.be.equal(0)
      expect((deserializer.decode({$type: "SomeModel", value: 3}) as SomeModel).value).to.be.equal(3)
    })

    it("restores existing references when a later value fails", () => {
      const resolver = new ModelResolver(null, [SomeModel])
      const model = SomeModel.create({value: 1})
      const references = new Map([[model.id, model]])
      const deserializer = new Deserializer(resolver, references)

      const rep = [
        {type: "object", name: "SomeModel", id: model.id, attributes: {value: 2}},
        {type: "object", name: "MissingModel", id: "missing"},
      ]
      expect(() => deserializer.decode(rep)).to.throw(DeserializationError)
      expect(model.value).to.be.equal(1)
      expect(references).to.be.equal(new Map([[model.id, model]]))
    })

    it("rolls back finalized references when initialization fails", () => {
      class FailingModel extends SomeModel {
        override initialize(): void {
          super.initialize()
          throw new Error("initialization failed")
        }
      }

      const resolver = new ModelResolver(null, [SomeModel, FailingModel])
      const references = new Map<string, HasProps>()
      const finalized = new Set<HasProps>()
      const order: string[] = []
      const deserializer = new Deserializer(resolver, references, (model) => {
        order.push(`finalize:${model.id}`)
        finalized.add(model)
        return () => {
          order.push(`rollback:${model.id}`)
          finalized.delete(model)
        }
      })

      const rep = [
        {type: "object", name: "SomeModel", id: "first"},
        {type: "object", name: "SomeModel", id: "second"},
        {type: "object", name: "FailingModel", id: "third"},
      ]
      expect(() => deserializer.decode(rep)).to.throw(Error, "initialization failed")
      expect(references.size).to.be.equal(0)
      expect(finalized.size).to.be.equal(0)
      expect(order).to.be.equal([
        "finalize:first", "finalize:second", "finalize:third",
        "rollback:third", "rollback:second", "rollback:first",
      ])
    })
  })
})
