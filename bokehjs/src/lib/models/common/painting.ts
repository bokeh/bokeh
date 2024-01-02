import type {Context2d} from "core/util/canvas"
import type {BBox, Corners} from "core/util/bbox"

export function round_rect(ctx: Context2d, bbox: BBox, border_radius: Corners<number>): void {
  /**
   * Create a path for a rect with rounded corners.
   *
   * From https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-roundrect.
   */
  let {top_left, top_right, bottom_right, bottom_left} = border_radius

  if (top_left != 0 || top_right != 0 || bottom_right != 0 || bottom_left != 0) {
    const {left, right, top, bottom, width, height} = bbox

    const scale = Math.min(
      width / (top_left + top_right),
      height / (top_right + bottom_right),
      width / (bottom_right + bottom_left),
      height / (top_left + bottom_left),
    )

    if (scale < 1.0) {
      top_left *= scale
      top_right *= scale
      bottom_right *= scale
      bottom_left *= scale
    }

    ctx.moveTo(left + top_left, top)
    ctx.lineTo(right - top_right, top)
    if (top_right != 0) {
      ctx.arcTo(right, top, right, top + top_right, top_right)
    }
    ctx.lineTo(right, bottom - bottom_right)
    if (bottom_right != 0) {
      ctx.arcTo(right, bottom, right - bottom_right, bottom, bottom_right)
    }
    ctx.lineTo(left + bottom_left, bottom)
    if (bottom_left != 0) {
      ctx.arcTo(left, bottom, left, bottom - bottom_left, bottom_left)
    }
    ctx.lineTo(left, top + top_left)
    if (top_left != 0) {
      ctx.arcTo(left, top, left + top_left, top, top_left)
    }
    ctx.closePath()
  } else {
    const {left, top, width, height} = bbox
    ctx.rect(left, top, width, height)
  }
}
