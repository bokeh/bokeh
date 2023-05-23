import type {StepMode} from "core/enums"

export function flip_step_mode(mode: StepMode): StepMode {
  switch (mode) {
    case "before":
      return "after"
    case "after":
      return "before"
    case "center":
      return "center"
  }
}
