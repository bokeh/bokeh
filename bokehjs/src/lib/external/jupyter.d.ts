declare type CommMessage = {
  buffers: DataView[]
  content: {
    data: string
  }
}

declare type Comm = {
  target_name: string
  on_msg(fn: (msg: CommMessage) => void): void
  onMsg: (comm_msg: CommMessage) => void
}

declare interface Kernel {
  comm_manager: {
    register_target: (target: string, fn: (comm: Comm) => void) => void
  }
  registerCommTarget: (target: string, fn: (comm: Comm) => void) => void
}

declare interface Jupyter {
  notebook: {
    kernel: Kernel | undefined
  }
}

declare const Jupyter: Jupyter | undefined
