// Based on https://github.com/phosphorjs/phosphor/blob/master/packages/signaling/src/index.ts

import {Constructor} from "./class"
import {defer} from "./util/callback"
import {find, removeBy} from "./util/array"

export type Slot<Args, Sender extends object> = ((args: Args, sender: Sender) => void) | ((args: Args) => void) | (() => void)

export class Signal<Args, Sender extends object> {

  constructor(readonly sender: Sender, readonly name: string) {}

  connect(slot: Slot<Args, Sender>, context: object | null = null): boolean {
    if (!receiversForSender.has(this.sender)) {
      receiversForSender.set(this.sender, [])
    }

    const receivers = receiversForSender.get(this.sender)!

    if (findConnection(receivers, this, slot, context) != null) {
      return false
    }

    const receiver = context || slot

    if (!sendersForReceiver.has(receiver)) {
      sendersForReceiver.set(receiver, [])
    }

    const senders = sendersForReceiver.get(receiver)!

    const connection = {signal: this, slot, context}
    receivers.push(connection)
    senders.push(connection)

    return true
  }

  disconnect(slot: Slot<Args, Sender>, context: object | null = null): boolean {
    const receivers = receiversForSender.get(this.sender)
    if (receivers == null || receivers.length === 0) {
      return false
    }

    const connection = findConnection(receivers, this, slot, context)
    if (connection == null) {
      return false
    }

    const receiver = context || slot
    const senders = sendersForReceiver.get(receiver)!

    connection.signal = null
    scheduleCleanup(receivers)
    scheduleCleanup(senders)

    return true
  }

  emit(args: Args): void {
    const receivers = receiversForSender.get(this.sender) || []

    for (const {signal, slot, context} of receivers) {
      if (signal === this) {
        slot.call(context, args, this.sender)
      }
    }
  }
}

export class Signal0<Sender extends object> extends Signal<void, Sender> {
  emit(): void {
    super.emit(undefined)
  }
}

export namespace Signal {
  export function disconnectBetween(sender: object, receiver: object): void {
    const receivers = receiversForSender.get(sender)
    if (receivers == null || receivers.length === 0)
      return

    const senders = sendersForReceiver.get(receiver)
    if (senders == null || senders.length === 0)
      return

    for (const connection of senders) {
      if (connection.signal == null)
        return

      if (connection.signal.sender === sender)
        connection.signal = null
    }

    scheduleCleanup(receivers)
    scheduleCleanup(senders)
  }

  export function disconnectSender(sender: object): void {
    const receivers = receiversForSender.get(sender)
    if (receivers == null || receivers.length === 0)
      return

    for (const connection of receivers) {
      if (connection.signal == null)
        return

      const receiver = connection.context || connection.slot
      connection.signal = null
      scheduleCleanup(sendersForReceiver.get(receiver)!)
    }

    scheduleCleanup(receivers)
  }

  export function disconnectReceiver(receiver: object): void {
    const senders = sendersForReceiver.get(receiver)
    if (senders == null || senders.length === 0)
      return

    for (const connection of senders) {
      if (connection.signal == null)
        return

      const sender = connection.signal.sender
      connection.signal = null
      scheduleCleanup(receiversForSender.get(sender)!)
    }

    scheduleCleanup(senders)
  }

  export function disconnectAll(obj: object): void {
    const receivers = receiversForSender.get(obj)
    if (receivers != null && receivers.length !== 0) {
      for (const connection of receivers) {
        connection.signal = null
      }
      scheduleCleanup(receivers)
    }

    const senders = sendersForReceiver.get(obj)
    if (senders != null && senders.length !== 0) {
      for (const connection of senders) {
        connection.signal = null
      }
      scheduleCleanup(senders)
    }
  }
}

export interface ISignalable {
  connect<Args, Sender extends object>(signal: Signal<Args, Sender>, slot: Slot<Args, Sender>): boolean
}

export function Signalable<C extends Constructor>(Base?: C) {
  // XXX: `class Foo extends Signalable(Object)` doesn't work (compiles, but fails at runtime), so
  // we have to do this to allow signalable classes without an explict base class.
  if (Base != null) {
    return class extends Base implements ISignalable {
      connect<Args, Sender extends object>(signal: Signal<Args, Sender>, slot: Slot<Args, Sender>): boolean {
        return signal.connect(slot, this)
      }
    }
  } else {
    return class implements ISignalable {
      connect<Args, Sender extends object>(signal: Signal<Args, Sender>, slot: Slot<Args, Sender>): boolean {
        return signal.connect(slot, this)
      }
    }
  }
}

export namespace _Signalable {
  export function connect<Args, Sender extends object>(this: object, signal: Signal<Args, Sender>, slot: Slot<Args, Sender>): boolean {
    return signal.connect(slot, this)
  }
}

interface Connection {
  signal: Signal<any, object> | null
  readonly slot: Slot<any, object>
  readonly context: object | null
}

const receiversForSender = new WeakMap<object, Connection[]>()
const sendersForReceiver = new WeakMap<object, Connection[]>()

function findConnection(conns: Connection[], signal: Signal<any, any>, slot: Slot<any, any>, context: any): Connection | undefined {
  return find(conns, conn => conn.signal === signal && conn.slot === slot && conn.context === context)
}

const dirtySet = new Set<Connection[]>()

function scheduleCleanup(connections: Connection[]): void {
  if (dirtySet.size === 0) {
    defer(cleanupDirtySet);
  }
  dirtySet.add(connections);
}

function cleanupDirtySet(): void {
  dirtySet.forEach((connections) => {
    removeBy(connections, (connection) => connection.signal == null)
  })
  dirtySet.clear()
}
