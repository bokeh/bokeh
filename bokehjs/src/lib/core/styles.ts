import {sum} from "core/util/array"
import {isString} from "core/util/types"
import type {LRTB, Corners} from "core/util/bbox"
import {resolve_line_dash} from "core/visuals/line"
import type {Fill, Hatch, Line, Text} from "./visuals"
import type {InlineStyleSheet} from "./dom"
import type {Side} from "./enums"

export function apply_text(style: InlineStyleSheet, selector: string, text: Text): void {
  const text_styles = text.computed_values()
  style.append(`
  ${selector} {
    font: ${text_styles.font};
    color: ${text_styles.color};
    -webkit-text-stroke: ${text_styles.outline_width}px ${text_styles.outline_color};
  }
  `)
}

export function apply_rotation(style: InlineStyleSheet, selector: string, side: Side): void {
  // can't simply use `rotate`, because rotation doesn't affect layout
  const {writing_mode, rotate} = (() => {
    switch (side) {
      case "above": return {writing_mode: "horizontal-tb", rotate: 0}
      case "below": return {writing_mode: "horizontal-tb", rotate: 0}
      case "left":  return {writing_mode: "vertical-rl",   rotate: 180}
      case "right": return {writing_mode: "vertical-rl",   rotate: 0}
    }
  })()
  style.append(`
  ${selector} {
    writing-mode: ${writing_mode};
    rotate: ${rotate}deg;
  }
  `)
}

export function apply_padding(style: InlineStyleSheet, selector: string, padding: LRTB<number>): void {
  style.append(`
  ${selector} {
    padding-left: ${padding.left}px;
    padding-right: ${padding.right}px;
    padding-top: ${padding.top}px;
    padding-bottom: ${padding.bottom}px;
  }
  `)
}

export function apply_border_radius(style: InlineStyleSheet, selector: string, border_radius: Corners<number>): void {
  style.append(`
  ${selector} {
    border-top-left-radius: ${border_radius.top_left}px;
    border-top-right-radius: ${border_radius.top_right}px;
    border-bottom-right-radius: ${border_radius.bottom_right}px;
    border-bottom-left-radius: ${border_radius.bottom_left}px;
  }
  `)
}

export type BoxVisuals = {
  background_fill: Fill
  background_hatch: Hatch
  border_line?: Line
}

export function apply_box_styles(style: InlineStyleSheet, selector: string, visuals: BoxVisuals): void {
  if (visuals.background_fill.doit) {
    const {color} = visuals.background_fill.computed_values()
    style.append(`
    ${selector} {
      --background-color: ${color};
      background-color: ${color};
    }
    `)
  }

  if (visuals.background_hatch.doit) {
    const {scale, pattern} = visuals.background_hatch.computed_values()
    style.append(`
    ${selector} {
      --background-hatch: url(${pattern});
      --background-hatch-scale: ${scale}px;
      background-image: var(--background-hatch);
      background-size: var(--background-hatch-scale);
    }
    `)
  }

  if (visuals.border_line != null && visuals.border_line.doit) {
    const {color, width, dash: raw_dash} = visuals.border_line.computed_values()
    const invalid_css_border_style = ["dotdash", "dashdot"]
    let dash = raw_dash
    // Invalid string dash to use CSS/border-style approach
    if (isString(dash) && invalid_css_border_style.includes(dash)) {
      // Convert to array representation
      dash = resolve_line_dash(dash)
    }
    // Non-empty dash array case
    if (!isString(dash) && dash.length > 0) {
      // Make dash array even
      if (dash.length % 2 !== 0) {
        dash = dash.concat(dash)
      }
      // Compute extra patterns rules
      let extra_patterns = ""
      for (let index = 0; index < dash.length; index++) {
        if (index !== 0 && index % 2 === 0) {
          extra_patterns += `,
          linear-gradient(to right, ${color} ${dash[index]}px, transparent ${dash[index]}px) ${sum(dash.slice(0, index))}px top/var(--border-line-full-length) ${width}px repeat-x,
          linear-gradient(to right, ${color} ${dash[index]}px, transparent ${dash[index]}px) ${sum(dash.slice(0, index))}px bottom/var(--border-line-full-length) ${width}px repeat-x,
          linear-gradient(to bottom, ${color} ${dash[index]}px, transparent ${dash[index]}px) right ${sum(dash.slice(0, index))}px/${width}px var(--border-line-full-length) repeat-y,
          linear-gradient(to bottom, ${color} ${dash[index]}px, transparent ${dash[index]}px) left ${sum(dash.slice(0, index))}px/${width}px var(--border-line-full-length) repeat-y`
        }
      }

      style.append(`
      ${selector} {
        --border-color: ${color};
        --border-line-full-length: ${sum(dash)}px;

        background:
            linear-gradient(to right, ${color} ${dash[0]}px, transparent ${dash[0]}px) left top/var(--border-line-full-length) ${width}px repeat-x,
            linear-gradient(to right, ${color} ${dash[0]}px, transparent ${dash[0]}px) left bottom/var(--border-line-full-length) ${width}px repeat-x,
            linear-gradient(to bottom, ${color} ${dash[0]}px, transparent ${dash[0]}px) right top/${width}px var(--border-line-full-length) repeat-y,
            linear-gradient(to bottom, ${color} ${dash[0]}px, transparent ${dash[0]}px) left top/${width}px var(--border-line-full-length) repeat-y ${extra_patterns.length > 0 ? `${extra_patterns}` : "" },
            ${visuals.background_hatch.doit ? "var(--background-hatch) left top/var(--background-hatch-scale) repeat," : ""} var(--background-color, --inverted-color);
      }
      `)
    } else {
      // Empty dash array (solid border) or border-style supported string case
      style.append(`
      ${selector} {
        border-color: ${color};
        border-width: ${width}px;
        border-style: ${isString(dash) ? `${dash}` : "solid"};
      }
      `)
    }
  }
}
