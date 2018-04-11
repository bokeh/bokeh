export class AssertionError extends Error {}

export function assert(condition: boolean | (() => boolean), message?: string): void {
  if (condition === true || (condition !== false && condition()))
    return

  throw new AssertionError(message || "Assertion failed")
}
