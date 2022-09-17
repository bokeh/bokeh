export function pyify_version(version: string): string {
  return version.replace(/-(dev|rc)\./, ".$1")
}
