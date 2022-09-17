export function pyify_version(version: string) {
  return version.replace(/-(dev|rc)\./, ".$1")
}
