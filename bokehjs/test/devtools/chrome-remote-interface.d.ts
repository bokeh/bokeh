declare module "chrome-remote-interface" {
  import {Protocol} from "devtools-protocol/types/protocol"
  import {ProtocolProxyApi} from "devtools-protocol/types/protocol-proxy-api"

  type DevTools = ProtocolProxyApi.ProtocolApi & {
    close(): Promise<void>

    Page: ProtocolProxyApi.PageApi & {
      loadEventFired(): Promise<Protocol.Page.LoadEventFiredEvent>
    }

    Network: ProtocolProxyApi.NetworkApi & {
      enable(params?: Protocol.Network.EnableRequest): Promise<void>
      requestWillBeSent(listener: (params: Protocol.Network.RequestWillBeSentEvent) => void): void
    }

    Runtime: ProtocolProxyApi.RuntimeApi & {
      consoleAPICalled(listener: (params: Protocol.Runtime.ConsoleAPICalledEvent) => void): void
      exceptionThrown(listener: (params: Protocol.Runtime.ExceptionThrownEvent) => void): void
    }

    Log: ProtocolProxyApi.LogApi & {
      entryAdded(listener: (params: Protocol.Log.EntryAddedEvent) => void): void
    }
  }

  type VersionInfo = {
    Browser: string
    'Protocol-Version': string
    'User-Agent': string
    'V8-Version': string
    'WebKit-Version': string
    webSocketDebuggerUrl: string
  }

  type Options = {
    host?: string
    port?: number
  }

  function CDP(options: Options, callback: (client: DevTools) => void): NodeJS.EventEmitter
  function CDP(options: Options): Promise<DevTools>

  function CDP(callback: (client: DevTools) => void): NodeJS.EventEmitter
  function CDP(): Promise<DevTools>

  namespace CDP {
    function Version(options?: Options): Promise<VersionInfo>
  }

  export = CDP
}
