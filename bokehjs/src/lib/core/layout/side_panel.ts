import {Size, Sizeable} from "./types"
import {ContentLayoutable} from "./layoutable"

import {Side, Orientation} from "../enums"
import {isString} from "../util/types"

// This table lays out the rules for configuring the baseline, alignment, etc. of
// title text, based on it's location and orientation
//
// side    orient        baseline   align     angle   normal-dist
// ------------------------------------------------------------------------------
// above   parallel      bottom     center    0       height
//         normal        middle     left      -90     width
//         horizontal    bottom     center    0       height
//         [angle > 0]   middle     left              width * sin + height * cos
//         [angle < 0]   middle     right             width * sin + height * cos
//
// below   parallel      top        center    0       height
//         normal        middle     right     90      width
//         horizontal    top        center    0       height
//         [angle > 0]   middle     right             width * sin + height * cos
//         [angle < 0]   middle     left              width * sin + height * cos
//
// left    parallel      bottom     center    90      height
//         normal        middle     right     0       width
//         horizontal    middle     right     0       width
//         [angle > 0]   middle     right             width * cos + height * sin
//         [angle < 0]   middle     right             width * cos + height + sin
//
// right   parallel      bottom     center   -90      height
//         normal        middle     left     0        width
//         horizontal    middle     left     0        width
//         [angle > 0]   middle     left              width * cos + height * sin
//         [angle < 0]   middle     left              width * cos + height + sin

const pi2 = Math.PI/2
const ALPHABETIC = 'alphabetic'
const HANGING = 'hanging'
const MIDDLE = 'middle'
const LEFT = 'left'
const RIGHT = 'right'
const CENTER = 'center'

export type Orient = "parallel" | "normal" | "horizontal" | "vertical"

const _angle_lookup: {[key in Side]: {[key in Orient]: number}} = {
  above: {
    parallel: 0,
    normal: -pi2,
    horizontal: 0,
    vertical: -pi2,
  },
  below: {
    parallel: 0,
    normal: pi2,
    horizontal: 0,
    vertical: pi2,
  },
  left: {
    parallel: -pi2,
    normal: 0,
    horizontal: 0,
    vertical: -pi2,
  },
  right: {
    parallel: pi2,
    normal: 0,
    horizontal: 0,
    vertical: pi2,
  },
}

const _baseline_lookup: {[key in Side]: {[key in Orient]: CanvasTextBaseline}} = {
  above: {
    parallel: ALPHABETIC,
    normal: MIDDLE,
    horizontal: ALPHABETIC,
    vertical: MIDDLE,
  },
  below: {
    parallel: HANGING,
    normal: MIDDLE,
    horizontal: HANGING,
    vertical: MIDDLE,
  },
  left: {
    parallel: ALPHABETIC,
    normal: MIDDLE,
    horizontal: MIDDLE,
    vertical: ALPHABETIC,
  },
  right: {
    parallel: ALPHABETIC,
    normal: MIDDLE,
    horizontal: MIDDLE,
    vertical: ALPHABETIC,
  },
}

const _align_lookup: {[key in Side]: {[key in Orient]: CanvasTextAlign}} = {
  above: {
    parallel: CENTER,
    normal: LEFT,
    horizontal: CENTER,
    vertical: LEFT,
  },
  below: {
    parallel: CENTER,
    normal: LEFT,
    horizontal: CENTER,
    vertical: LEFT,
  },
  left: {
    parallel: CENTER,
    normal: RIGHT,
    horizontal: RIGHT,
    vertical: CENTER,
  },
  right: {
    parallel: CENTER,
    normal: LEFT,
    horizontal: LEFT,
    vertical: CENTER,
  },
}

const _align_lookup_negative: {[key in Side]: CanvasTextAlign} = {
  above: RIGHT,
  below: LEFT,
  left: RIGHT,
  right: LEFT,
}

const _align_lookup_positive: {[key in Side]: CanvasTextAlign} = {
  above: LEFT,
  below: RIGHT,
  left: RIGHT,
  right: LEFT,
}

export class Panel {
  constructor(readonly side: Side) {}

  get dimension(): 0 | 1 {
    return this.side == "above" || this.side == "below" ? 0 : 1
  }

  get normals(): [number, number] {
    switch (this.side) {
      case "above": return [ 0, -1]
      case "below": return [ 0,  1]
      case "left":  return [-1,  0]
      case "right": return [ 1,  0]
    }
  }

  get orientation(): Orientation {
    return this.is_horizontal ? "horizontal" : "vertical"
  }

  get is_horizontal(): boolean {
    return this.dimension == 0
  }

  get is_vertical(): boolean {
    return this.dimension == 1
  }

  apply_label_text_heuristics(ctx: CanvasRenderingContext2D, orient: Orient | number): void {
    const {side} = this

    let baseline: CanvasTextBaseline
    let align: CanvasTextAlign

    if (isString(orient)) {
      baseline = _baseline_lookup[side][orient]
      align = _align_lookup[side][orient]
    } else {
      if (orient < 0) {
        baseline = 'middle'
        align = _align_lookup_negative[side]
      } else {
        baseline = 'middle'
        align = _align_lookup_positive[side]
      }
    }

    ctx.textBaseline = baseline
    ctx.textAlign = align
  }

  get_label_angle_heuristic(orient: Orient): number {
    return _angle_lookup[this.side][orient]
  }
}

export class SideLayout extends ContentLayoutable {

  constructor(readonly panel: Panel, readonly get_size: () => Size, readonly rotate: boolean = false) {
    super()

    if (this.panel.is_horizontal)
      this.set_sizing({width_policy: "max", height_policy: "fixed"})
    else
      this.set_sizing({width_policy: "fixed", height_policy: "max"})
  }

  protected _content_size(): Sizeable {
    const {width, height} = this.get_size()
    if (!this.rotate || this.panel.is_horizontal)
      return new Sizeable({width, height})
    else
      return new Sizeable({width: height, height: width})
  }

  has_size_changed(): boolean {
    const {width, height} = this._content_size()
    if (this.panel.is_horizontal)
      return this.bbox.height != height
    else
      return this.bbox.width != width
  }
}
