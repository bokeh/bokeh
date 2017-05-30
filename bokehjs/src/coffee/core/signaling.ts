// Based on https://github.com/phosphorjs/phosphor/blob/master/packages/signaling/src/index.ts

import {logger} from "./logging"
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

export interface Signalable {
  connect<Args, Sender extends object>(this: object, signal: Signal<Args, Sender>, slot: Slot<Args, Sender>): boolean
  listenTo<Args, Sender extends object>(this: object, event: string, slot: Slot<Args, Sender>): boolean
  trigger<Args>(this: object, event: string, args: Args): void
}

export namespace Signalable {
  export function connect<Args, Sender extends object>(this: object, signal: Signal<Args, Sender>, slot: Slot<Args, Sender>): boolean {
    return signal.connect(slot, this)
  }

  export function listenTo<Args, Sender extends object>(this: object, event: string, slot: Slot<Args, Sender>): boolean {
    logger.warn("obj.listenTo('event', handler) is deprecated, use obj.connect(signal, slot)")
    const [name, attr] = event.split(":")
    const signal = (attr == null) ? (this as any)[name] : (this as any).properties[attr][name]
    return (signal as Signal<Args, Sender>).connect(slot, this)
  }

  export function trigger<Args>(this: object, event: string, args: Args): void {
    logger.warn("obj.trigger('event', args) is deprecated, use signal.emit(args)")
    const [name, attr] = event.split(":")
    const signal = (attr == null) ? (this as any)[name] : (this as any).properties[attr][name]
    return (signal as Signal<Args, any>).emit(args)
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
