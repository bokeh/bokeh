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
export class CsvError extends Error {
  [key: string]: any
  code: string

  constructor(code: string, message: string | string[], ...contexts: Record<string, any>[]) {
    if (Array.isArray(message)) { message = message.join(" ") }
    super(message)
    if ("captureStackTrace" in Error && typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, CsvError)
    }
    this.code = code
    for (const context of contexts) {
      // eslint-disable-next-line
      for (const key in context) {
        const value = context[key]
        this[key] = value == null
          ? value
          : JSON.parse(JSON.stringify(value))
      }
    }
  }
}
