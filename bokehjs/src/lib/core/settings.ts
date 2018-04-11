export class Settings {
  private _dev = false

  set dev(dev: boolean) {
    this._dev = dev
  }

  get dev(): boolean {
    return this._dev
  }
}

export const settings = new Settings()
