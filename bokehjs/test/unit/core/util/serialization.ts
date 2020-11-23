import {expect} from "assertions"

import {encode_NDArray, decode_NDArray} from "@bokehjs/core/util/serialization"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {BYTE_ORDER} from "@bokehjs/core/util/platform"

describe("serialization module", () => {


  it("should support NDArray serialization and de-serialization", () => {
    const nd0 = ndarray([1, 2, 3, 4, 5, 6], {dtype: "int32", shape: [2, 3]})

    const buffers0 = new Map<string, ArrayBuffer>()
    const ref0_0 = encode_NDArray(nd0, buffers0)
    expect(ref0_0).to.be.equal({
      __buffer__: "0",
      order: BYTE_ORDER,
      dtype: "int32",
      shape: [2, 3],
    })
    expect(buffers0).to.be.equal(new Map([["0", nd0.buffer]]))

    const deref0_0 = decode_NDArray(ref0_0, buffers0)
    expect(deref0_0).to.be.equal(nd0)
    expect(() => decode_NDArray(ref0_0, new Map())).to.throw()

    const ref0_1 = encode_NDArray(nd0)
    expect(ref0_1).to.be.equal({
      __ndarray__: "AQAAAAIAAAADAAAABAAAAAUAAAAGAAAA",
      order: BYTE_ORDER,
      dtype: "int32",
      shape: [2, 3],
    })

    const deref0_1 = decode_NDArray(ref0_1, new Map())
    expect(deref0_1).to.be.equal(nd0)
  })
})
