export class AssertionError extends Error {}
export class UnreachableError extends Error {}

export function assert(condition: boolean, message?: string): asserts condition
export function assert(condition: () => boolean, message?: string): void
export function assert(condition: boolean | (() => boolean), message?: string): void {
  if (condition === true || (condition !== false && condition())) {
    return
  }

  throw new AssertionError(message ?? "Assertion failed")
}

declare const DEBUG: boolean | undefined

export function assert_debug(condition: boolean, message?: string): asserts condition
export function assert_debug(condition: () => boolean, message?: string): void
export function assert_debug(condition: boolean | (() => boolean), message?: string): void {
  if (typeof DEBUG !== "undefined" && DEBUG === true) {
    if (typeof condition === "boolean") {
      assert(condition, message)
    } else {
      assert(condition, message)
    }
  }
}

export function unreachable(msg?: string): never {
  const suffix = msg != null ? `: ${msg}` : ""
  throw new UnreachableError(`unreachable code${suffix}`)
}
