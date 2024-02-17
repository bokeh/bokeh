export class AssertionError extends Error {}
export class UnreachableError extends Error {}

export function assert(condition: boolean | (() => boolean), message?: string): asserts condition {
  if (condition === true || (condition !== false && condition())) {
    return
  }

  throw new AssertionError(message ?? "Assertion failed")
}

declare const DEBUG: boolean | undefined

export function assert_debug(condition: boolean | (() => boolean), message?: string): asserts condition {
  if (typeof DEBUG !== "undefined" && DEBUG) {
    assert(condition, message)
  }
}

export function unreachable(msg?: string): never {
  const suffix = msg != null ? `: ${msg}` : ""
  throw new UnreachableError(`unreachable code${suffix}`)
}
