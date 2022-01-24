import {expect} from "assertions"

import {Serializer, SerializationError} from "@bokehjs/core/serializer"
import {Base64Buffer} from "@bokehjs/core/util/serialization"
import {HasProps} from "@bokehjs/core/has_props"
import * as p from "@bokehjs/core/properties"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {BYTE_ORDER} from "@bokehjs/core/util/platform"

function to_serializable(obj: unknown): {repr: unknown, json: string} {
  const serializer = new Serializer()
  const repr = serializer.to_serializable(obj)
  const json = JSON.stringify(repr)
  return {repr, json}
}

namespace SomeModel {
  export type Attrs = p.AttrsOf<Props>
  export type Props = HasProps.Props & {
    value: p.Property<number>
    array: p.Property<number[]>
    dict: p.Property<{[key: string]: number}>
    map: p.Property<Map<string, number>>
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

describe("core/serializer module", () => {
  describe("implements to_serializable() function", () => {
    it("that supports null", () => {
      expect(to_serializable(null)).to.be.equal({repr: null, json: "null"})
    })

    it("that supports booleans", () => {
      expect(to_serializable(false)).to.be.equal({repr: false, json: "false"})
      expect(to_serializable(true)).to.be.equal({repr: true, json: "true"})
    })

    it("that supports numbers", () => {
      expect(to_serializable(0)).to.be.equal({repr: 0, json: "0"})
      expect(to_serializable(1)).to.be.equal({repr: 1, json: "1"})
      expect(to_serializable(-1)).to.be.equal({repr: -1, json: "-1"})
      expect(to_serializable(NaN)).to.be.equal({repr: {type: "number", value: "nan"}, json: '{"type":"number","value":"nan"}'})
      expect(to_serializable(Infinity)).to.be.equal({repr: {type: "number", value: "+inf"}, json: '{"type":"number","value":"+inf"}'})
      expect(to_serializable(-Infinity)).to.be.equal({repr: {type: "number", value: "-inf"}, json: '{"type":"number","value":"-inf"}'})
      expect(to_serializable(Number.MAX_SAFE_INTEGER)).to.be.equal({repr: Number.MAX_SAFE_INTEGER, json: `${Number.MAX_SAFE_INTEGER}`})
      expect(to_serializable(Number.MIN_SAFE_INTEGER)).to.be.equal({repr: Number.MIN_SAFE_INTEGER, json: `${Number.MIN_SAFE_INTEGER}`})
      expect(to_serializable(Number.MAX_VALUE)).to.be.equal({repr: Number.MAX_VALUE, json: `${Number.MAX_VALUE}`})
      expect(to_serializable(Number.MIN_VALUE)).to.be.equal({repr: Number.MIN_VALUE, json: `${Number.MIN_VALUE}`})
    })

    it("that supports strings", () => {
      expect(to_serializable("")).to.be.equal({repr: "", json: '""'})
      expect(to_serializable("a")).to.be.equal({repr: "a", json: '"a"'})
      expect(to_serializable("a'b'c")).to.be.equal({repr: "a'b'c", json: '"a\'b\'c"'})
    })

    it("that supports symbols", () => {
      expect(to_serializable(Symbol("foo"))).to.be.equal({repr: {type: "symbol", name: "foo"}, json: '{"type":"symbol","name":"foo"}'})
      expect(() => to_serializable(Symbol())).to.throw(SerializationError)
    })

    it("that supports arrays", () => {
      expect(to_serializable([])).to.be.equal({repr: [], json: "[]"})
      expect(to_serializable([1, 2, 3])).to.be.equal({repr: [1, 2, 3], json: "[1,2,3]"})
    })

    it("that supports plain objects", () => {
      expect(to_serializable({})).to.be.equal({repr: {}, json: "{}"})
    })

    it("should support HasProps instances", () => {
      const obj0 = new SomeModel()
      expect(to_serializable(obj0)).to.be.equal({repr: {id: obj0.id}, json: `{"id":"${obj0.id}"}`})
    })

    it("should support ArrayBuffer instances", () => {
      const buf0 = new Uint8Array([0, 1, 2, 3, 4, 5, 6]).buffer
      expect(to_serializable(buf0)).to.be.equal({
        repr: {
          type: "bytes",
          data: new Base64Buffer(buf0),
        },
        json: '{"type":"bytes","data":"AAECAwQFBg=="}',
      })
    })

    it("should support ndarrays", () => {
      const nd0 = ndarray([1, 2, 3], {dtype: "int32", shape: [1, 3]})

      expect(to_serializable(nd0)).to.be.equal({
        repr: {
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
        repr: {
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

    it("should support circular references", () => {
      const obj0 = new SomeModel({value: 10})
      const obj1 = new SomeModel({value: 20, obj: obj0})
      const obj2 = new SomeModel({value: 30, obj: obj1})
      obj0.obj = obj2

      const serializer = new Serializer()
      const repr = serializer.to_serializable(obj2)
      const defs = [...serializer.definitions]

      expect(repr).to.be.equal({id: obj2.id})
      expect(defs).to.be.equal([
        {type: "SomeModel", id: obj0.id, attributes: {value: 10, obj: {id: obj2.id}}},
        {type: "SomeModel", id: obj1.id, attributes: {value: 20, obj: {id: obj0.id}}},
        {type: "SomeModel", id: obj2.id, attributes: {value: 30, obj: {id: obj1.id}}},
      ])
    })
  })
})
