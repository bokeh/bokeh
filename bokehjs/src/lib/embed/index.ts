export {add_document_standalone, mount_document_standalone, StandaloneMount, index} from "./standalone"
export type {StandaloneMountOptions} from "./standalone"
export {add_document_from_session} from "./server"
export {embed_items_notebook, kernels} from "./notebook"
export {
  ArtifactError, compute_embed_artifact_fingerprint, embed_artifact_schema,
  is_embed_artifact, validate_embed_artifact,
} from "./artifact"
export type {ArtifactRoot, EmbedArtifact, ServerArtifactSource, StandaloneArtifactSource} from "./artifact"
export {ResourceError, ResourceLoader, resource_loader} from "./resources"
export type {ResourceAsset, ResourceComponent, ResourcePolicy, ResourceRequirements} from "./resources"

export class EmbedMigrationError extends Error {
  override readonly name = "BokehEmbedMigrationError"
}

export async function embed_item(..._args: unknown[]): Promise<never> {
  throw new EmbedMigrationError(
    "Bokeh.embed.embed_item() and JsonItem were removed in Bokeh 4.0. " +
    "Serve an EmbedArtifact and call Bokeh.mount(artifact, {targets: {root: element}}).",
  )
}

export async function embed_items(..._args: unknown[]): Promise<never> {
  throw new EmbedMigrationError(
    "Bokeh.embed.embed_items() and RenderItem were removed in Bokeh 4.0. " +
    "Compile a versioned EmbedArtifact and mount it with keyed caller-owned targets.",
  )
}
