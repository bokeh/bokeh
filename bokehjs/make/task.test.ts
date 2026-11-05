import assert from "node:assert/strict"
import {stripVTControlCharacters} from "node:util"
import type {TestContext} from "node:test"
import {test} from "node:test"

import {task, run, passthrough, failure, BuildError} from "./task.js"

function capture_log(t: TestContext): () => string[] {
  const log = t.mock.method(console, "log", () => {})
  return () => {
    return log.mock.calls
      .map((call) => stripVTControlCharacters(`${call.arguments[0]}`).replace(/^\[[^\]]*\] /, ""))
      .filter((line) => line.startsWith("failed:"))
  }
}

void test("each failure is reported once, by the task that failed", async (t) => {
  const failures = capture_log(t)

  //      root
  //     /    \
  //   left  right
  //     \    /
  //      leaf (fails)
  task("diamond:leaf", async () => failure(new BuildError("diamond:leaf", "leaf error")))
  task("diamond:left", ["diamond:leaf"])
  task("diamond:right", ["diamond:leaf"], async () => {})
  const root = task("diamond:root", ["diamond:left", "diamond:right"])

  const result = await run(root)

  assert.ok(result.is_Failure())
  assert.equal(result.value.message, "task 'diamond:root' failed because 'diamond:left' and 'diamond:right' failed")
  assert.deepEqual(failures(), [
    "failed: leaf error",
    "failed: task 'diamond:left' failed because 'diamond:leaf' failed",
    "failed: task 'diamond:right' failed because 'diamond:leaf' failed",
    "failed: task 'diamond:root' failed because 'diamond:left' and 'diamond:right' failed",
  ])
})

void test("thrown errors are reported once", async (t) => {
  const failures = capture_log(t)

  task("throws:leaf", async () => {
    throw new BuildError("throws:leaf", "thrown error")
  })
  const root = task("throws:root", ["throws:leaf"])

  const result = await run(root)

  assert.ok(result.is_Failure())
  assert.deepEqual(failures(), [
    "failed: thrown error",
    "failed: task 'throws:root' failed because 'throws:leaf' failed",
  ])
})

void test("passthrough failures are reported once and summarized at the end", async (t) => {
  const failures = capture_log(t)

  task("passthrough:leaf", async () => failure(new BuildError("passthrough:leaf", "leaf error")))
  task("passthrough:middle", [passthrough("passthrough:leaf")], async () => {})
  const root = task("passthrough:root", ["passthrough:middle"])

  const result = await run(root)

  assert.ok(result.is_Failure())
  assert.equal(result.value.message, "task 'passthrough:root' failed because 'passthrough:leaf' failed")
  assert.deepEqual(failures(), [
    "failed: leaf error",
    "failed: task 'passthrough:root' failed because 'passthrough:leaf' failed",
  ])
})

void test("successful runs report no failures", async (t) => {
  const failures = capture_log(t)

  task("success:leaf", async () => {})
  const root = task("success:root", ["success:leaf"])

  const result = await run(root)

  assert.ok(result.is_Success())
  assert.deepEqual(failures(), [])
})
