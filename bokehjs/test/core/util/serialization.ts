import {expect} from "chai"

import * as ser from "core/util/serialization"
import {isObject} from "core/util/types"

const GOOD_TYPES = [
  Float32Array, Float64Array, Uint8Array, Int8Array,
  Uint16Array, Int16Array, Uint32Array, Int32Array,
]

describe("serialization module", () => {

  describe("ARRAY_TYPES", () => {

    it("should map to all available typed array types", () => {
      const expected  = {
        float32: Float32Array,
        float64: Float64Array,
        uint8: Uint8Array,
        int8: Int8Array,
        uint16: Uint16Array,
        int16: Int16Array,
        uint32: Uint32Array,
        int32: Int32Array,
      }
      expect(ser.ARRAY_TYPES).to.be.deep.equal(expected)
    })
  })

  describe("DTYPES", () => {
    for (const typ of GOOD_TYPES) {
      it(`should map ${typ.name} type names to ${ser.DTYPES[typ.name as ser.ArrayName]}`, () => {
        expect(ser.ARRAY_TYPES[ser.DTYPES[typ.name as ser.ArrayName]]).to.be.equal(typ)
      })
    }
  })

  describe("BYTE_ORDER", () => {
    it("should be big or little", () => {
      // not a great test but the best we can do for now
      const o = ser.BYTE_ORDER
      expect(o == "big" || o == "little").to.be.true
    })
  })

  describe("byte swap functions", () => {

    it("should have swap16 that swaps 2 bytes in place", () => {
      const a = new Uint8Array(4)
      for (let i = 0; i < 4; i++) {
        a[i] = i
      }
      const b = new Uint16Array(a.buffer)
      expect(b.length).to.be.equal(2)
      const swapped = new Uint8Array(4)
      swapped[0] = 1
      swapped[1] = 0
      swapped[2] = 3
      swapped[3] = 2
      ser.swap16(b)
      expect(a).to.be.deep.equal(swapped)
    })

    it("should have swap32 that swaps 4 bytes in place", () => {
      const a = new Uint8Array(8)
      for (let i = 0; i < 8; i++) {
        a[i] = i
      }
      const b = new Float32Array(a.buffer)
      expect(b.length).to.be.equal(2)
      const swapped = new Uint8Array(8)
      swapped[0] = 3
      swapped[1] = 2
      swapped[2] = 1
      swapped[3] = 0
      swapped[4] = 7
      swapped[5] = 6
      swapped[6] = 5
      swapped[7] = 4
      ser.swap32(b)
      expect(a).to.be.deep.equal(swapped)
    })

    it("should have swap64 that swaps 8 bytes in place", () => {
      const a = new Uint8Array(16)
      for (let i = 0; i < 16; i++) {
        a[i] = i
      }
      const b = new Float64Array(a.buffer)
      expect(b.length).to.be.equal(2)
      const swapped = new Uint8Array(16)
      swapped[0]  = 7
      swapped[1]  = 6
      swapped[2]  = 5
      swapped[3]  = 4
      swapped[4]  = 3
      swapped[5]  = 2
      swapped[6]  = 1
      swapped[7]  = 0
      swapped[8]  = 15
      swapped[9]  = 14
      swapped[10] = 13
      swapped[11] = 12
      swapped[12] = 11
      swapped[13] = 10
      swapped[14] = 9
      swapped[15] = 8
      ser.swap64(b)
      expect(a).to.be.deep.equal(swapped)
    })
  })

  describe("base64 conversion functions", () => {

    for (const typ of GOOD_TYPES) {
      it(`should round trip ${typ.name} buffers`, () => {
        const a = new Uint8Array(16)
        for (let i = 0; i < 16; i++) {
          a[i] = i
        }

        const b = new typ(a)
        const b64 = ser.arrayBufferToBase64(b.buffer)
        expect(typeof b64).to.be.equal("string")
        const buf = ser.base64ToArrayBuffer(b64)
        const c = new typ(buf)
        expect(c).to.be.deep.equal(b)
      })
    }
  })

  describe("encode/decode base64 functions", () => {

    for (const typ of GOOD_TYPES) {
      it(`should roundtrip ${typ.name} arrays`, () => {
        const array = new typ([1, 2])
        const shape = [2]
        const e = ser.encode_base64(array, shape)
        expect(isObject(e)).to.be.true
        expect(Object.keys(e).length).to.be.equal(3)
        expect(e.dtype).to.equal(ser.DTYPES[typ.name as ser.ArrayName])
        expect(e.shape).to.be.deep.equal([2])

        const [d, s] = ser.decode_base64(e)
        expect(array).to.be.deep.equal(d)
        expect(shape).to.be.deep.equal(s)
      })
    }
  })

  describe("decode_column_data", () => {

    it("should encode typed column data source", () => {
      const data = {
        x: new Float64Array([1, 2]),
        y: new Float64Array([1.1, 2.2]),
      }
      const shapes = {
        x: [2],
        y: [2],
      }
      const e = ser.encode_column_data(data, shapes)
      const [d, s] = ser.decode_column_data(e)
      expect(data).to.be.deep.equal(d)
      expect(shapes).to.be.deep.equal(s)
    })

    it("should encode nested typed column data source", () => {
      const data = {
        x: [new Float64Array([1, 2]), new Float64Array([2, 3])],
        y: [new Float64Array([1.1, 2.2]), new Float64Array([3.3, 4.4])],
      }
      const shapes = {
        x: [[2], [2]],
        y: [[2], [2]],
      }
      const e = ser.encode_column_data(data, shapes)
      const [d, s] = ser.decode_column_data(e)
      expect(data).to.be.deep.equal(d)
      expect(shapes).to.be.deep.equal(s)
    })

    it("should encode mixed type column data source", () => {
      const data = {
        x: new Float64Array([1, 2]),
        y: [2.2, 3.3],
      }
      const shapes = {x: [2]}
      const e = ser.encode_column_data(data, shapes)
      const [d, s] = ser.decode_column_data(e)
      expect(data).to.be.deep.equal(d)
      expect(shapes).to.be.deep.equal(s)
    })

    it("should encode deeply nested typed column data source", () => {
      const data = {
        x: [[[new Float64Array([1, 2])]], [[new Float64Array([2, 3])]]],
        y: [[[new Float64Array([1.1, 2.2])]], [[new Float64Array([3.3, 4.4])]]],
      }
      const shapes = {
        x: [[[[2]]], [[[2]]]],
        y: [[[[2]]], [[[2]]]],
      }
      const e = ser.encode_column_data(data, shapes)
      const [d, s] = ser.decode_column_data(e)
      expect(data).to.be.deep.equal(d)
      expect(shapes).to.be.deep.equal(s)
    })

    it("should encode deeply nested typed mixed type column data source", () => {
      const data = {
        x: [[[[1, 2]]], [[new Float64Array([2, 3])]]],
        y: [[[[1.1, 2.2]]], [[new Float64Array([3.3, 4.4])]]],
      }
      const shapes = {
        x: [[], [[[2]]]],
        y: [[], [[[2]]]],
      }
      const e = ser.encode_column_data(data, shapes)
      const [d, s] = ser.decode_column_data(e)
      expect(data).to.be.deep.equal(d)
      expect(shapes).to.be.deep.equal(s)
    })

  })

  describe("encode_column_data", () => {

    for (const typ of GOOD_TYPES) {
      it(`should encode ${typ.name} array columns`, () => {
        const data = {a: new typ([1, 2]), b: [10, 20]}
        const enc = ser.encode_column_data(data)
        expect(enc['b']).to.be.deep.equal([10, 20])
        expect(enc['a']).to.be.deep.equal({
          __ndarray__: ser.arrayBufferToBase64(data['a'].buffer),
          shape: undefined,
          dtype: ser.DTYPES[typ.name as ser.ArrayName],
        })
      })
    }

    for (const typ of GOOD_TYPES) {
      it(`should encode ragged ${typ.name} array columns`, () => {
        const data = {a: [new typ([1, 2]), new typ([1, 2])], b: [10, 20]}
        const enc = ser.encode_column_data(data)
        expect(enc['b']).to.be.deep.equal([10, 20])
        expect(enc['a']).to.be.deep.equal([{
          __ndarray__: ser.arrayBufferToBase64(data['a'][0].buffer),
          shape: undefined,
          dtype: ser.DTYPES[typ.name as ser.ArrayName],
        }, {
          __ndarray__: ser.arrayBufferToBase64(data['a'][1].buffer),
          shape: undefined,
          dtype: ser.DTYPES[typ.name as ser.ArrayName],
        }])
      })
    }

    for (const typ of GOOD_TYPES) {
      it(`should encode ${typ.name} array columns with shapes`, () => {
        const data1 = {a: new typ([1, 2, 3, 4]), b: [10, 20]}
        const enc1 = ser.encode_column_data(data1, {a: [2,2]})
        expect(enc1['b']).to.be.deep.equal([10, 20])
        expect(enc1['a']).to.be.deep.equal({
          __ndarray__: ser.arrayBufferToBase64(data1['a'].buffer),
          shape: [2, 2],
          dtype: ser.DTYPES[typ.name as ser.ArrayName],
        })

        const data2 = {a: [new typ([1, 2]), new typ([1, 2])], b: [10, 20]}
        const enc2 = ser.encode_column_data(data2, {a: [[1,2], [2, 1]]})
        expect(enc2['b']).to.be.deep.equal([10, 20])
        expect(enc2['a']).to.be.deep.equal([{
          __ndarray__: ser.arrayBufferToBase64(data2['a'][0].buffer),
          shape: [1, 2],
          dtype: ser.DTYPES[typ.name as ser.ArrayName],
        }, {
          __ndarray__: ser.arrayBufferToBase64(data2['a'][1].buffer),
          shape: [2, 1],
          dtype: ser.DTYPES[typ.name as ser.ArrayName],
        }])
      })
    }
  })

  describe("process_array", () => {
    it("should return arrays as-is", () => {
      const arr = [1, 2, 3.4]
      expect(ser.process_array(arr, [])).to.be.deep.equal([ arr, [] ])
    })

    it("should return typed arrays as-is", () => {
      for (const typ of GOOD_TYPES) {
        const arr = new typ([1, 2, 3.4])
        expect(ser.process_array(arr, [])).to.be.deep.equal([ arr, [] ])
      }
    })
  })
})
