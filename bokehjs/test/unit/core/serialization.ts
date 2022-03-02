import {expect} from "assertions"

import {Serializer, SerializationError, Base64Buffer, AnyVal} from "@bokehjs/core/serialization"
import {Deserializer, DeserializationError} from "@bokehjs/core/serialization/deserializer"
import {default_resolver} from "@bokehjs/base"
import {ModelResolver} from "@bokehjs/core/resolvers"
import {HasProps} from "@bokehjs/core/has_props"
import * as p from "@bokehjs/core/properties"
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
    dict: p.Property<{[key: string]: number}>
    map: p.Property<Map<number[], number>>
    set: p.Property<Set<number[]>>
    obj: p.Property<SomeModel | null>
  }
}

interface SomeModel extends SomeModel.Attrs {}

class SomeModel extends HasProps {
  override properties: SomeModel.Props

  constructor(attrs?: Partial<SomeModel.Attrs>) {
    super(attrs)
  }

  static {
    this.define<SomeModel.Props>(({Number, Array, Dict, Ref, Nullable}) => ({
      value: [ Number, 1 ],
      array: [ Array(Number), [] ],
      dict: [ Dict(Number), {} ],
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
        rep: {type: "map", entries: []},
        json: '{"type":"map","entries":[]}'},
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
        rep: {type: "map", entries: []},
        json: '{"type":"map","entries":[]}'},
      )
      const val1 = Object.create(null)
      val1.key0 = 0
      val1.key1 = NaN
      expect(to_serializable(val1)).to.be.equal({
        rep: {type: "map", entries: [["key0", 0], ["key1", {type: "number", value: "nan"}]]},
        json: '{"type":"map","entries":[["key0",0],["key1",{"type":"number","value":"nan"}]]}',
      })
    })

    it("should support HasProps instances", () => {
      const obj0 = new SomeModel()
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

    it("should support ArrayBuffer instances", () => {
      const buf0 = new Uint8Array([0, 1, 2, 3, 4, 5, 6]).buffer
      expect(to_serializable(buf0)).to.be.equal({
        rep: {
          type: "bytes",
          data: new Base64Buffer(buf0),
        },
        json: '{"type":"bytes","data":"AAECAwQFBg=="}',
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
        json: `{"type":"typed_array","array":{"type":"bytes","data":"AQAAAAIAAAADAAAA"},"order":"${BYTE_ORDER}","dtype":"int32"}`,
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
        json: `{"type":"typed_array","array":{"type":"bytes","data":"mpmZmZmZ8T/NzMzMzMwAQM3MzMzMzAhAZmZmZmZmEEBmZmZmZmYUQGZmZmZmZhhA"},"order":"${BYTE_ORDER}","dtype":"float64"}`,
      })
    })

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
        json: `{"type":"ndarray","array":{"type":"bytes","data":"AQAAAAIAAAADAAAA"},"order":"${BYTE_ORDER}","dtype":"int32","shape":[1,3]}`,
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
        json: `{"type":"ndarray","array":{"type":"bytes","data":"mpmZmZmZ8T/NzMzMzMwAQM3MzMzMzAhAZmZmZmZmEEBmZmZmZmYUQGZmZmZmZhhA"},"order":"${BYTE_ORDER}","dtype":"float64","shape":[2,3]}`,
      })
    })

    it("should support circular model references", () => {
      const obj0 = new SomeModel({value: 10})
      const obj1 = new SomeModel({value: 20, obj: obj0})
      const obj2 = new SomeModel({value: 30, obj: obj1})
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
    it("should support ndarrays", () => {
      const nd0 = ndarray([1, 2, 3], {dtype: "int32", shape: [1, 3]})

      const rep = {
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
  })
})
