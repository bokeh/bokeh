import * as gulp from "gulp"

export {log, PluginError as BuildError} from "gulp-util"

export type Fn<T> = () => T | Promise<T>

export function task<T>(name: string, deps: string[] | Fn<T>, fn?: Fn<T>): void {
  if (Array.isArray(deps))
    gulp.task(name, deps, fn)
  else
    gulp.task(name, [], deps)
}
