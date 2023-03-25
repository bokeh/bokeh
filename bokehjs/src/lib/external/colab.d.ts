declare namespace google.colab {
  declare export type CommMessage = {
    buffers?: ArrayBuffer[]
    data: string
  }

  declare export type Comm = {
    messages: AsyncGenerator<CommMessage>
  }

  declare export type Kernel = {
    comms: {
      registerTarget(target: string, fn: (comm: Comm) => void): void
    }
  }

  declare export const kernel: Kernel | undefined
}
