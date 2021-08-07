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
  private _image = new Image()

  promise: Promise<Image>

  constructor(url: string, config: ImageHandlers & LoaderOptions = {}) {
    const {attempts = 1, timeout = 1} = config

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
            if (config.failed != null)
              config.failed()
            return // XXX reject(new Error(message))
          }
        }

        setTimeout(() => this._image.src = url, timeout)
      }
      this._image.onload = () => {
        this._finished = true
        if (config.loaded != null)
          config.loaded(this._image)
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
    if (this._finished)
      return this._image
    else
      throw new Error("not loaded yet")
  }
}
