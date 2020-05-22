import {display, fig} from "../utils"

import {repeat} from "@bokehjs/core/util/array"

describe("HexTile glyph", () => {
  /* eslint-disable indent */
  const pq = [
          0,  1,  2,  3,
        -1,  0,  1,  2,  3,
      -2, -1,  0,  1,  2,  3,
    -3, -2, -1,  0,  1,  2,  3,
      -3, -2, -1,  0,  1,  2,
        -3, -2, -1,  0,  1,
          -3, -2, -1,  0,
  ]
  const pr = [
          -3, -3, -3, -3,       // red row
        -2, -2, -2, -2, -2,     // blue row
      -1, -1, -1, -1, -1, -1,   // green row
    0,  0,  0,  0,  0,  0,  0,  // grey row
      1,  1,  1,  1,  1,  1,    // orange row
        2,  2,  2,  2,  2,      // purple row
          3,  3,  3,  3,        // gold row
  ]

  const fq = [
          -3, -3, -3, -3,       // red col
        -2, -2, -2, -2, -2,     // blue col
      -1, -1, -1, -1, -1, -1,   // green col
    0,  0,  0,  0,  0,  0,  0,  // grey col
      1,  1,  1,  1,  1,  1,    // orange col
        2,  2,  2,  2,  2,      // purple col
          3,  3,  3,  3,        // gold col
  ]
  const fr = [
          0,  1,  2,  3,
        -1,  0,  1,  2,  3,
      -2, -1,  0,  1,  2,  3,
    -3, -2, -1,  0,  1,  2,  3,
      -3, -2, -1,  0,  1,  2,
        -3, -2, -1,  0,  1,
          -3, -2, -1,  0,
  ]
  /* eslint-enable indent */

  const colors = [
    ...repeat("red",    4),
    ...repeat("blue",   5),
    ...repeat("green",  6),
    ...repeat("grey",   7),
    ...repeat("orange", 6),
    ...repeat("purple", 5),
    ...repeat("gold",   4),
  ]

  it("should support 'pointytop' orientation", async () => {
    const p0 = fig([300, 300], {match_aspect: true, title: "pointytop"})
    p0.hex_tile(pr, pq, {line_color: "white", fill_color: colors, orientation: "pointytop"})
    await display(p0, [350, 350])
  })

  it("should support 'pointytop' orientation with size=10", async () => {
    const p1 = fig([300, 300], {match_aspect: true, title: "pointytop, size=10"})
    p1.hex_tile(pr, pq, {line_color: "white", fill_color: colors, orientation: "pointytop", size: 10})
    await display(p1, [350, 350])
  })

  it("should support 'pointytop' orientation and aspect_scale=2", async () => {
    const p2 = fig([300, 300], {match_aspect: true, title: "pointytop, aspect_scale=2"})
    p2.hex_tile(pr, pq, {line_color: "white", fill_color: colors, orientation: "pointytop", aspect_scale: 2})
    await display(p2, [350, 350])
  })

  it("should support 'pointytop' orientation and aspect_scale=0.5", async () => {
    const p3 = fig([300, 300], {match_aspect: true, title: "pointytop, aspect_scale=0.5"})
    p3.hex_tile(pr, pq, {line_color: "white", fill_color: colors, orientation: "pointytop", aspect_scale: 0.5})
    await display(p3, [350, 350])
  })

  it("should support 'flattop' orientation", async () => {
    const f0 = fig([300, 300], {match_aspect: true, title: "flattop"})
    f0.hex_tile(fr, fq, {line_color: "white", fill_color: colors, orientation: "flattop"})
    await display(f0, [350, 350])
  })

  it("should support 'flattop' orientation with size=10", async () => {
    const f1 = fig([300, 300], {match_aspect: true, title: "flattop, size=10"})
    f1.hex_tile(fr, fq, {line_color: "white", fill_color: colors, orientation: "flattop", size: 10})
    await display(f1, [350, 350])
  })

  it("should support 'flattop' orientation and aspect_scale=2", async () => {
    const f2 = fig([300, 300], {match_aspect: true, title: "flattop, aspect_scale=2"})
    f2.hex_tile(fr, fq, {line_color: "white", fill_color: colors, orientation: "flattop", aspect_scale: 2})
    await display(f2, [350, 350])
  })

  it("should support 'flattop' orientation and aspect_scale=0.5", async () => {
    const f3 = fig([300, 300], {match_aspect: true, title: "flattop, aspect_scale=0.5"})
    f3.hex_tile(fr, fq, {line_color: "white", fill_color: colors, orientation: "flattop", aspect_scale: 0.5})
    await display(f3, [350, 350])
  })
})
