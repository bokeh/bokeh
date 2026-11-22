import assert from "node:assert/strict"
import {test} from "node:test"

import {PNG} from "pngjs"

import {diff_image} from "./image.js"

function image(width: number = 10, height: number = 10): PNG {
  const png = new PNG({width, height})
  png.data.fill(255)
  return png
}

function compare(reference: PNG, actual: PNG) {
  return diff_image(PNG.sync.write(reference), PNG.sync.write(actual))
}

void test("screenshot comparison tolerates raster rounding", () => {
  const reference = image()
  const actual = image()
  actual.data.set([254, 254, 254, 255], 4*55)
  assert.equal(compare(reference, actual), null)
})

void test("screenshot comparison detects subtle uniform color changes", () => {
  const reference = image()
  const actual = image()
  for (let i = 0; i < 100; i++) {
    actual.data.set([250, 250, 250, 255], 4*i)
  }
  assert.equal(compare(reference, actual)?.pixels, 100)
})

void test("screenshot comparison detects a one-pixel defect and produces a PNG diff", () => {
  const reference = image()
  const actual = image()
  actual.data.set([0, 0, 0, 255], 4*55)
  const result = compare(reference, actual)
  assert.ok(result != null)
  assert.equal(result.pixels, 1)
  assert.equal(result.percent, 1)
  const diff = PNG.sync.read(result.diff)
  assert.equal(diff.width, 10)
  assert.equal(diff.height, 10)
})

void test("screenshot comparison detects visible alpha-only changes", () => {
  const reference = image()
  const actual = image()
  reference.data.set([0, 0, 0, 255], 4*55)
  actual.data.set([0, 0, 0, 0], 4*55)
  assert.equal(compare(reference, actual)?.pixels, 1)
})

void test("screenshot comparison preserves white padding for unequal dimensions", () => {
  const reference = image()
  const actual = image(12, 10)
  assert.equal(compare(reference, actual), null)
  actual.data.set([0, 0, 0, 255], 4*71)
  const result = compare(reference, actual)
  assert.ok(result != null)
  assert.equal(result.pixels, 1)
  assert.equal(result.percent, 1/120*100)
  assert.equal(PNG.sync.read(result.diff).width, 12)
})

void test("screenshot comparison ignores antialiasing at a solid edge", () => {
  const reference = image()
  const actual = image()
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 5; x++) {
      reference.data.set([0, 0, 0, 255], 4*(y*10 + x))
      actual.data.set([0, 0, 0, 255], 4*(y*10 + x))
    }
  }
  actual.data.set([128, 128, 128, 255], 4*54)
  assert.equal(compare(reference, actual), null)
})
