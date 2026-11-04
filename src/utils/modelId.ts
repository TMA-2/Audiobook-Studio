/**
 * Returns the model id string from `project.settings.model`, which project files store as a
 * ModelOption object (`{ id, name, description }`) but older code paths may hold as a plain string.
 * @param model A ModelOption object or a model id string.
 */
export function resolveModelId(model: { id: string } | string): string {
  return typeof model === 'string' ? model : model.id;
}
