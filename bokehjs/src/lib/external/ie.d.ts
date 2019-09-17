declare interface HTMLCanvasElement {
  msToBlob(): Blob
}

declare type CanvasPixelArray = any
declare var CanvasPixelArray: any

declare function clearImmediate(handle: number): void
declare function setImmediate(handler: (...args: any[]) => void): number
declare function setImmediate(handler: any, ...args: any[]): number
