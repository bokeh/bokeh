import {logger} from "core/logging"

export type Image = HTMLImageElement

export type ImageHandlers = {
  loaded?: (image: Image) => void
  failed?: () => void
}

export type LoaderOptions = {
  attempts?: number
  timeout?: number
}

export async function load_image(url: string, options?: LoaderOptions): Promise<Image> {
  return new ImageLoader(url, options).promise
}

export class ImageLoader {
  readonly image = new Image()

  promise: Promise<Image>

  constructor(src: string | ArrayBuffer, config: ImageHandlers & LoaderOptions = {}) {
    const {attempts = 1, timeout = 1} = config

    const url = (() => {
      if (src instanceof ArrayBuffer) {
        const blob = new Blob([src], {type: "image/png"}) // TODO mime
        return URL.createObjectURL(blob) // TODO revoke
      } else {
        return src
      }
    })()

    this.promise = new Promise((resolve, _reject) => {
      this.image.crossOrigin = "anonymous"

      let retries = 0
      this.image.onerror = () => {
        if (++retries == attempts) {
          const message = `unable to load ${url} image after ${attempts} attempts`
          logger.warn(message)

          if (this.image.crossOrigin != null) {
            logger.warn(`attempting to load ${url} without a cross origin policy`)
            this.image.crossOrigin = null
            retries = 0
          } else {
            config.failed?.()
            return // XXX reject(new Error(message))
          }
        }

        setTimeout(() => this.image.src = url, timeout)
      }
      this.image.onload = () => {
        this._finished = true
        config.loaded?.(this.image)
        resolve(this.image)
      }
      this.image.src = url
    })
  }

  private _finished: boolean = false

  get finished(): boolean {
    return this._finished
  }
}
