import {expect} from "assertions"

import {swap, base64_to_buffer, buffer_to_base64} from "@bokehjs/core/util/buffer"

describe("serialization module", () => {

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
      swap(b.buffer, "uint16")
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
      swap(b.buffer, "float32")
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
      swap(b.buffer, "float64")
      expect(a).to.be.equal(swapped)
    })
  })

  describe("base64 conversion functions", () => {
    const typed_arrays = [
      Float32Array, Float64Array, Uint8Array, Int8Array,
      Uint16Array, Int16Array, Uint32Array, Int32Array,
    ]

    for (const type of typed_arrays) {
      it(`should round trip ${type.name} buffers`, () => {
        const a = new Uint8Array(16)
        for (let i = 0; i < 16; i++) {
          a[i] = i
        }

        const b = new type(a)
        const b64 = buffer_to_base64(b.buffer)
        expect(typeof b64).to.be.equal("string")
        const buf = base64_to_buffer(b64)
        const c = new type(buf)
        expect(c).to.be.equal(b)
      })
    }
  })
})
