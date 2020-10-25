import {expect} from "assertions"

import {Serializer} from "@bokehjs/core/serializer"
import {HasProps} from "@bokehjs/core/has_props"
import * as p from "@bokehjs/core/properties"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {BYTE_ORDER} from "@bokehjs/core/util/serialization"

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
  }
}

interface SomeModel extends SomeModel.Attrs {}

class SomeModel extends HasProps {
  properties: SomeModel.Props

  constructor(attrs?: Partial<SomeModel.Attrs>) {
    super(attrs)
  }

  static init_SomeModel(): void {
    this.define<SomeModel.Props>(({Number, Array, Dict}) => ({
      value: [ Number, 1 ],
      array: [ Array(Number), [] ],
      dict: [ Dict(Number), {} ],
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
      expect(to_serializable(NaN)).to.be.equal({repr: NaN, json: "null"})               // XXX
      expect(to_serializable(Infinity)).to.be.equal({repr: Infinity, json: "null"})     // XXX
      expect(to_serializable(-Infinity)).to.be.equal({repr: -Infinity, json: "null"})   // XXX
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

    it("should support ndarrays", () => {
      const nd0 = ndarray([1, 2, 3], {dtype: "int32", shape: [1, 3]})

      expect(to_serializable(nd0)).to.be.equal({
        repr: {
          __ndarray__: "AQAAAAIAAAADAAAA",
          order: BYTE_ORDER,
          dtype: "int32",
          shape: [1, 3],
        },
        json: `{"__ndarray__":"AQAAAAIAAAADAAAA","order":"${BYTE_ORDER}","dtype":"int32","shape":[1,3]}`,
      })
    })
  })
})
