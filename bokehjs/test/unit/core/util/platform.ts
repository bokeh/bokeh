import {expect} from "#framework/assertions"

import {to_big_endian} from "@bokehjs/core/util/platform"

describe("core/util/platform module", () => {

  describe("to_big_endian function", () => {

    function bytes_of(values: Uint32Array): number[] {
      return [...new Uint8Array(values.buffer)]
    }

    it("should store values in big-endian byte order", () => {
      const values = new Uint32Array([0x11223344, 0xff000080, 0x80000000, 0x000000ff, 0xffffffff, 0])
      to_big_endian(values)
      expect(bytes_of(values)).to.be.equal([
        0x11, 0x22, 0x33, 0x44,
        0xff, 0x00, 0x00, 0x80,
        0x80, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0xff,
        0xff, 0xff, 0xff, 0xff,
        0x00, 0x00, 0x00, 0x00,
      ])
    })

    it("should support empty arrays", () => {
      const values = new Uint32Array(0)
      to_big_endian(values)
      expect(values.length).to.be.equal(0)
    })

    it("should only change elements of the given view", () => {
      const values = new Uint32Array([0x01020304, 0x11223344, 0x05060708])
      to_big_endian(values.subarray(1, 2))
      const view = new DataView(values.buffer)
      expect(values[0]).to.be.equal(0x01020304)
      expect(view.getUint32(4, false)).to.be.equal(0x11223344)
      expect(values[2]).to.be.equal(0x05060708)
    })
  })
})
