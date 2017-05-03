// Based on https://github.com/phosphorjs/phosphor/blob/master/packages/signaling/src/index.ts

import * as WeakMap from "es6-weak-map"

import {find} from "./util/array"

export namespace Signalable {
  export function connectTo<Args, Sender extends object>(this: object, signal: Signal<Args, Sender>, slot: Slot<Args, Sender>): boolean {
    return signal.connect(slot, this)
  }
}

export type Slot<Args, Sender extends object> =
  ((args: Args, sender: Sender) => void) | ((args: Args) => void) | (() => void)

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

export class Signal<Args, Sender extends object> {

  constructor(readonly sender: Sender, readonly name: string) {
    this.sender = sender
    this.name = name
  }

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
    //scheduleCleanup(receivers)
    //scheduleCleanup(senders)

    return true
  }

  emit(args: Args): void {
    const receivers = receiversForSender.get(this.sender) || []

    for (const {signal, slot, context} of receivers) {
      if (signal === this) {
        slot.call(context, args, signal!.sender)
      }
    }
  }
}

export namespace Signal {
  /*
  export function disconnectBetween(sender: object, receiver: object): void {
  }

  export function disconnectSender(sender: object): void {
  }
  */

  export function disconnectReceiver(receiver: object): void {
    const senders = sendersForReceiver.get(receiver) || []

    for (const connection of senders) {
      if (connection.signal == null)
        return

      const sender = connection.signal.sender
      connection.signal = null

      // Cleanup the array of receivers, which is now known to exist.
      //scheduleCleanup(receiversForSender.get(sender)!)
    }

    // Schedule a cleanup of the list of senders.
    //scheduleCleanup(senders)
  }

  /*
  export function disconnectAll(obj: object): void {
  }
  */
}
