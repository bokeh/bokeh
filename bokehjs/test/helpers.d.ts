declare interface Function {
  name: string
}

declare interface CommMessage {
  buffers: DataView[]
  content: {
    data: string
  }
}

declare interface Comm {
  target_name: string
  on_msg: (msg: CommMessage) => void
  onMsg: (comm_msg: CommMessage) => void
}

declare interface Kernel {
  comm_manager: {
    register_target: (target: string, fn: (comm: Comm) => void) => void,
  },
  registerCommTarget: (target: string, fn: (comm: Comm) => void) => void,
}
