// Based on https://github.com/phosphorjs/phosphor/blob/master/packages/signaling/src/index.ts

import {defer} from "./util/defer"
import {find, remove_by} from "./util/array"

export type Slot<Args, Sender extends object> = (args: Args, sender: Sender) => void

export class Signal<Args, Sender extends object> {

  constructor(readonly sender: Sender, readonly name: string) {}

  connect(slot: Slot<Args, Sender>, context: object | null = null): boolean {
    if (!receiversForSender.has(this.sender)) {
      receiversForSender.set(this.sender, [])
    }

    const receivers = receiversForSender.get(this.sender)!

    if (find_connection(receivers, this, slot, context) != null) {
      return false
    }

    const receiver = context ?? slot

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

    const connection = find_connection(receivers, this, slot, context)
    if (connection == null) {
      return false
    }

    const receiver = context ?? slot
    const senders = sendersForReceiver.get(receiver)!

    connection.signal = null
    schedule_cleanup(receivers)
    schedule_cleanup(senders)

    return true
  }

  emit(args: Args): void {
    const receivers = receiversForSender.get(this.sender) ?? []

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
  export function disconnect_between(sender: object, receiver: object): void {
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

    schedule_cleanup(receivers)
    schedule_cleanup(senders)
  }

  export function disconnect_sender(sender: object): void {
    const receivers = receiversForSender.get(sender)
    if (receivers == null || receivers.length === 0)
      return

    for (const connection of receivers) {
      if (connection.signal == null)
        return

      const receiver = connection.context ?? connection.slot
      connection.signal = null
      schedule_cleanup(sendersForReceiver.get(receiver)!)
    }

    schedule_cleanup(receivers)
  }

  export function disconnect_receiver(receiver: object, slot?: Slot<any, any>, except_senders?: Set<object>): void {
    const senders = sendersForReceiver.get(receiver)
    if (senders == null || senders.length === 0)
      return

    for (const connection of senders) {
      if (connection.signal == null)
        return

      if (slot != null && connection.slot != slot)
        continue

      const sender = connection.signal.sender
      if (except_senders != null && except_senders.has(sender))
        continue

      connection.signal = null
      schedule_cleanup(receiversForSender.get(sender)!)
    }

    schedule_cleanup(senders)
  }

  export function disconnect_all(obj: object): void {
    const receivers = receiversForSender.get(obj)
    if (receivers != null && receivers.length !== 0) {
      for (const connection of receivers) {
        connection.signal = null
      }
      schedule_cleanup(receivers)
    }

    const senders = sendersForReceiver.get(obj)
    if (senders != null && senders.length !== 0) {
      for (const connection of senders) {
        connection.signal = null
      }
      schedule_cleanup(senders)
    }
  }

  /** @deprecated */
  export const disconnectBetween = disconnect_between

  /** @deprecated */
  export const disconnectSender = disconnect_sender

  /** @deprecated */
  export const disconnectReceiver = disconnect_receiver

  /** @deprecated */
  export const disconnectAll = disconnect_all
}

export interface ISignalable {
  connect<Args, Sender extends object>(signal: Signal<Args, Sender>, slot: Slot<Args, Sender>): boolean
  disconnect<Args, Sender extends object>(signal: Signal<Args, Sender>, slot: Slot<Args, Sender>): boolean
}

export function Signalable() {
  return class implements ISignalable {
    connect<Args, Sender extends object>(signal: Signal<Args, Sender>, slot: Slot<Args, Sender>): boolean {
      return signal.connect(slot, this)
    }
    disconnect<Args, Sender extends object>(signal: Signal<Args, Sender>, slot: Slot<Args, Sender>): boolean {
      return signal.disconnect(slot, this)
    }
  }
}

type Connection = {
  signal: Signal<any, object> | null
  readonly slot: Slot<any, any>
  readonly context: object | null
}

const receiversForSender = new WeakMap<object, Connection[]>()
const sendersForReceiver = new WeakMap<object, Connection[]>()

function find_connection(conns: Connection[], signal: Signal<any, any>, slot: Slot<any, any>, context: any): Connection | undefined {
  return find(conns, conn => conn.signal === signal && conn.slot === slot && conn.context === context)
}

const dirty_set = new Set<Connection[]>()

function schedule_cleanup(connections: Connection[]): void {
  if (dirty_set.size === 0) {
    (async () => {
      await defer()
      cleanup_dirty_set()
    })()
  }
  dirty_set.add(connections)
}

function cleanup_dirty_set(): void {
  for (const connections of dirty_set) {
    remove_by(connections, (connection) => connection.signal == null)
  }
  dirty_set.clear()
}
