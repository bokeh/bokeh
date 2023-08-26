export {describe, it, display, fig} from "../framework"

import type {SinonSpy, SinonStub} from "sinon"

export function restorable<T extends SinonSpy | SinonStub>(spy: T): T & Disposable {
  const disposable_spy = spy as T & Disposable
  disposable_spy[Symbol.dispose] = () => spy.restore()
  return disposable_spy
}
