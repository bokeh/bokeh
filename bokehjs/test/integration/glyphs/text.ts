import {display, fig} from "../utils"

describe("Text glyph", () => {
  it("should allow to paint text with embedded scripts", async () => {
    const p = fig([250, 100], {x_range: [0, 16], y_range: [0, 2]})
    p.text(0, 0, ["</script><script>throw new Error('XSS1')</script>"])
    p.text(0, 1, ["<script>throw new Error('XSS0')</script>"])
    await display(p, [300, 150])
  })
})
