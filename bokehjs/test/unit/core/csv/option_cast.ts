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

  describe("Option `cast`", () => {

    it("should use default cast function when option not provided", () => {
      const record = [
        new Date(0), {a: 1}, "foo",
      ]
      const data = stringify(
        [
          record,
        ],
      )
      expect(data).to.be.equal(
        "1970-01-01T00:00:00.000Z,{a: 1},foo\n",
      )
    })

    it("should use provided cast function", () => {
      const record = [
        new Date(), {a: 1}, "foo",
      ]
      const data = stringify(
        [
          record,
        ],
        {
          cast(field) {
            if (field instanceof Date) {
              return "date"
            } else if (typeof field === "object") {
              return "object"
            } else {
              return "string"
            }
          },
        },
      )
      expect(data).to.be.equal("date,object,string\n")
    })

    it("should catch error thrown in cast function", () => {
      const fn = () => {
        stringify([
          [
            true,
          ],
        ],
        {
          cast() {
            throw new Error("Catchme")
          },
        },
        )
      }
      expect(fn).to.throw(Error, "Catchme")
    })

    it("should return a string", () => {
      const fn = () => stringify(
        [
          [
            true,
          ],
        ],
        // @ts-ignore
        {cast: (value) => (value ? 1 : 0)},
      )
      expect(fn).to.throw(Error, "Invalid Casting Value: string cast function must return a string, got true")
    })

    describe("context", () => {
      it("should expose the expected properties", () => {
        stringify(
          [["a"]],
          {
            cast: (_, context) => {
              expect(
                Object.keys(context).sort(),
              ).to.be.equal(
                ["column_index", "first_row", "row_index"],
              )
              return "a"
            },
          },
        )
      })

      it("should provide first row, and column and row index", function() {
        stringify(
          [
            ["P", "Q"],
            [true, false],
          ],
          {
            cast: (value, context) => {
              if (value === true) {
                expect(context.column_index).to.be.equal(0)
                expect(context.first_row).to.be.equal(["P", "Q"])
                expect(context.row_index).to.be.equal(1)
                return "yes"
              } else if (value === false) {
                expect(context.column_index).to.be.equal(1)
                expect(context.first_row).to.be.equal(["P", "Q"])
                expect(context.row_index).to.be.equal(1)
                return "no"
              }
              return ""
            },
          },
        )
      })
    })
  })
})
