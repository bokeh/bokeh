import {logger} from "core/logging"

export type Image = HTMLImageElement

export type ImageLoaderOptions = {
  loaded?: (image: Image) => void
  failed?: () => void
  attempts?: number
  timeout?: number
}

export class ImageLoader {
  private _image = new Image()

  promise: Promise<Image>

  constructor(url: string, options: ImageLoaderOptions = {}) {
    const {attempts = 1, timeout = 1} = options

    this.promise = new Promise((resolve, _reject) => {
      this._image.crossOrigin = "anonymous"

      let retries = 0
      this._image.onerror = () => {
        if (++retries == attempts) {
          const message = `unable to load ${url} image after ${attempts} attempts`
          logger.warn(message)

          if (this._image.crossOrigin != null) {
            logger.warn(`attempting to load ${url} without a cross origin policy`)
            this._image.crossOrigin = null
            retries = 0
          } else {
            if (options.failed != null)
              options.failed()
            return // XXX reject(new Error(message))
          }
        }

        setTimeout(() => this._image.src = url, timeout)
      }
      this._image.onload = () => {
        this._finished = true
        if (options.loaded != null)
          options.loaded(this._image)
        resolve(this._image)
      }
      this._image.src = url
    })
  }

  private _finished: boolean = false

  get finished(): boolean {
    return this._finished
  }

  get image(): Image {
    return this._image
  }
}
