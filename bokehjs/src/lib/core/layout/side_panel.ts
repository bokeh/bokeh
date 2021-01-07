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

type VerticalAlign = "top" | "center" | "baseline" | "bottom"
type Align = "left" | "center" | "right"

const _vertical_align_lookup: {[key in Side]: {[key in Orient]: VerticalAlign}} = {
  above: {
    parallel: "bottom",
    normal: "center",
    horizontal: "bottom",
    vertical: "center",
  },
  below: {
    parallel: "top",
    normal: "center",
    horizontal: "top",
    vertical: "center",
  },
  left: {
    parallel: "bottom",
    normal: "center",
    horizontal: "center",
    vertical: "center",
  },
  right: {
    parallel: "bottom",
    normal: "center",
    horizontal: "center",
    vertical: "center",
  },
}

const _align_lookup: {[key in Side]: {[key in Orient]: Align}} = {
  above: {
    parallel: "center",
    normal: "left",
    horizontal: "center",
    vertical: "left",
  },
  below: {
    parallel: "center",
    normal: "left",
    horizontal: "center",
    vertical: "left",
  },
  left: {
    parallel: "center",
    normal: "right",
    horizontal: "right",
    vertical: "center",
  },
  right: {
    parallel: "center",
    normal: "left",
    horizontal: "left",
    vertical: "center",
  },
}

const _align_lookup_negative: {[key in Side]: Align} = {
  above: "right",
  below: "left",
  left: "right",
  right: "left",
}

const _align_lookup_positive: {[key in Side]: Align} = {
  above: "left",
  below: "right",
  left: "right",
  right: "left",
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

  get_label_text_heuristics(orient: Orient | number): {vertical_align: VerticalAlign, align: Align} {
    const {side} = this

    if (isString(orient)) {
      return {
        vertical_align: _vertical_align_lookup[side][orient],
        align: _align_lookup[side][orient],
      }
    } else {
      return {
        vertical_align: "center",
        align: (orient < 0 ? _align_lookup_negative : _align_lookup_positive)[side],
      }
    }
  }

  get_label_angle_heuristic(orient: Orient | number): number {
    if (isString(orient))
      return _angle_lookup[this.side][orient]
    else
      return -orient
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
