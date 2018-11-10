declare interface HTMLCanvasElement {
  msToBlob(): Blob
}

declare function clearImmediate(handle: number): void
declare function setImmediate(handler: (...args: any[]) => void): number
declare function setImmediate(handler: any, ...args: any[]): number
