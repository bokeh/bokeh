export {index} from "./standalone"
export {embed_items_notebook, kernels} from "./legacy_notebook"
export {create_notebook_patch_receiver, NotebookPatchError} from "./notebook"
export type {NotebookPatch} from "./notebook"
export {
  ArtifactError, compute_embed_artifact_fingerprint, embed_artifact_schema,
  is_embed_artifact, validate_embed_artifact,
} from "./artifact"
export type {
  ArtifactErrorPhase, ArtifactErrorSource, ArtifactRoot, EmbedArtifact,
  ServerArtifactSource, StandaloneArtifactSource,
} from "./artifact"
export {ResourceError, ResourceLoader, resource_loader} from "./resources"
export type {
  ExtensionRequirement, ResourceAsset, ResourceComponent, ResourcePolicy, ResourcePolicyMode, ResourceRequirements,
} from "./resources"

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
