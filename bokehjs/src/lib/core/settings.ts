export class Settings {
  private _dev = false
  private _wireframe = false

  set dev(dev: boolean) {
    this._dev = dev
  }

  get dev(): boolean {
    return this._dev
  }

  set wireframe(wireframe: boolean) {
    this._wireframe = wireframe
  }

  get wireframe(): boolean {
    return this._wireframe
  }
}

export const settings = new Settings()
