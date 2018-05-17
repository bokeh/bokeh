import * as gulp from "gulp"

export function buildWatchTask(name: string, paths: string[]) {
  gulp.task(`${name}:watch`, gulp.series(name, () => {
    gulp.watch(paths, gulp.series(name))
  }))
}
