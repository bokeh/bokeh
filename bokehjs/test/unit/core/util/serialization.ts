import {expect} from "assertions"

import * as ser from "@bokehjs/core/util/serialization"
import {ndarray} from "@bokehjs/core/util/ndarray"

const GOOD_TYPES = [
  Float32Array, Float64Array, Uint8Array, Int8Array,
  Uint16Array, Int16Array, Uint32Array, Int32Array,
]

describe("serialization module", () => {

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
      expect(a).to.be.equal(swapped)
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
      expect(a).to.be.equal(swapped)
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
      expect(a).to.be.equal(swapped)
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
        const b64 = ser.buffer_to_base64(b.buffer)
        expect(typeof b64).to.be.equal("string")
        const buf = ser.base64_to_buffer(b64)
        const c = new typ(buf)
        expect(c).to.be.equal(b)
      })
    }
  })

  it("should support NDArray serialization and de-serialization", () => {
    const nd0 = ndarray([1, 2, 3, 4, 5, 6], {dtype: "int32", shape: [2, 3]})

    const buffers0 = new Map<string, ArrayBuffer>()
    const ref0_0 = ser.encode_NDArray(nd0, buffers0)
    expect(ref0_0).to.be.equal({
      __buffer__: "0",
      order: ser.BYTE_ORDER,
      dtype: "int32",
      shape: [2, 3],
    })
    expect(buffers0).to.be.equal(new Map([["0", nd0.buffer]]))

    const deref0_0 = ser.decode_NDArray(ref0_0, buffers0)
    expect(deref0_0).to.be.equal(nd0)
    expect(() => ser.decode_NDArray(ref0_0, new Map())).to.throw()

    const ref0_1 = ser.encode_NDArray(nd0)
    expect(ref0_1).to.be.equal({
      __ndarray__: "AQAAAAIAAAADAAAABAAAAAUAAAAGAAAA",
      order: ser.BYTE_ORDER,
      dtype: "int32",
      shape: [2, 3],
    })

    const deref0_1 = ser.decode_NDArray(ref0_1, new Map())
    expect(deref0_1).to.be.equal(nd0)
  })
})
