declare interface CommMessage {
  buffers: DataView[]
  content: {
    data: string
  }
}

declare interface Comm {
  messages: AsyncGenerator<CommMessage>
}

declare namespace google.colab {
  export const kernel: {
    comms: {
      registerTarget(target: string, fn: (comm: Comm) => void): void
    }
  }
}
