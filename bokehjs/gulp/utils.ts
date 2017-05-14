import * as gulp from "gulp"

export function buildWatchTask(name: string, paths: string[], tasks?: string[]) {
  gulp.task(`${name}:watch`, [name], () => {
    gulp.watch(paths, tasks || [name])
  })
}
