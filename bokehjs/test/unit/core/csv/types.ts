/*!
 * The code in this file is derived from node-csv
 * <https://github.com/adaltas/node-csv>
 *
 * Original code Copyright (c) 2010 Adaltas
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {expect} from "assertions"

import {stringify} from "@bokehjs/core/csv"

describe("core/csv stringify", () => {

  it("should not try to tell strings and numbers apart", () => {
    const a = stringify([
      ["1", "2"],
      ["3", "4"],
    ]);
    const b = stringify([
      [1, 2],
      [3, 4],
    ])
    expect(a).to.be.equal(b)
  })

  it("should not choke on dots", () => {
    const data = stringify([["a value", ".", "value.with.dot"]])
    expect(data).to.be.equal("a value,.,value.with.dot\n")
  })

  it("should properly quote and escape field with quotes", () => {
    const data = stringify([["a \"value\""]])
    expect(data).to.be.equal("\"a \"\"value\"\"\"\n")
  })

  it("should enclose field containing a comma with double quotes", () => {
    const data = stringify([["a,b"]])
    expect(data).to.be.equal("\"a,b\"\n")
  })

  it("should enclose field containing line break with double quotes", () => {
    const data = stringify([["a\nb"]])
    expect(data).to.be.equal("\"a\nb\"\n")
  })

  it("should map undefined to 'undefined'", () => {
    const data = stringify([[undefined, undefined]])
    expect(data).to.be.equal("undefined,undefined\n")
  })

  it("should map null to 'null'", () => {
    const data = stringify([[null, null]])
    expect(data).to.be.equal("null,null\n")
  })

  it("should map empty string to empty string", () => {
    const data = stringify([["", ""]])
    expect(data).to.be.equal(",\n")
  })

  it("should map date to ISO string", () => {
    const datetime = new Date()
    const data = stringify([[datetime]])
    expect(data).to.be.equal(`${datetime.toISOString()  }\n`)
  })

  it("should map true boolean value to 'true'", () => {
    const data = stringify([[true]])
    expect(data).to.be.equal("true\n")
  })

  it("should map object to its core/util/pretty representation", () => {
    const data = stringify([[{a: 1}]])
    expect(data).to.be.equal("{a: 1}\n")
  })
})
