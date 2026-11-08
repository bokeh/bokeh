import assert from "node:assert/strict"
import {test} from "node:test"

import type {Graph} from "#compiler/graph.js"
import {detect_cycles, strongly_connected_components} from "#compiler/graph.js"

function graph(edges: {[node: string]: string[]}): Graph<string> {
  return new Map(Object.entries(edges))
}

void test("strongly_connected_components() groups mutually reachable nodes", () => {
  const g = graph({a: ["b"], b: ["c", "d"], c: ["a"], d: ["e"], e: ["d"], f: []})
  assert.deepEqual(strongly_connected_components(g), [["a", "b", "c"], ["d", "e"], ["f"]])
})

void test("detect_cycles() returns nothing for acyclic graphs", () => {
  assert.deepEqual(detect_cycles(graph({a: ["b", "c"], b: ["c"], c: []})), [])
})

void test("detect_cycles() returns one shortest cycle per group of mutually dependent nodes", () => {
  // a -> b -> c -> a is a cycle, as is the shorter a -> c -> a
  const g = graph({a: ["b", "c"], b: ["c"], c: ["a"], d: ["e"], e: ["d"], f: ["a"]})
  assert.deepEqual(detect_cycles(g), [["a", "c"], ["d", "e"]])
})

void test("detect_cycles() detects self-dependencies", () => {
  assert.deepEqual(detect_cycles(graph({a: ["a"], b: []})), [["a"]])
})

void test("detect_cycles() handles deep graphs", () => {
  const n = 100_000
  const g: Graph<number> = new Map()
  for (let i = 0; i < n; i++) {
    g.set(i, [i + 1 == n ? 0 : i + 1])
  }
  const cycles = detect_cycles(g)
  assert.equal(cycles.length, 1)
  assert.equal(cycles[0].length, n)
})
