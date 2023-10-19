import {isFunction} from "core/util/types"

type Fn<Obj, Args extends unknown[], Ret = void> = (obj: Obj, ...args: Args) => Ret

export type Callable<Obj, Args extends unknown[], Ret = void> = Fn<Obj, Args, Ret> | Fn<Obj, Args, Promise<Ret>>
export type Executable<Obj, Args extends unknown[], Ret = void> = {execute: Callable<Obj, Args, Ret>}

export type CallbackLike<Obj, Args extends unknown[], Ret = void> = Executable<Obj, Args, Ret> | Callable<Obj, Args, Ret>
export type ExecutableOf<T extends CallbackLike<any, any, any>> = T extends Function ? never : T

export type CallbackLike0<Obj, Ret = void> = CallbackLike<Obj, [], Ret>
export type CallbackLike1<Obj, Arg, Ret = void> = CallbackLike<Obj, [Arg], Ret>

export function execute<Obj, Args extends unknown[], Ret>(cb: CallbackLike<Obj, Args, Ret>, obj: Obj, ...args: Args): Ret | Promise<Ret> {
  if (isFunction(cb)) {
    return cb(obj, ...args)
  } else {
    return cb.execute(obj, ...args)
  }
}
