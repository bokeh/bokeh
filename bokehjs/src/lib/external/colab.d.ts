declare interface CommMessage {
  buffers: DataView[]
  content: {
    data: string
  }
}

declare interface Comm {
  messages: AsyncGenerator<CommMessage>
}

declare interface Kernel {
  comms: {
    register_target: (target: string, fn: (comm: Comm) => void) => void
  }
}

declare interface googlecolab {
  colab: {
    kernel: Kernel | undefined
  }
}

declare const googlecolab: googlecolab | undefined
