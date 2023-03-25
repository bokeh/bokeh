export class Settings {
  private _dev = false
  private _wireframe = false
  private _force_webgl = false

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

  set force_webgl(force_webgl: boolean) {
    this._force_webgl = force_webgl
  }

  get force_webgl(): boolean {
    return this._force_webgl
  }
}

export const settings = new Settings()
