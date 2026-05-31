import type { JoplinResource } from '../client/types.js';
import type { JoplinMcpContext } from '../context.js';

type ResourceLike = Pick<
  JoplinResource,
  'mime' | 'file_extension' | 'title' | 'filename'
>;

const IMAGE_EXTENSION_PATTERN = /\.(png|jpg|jpeg|gif|webp)$/i;
const IMAGE_EXTENSION_ONLY_PATTERN = /^(png|jpg|jpeg|gif|webp)$/i;
const MARKDOWN_IMAGE_RESOURCE_PATTERN = /!\[.*?\]\(:\/([a-f0-9]{32})\)/g;
const HTML_IMAGE_RESOURCE_PATTERN = /<img[^>]+src=":\/([a-f0-9]{32})"/g;

export const JOPLIN_IMAGE_MIME_TYPES = new Set<string>([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
]);

const extensionToMime: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

export const formatSupportedImageTypes = (): string =>
  'image/png, image/jpeg, image/gif, image/webp';

export const mimeTypeFromFilePath = (filePath: string): string | null => {
  const ext = extractExtension(filePath);
  return ext ? extensionToMime[ext] || null : null;
};

export const isSupportedImageResource = (resource: ResourceLike): boolean => {
  if (resource.mime && JOPLIN_IMAGE_MIME_TYPES.has(resource.mime)) {
    return true;
  }

  if (
    resource.file_extension &&
    IMAGE_EXTENSION_ONLY_PATTERN.test(resource.file_extension)
  ) {
    return true;
  }

  if (resource.title && IMAGE_EXTENSION_PATTERN.test(resource.title)) {
    return true;
  }

  if (resource.filename && IMAGE_EXTENSION_PATTERN.test(resource.filename)) {
    return true;
  }

  return false;
};

export const normalizeImageMimeType = (mime: string): string =>
  mime === 'image/jpg' ? 'image/jpeg' : mime;

const extractExtension = (str: string): string | null => {
  const match = str.match(/\.(\w+)$/);
  return match ? match[1].toLowerCase() : null;
};

export const inferImageMimeType = (resource: ResourceLike): string | null => {
  if (resource.mime) {
    return normalizeImageMimeType(resource.mime);
  }

  const ext =
    resource.file_extension ||
    extractExtension(resource.title ?? '') ||
    extractExtension(resource.filename ?? '');

  if (ext) {
    return extensionToMime[ext] || null;
  }

  return null;
};

export const extractResourceIdsFromNoteBody = (body: string): string[] => {
  const resourceIds = new Set<string>();

  for (const match of body.matchAll(MARKDOWN_IMAGE_RESOURCE_PATTERN)) {
    resourceIds.add(match[1]);
  }

  for (const match of body.matchAll(HTML_IMAGE_RESOURCE_PATTERN)) {
    resourceIds.add(match[1]);
  }

  return [...resourceIds];
};

export const collectNoteImages = async (
  context: JoplinMcpContext,
  noteId: string,
): Promise<JoplinResource[]> => {
  let apiResources: JoplinResource[] = [];

  try {
    apiResources = (await context.client.getNoteResources(noteId)).filter(
      isSupportedImageResource,
    );
  } catch {
    apiResources = [];
  }

  const imagesById = new Map(
    apiResources.map((resource) => [resource.id, resource]),
  );
  const note = await context.client.getNote(noteId, 'id,body');
  const resourceIds = extractResourceIdsFromNoteBody(note.body ?? '');
  const missingResourceIds = resourceIds.filter(
    (resourceId) => !imagesById.has(resourceId),
  );

  const bodyResources = await Promise.allSettled(
    missingResourceIds.map((resourceId) =>
      context.client.getResource(resourceId),
    ),
  );

  for (const result of bodyResources) {
    if (
      result.status === 'fulfilled' &&
      isSupportedImageResource(result.value)
    ) {
      imagesById.set(result.value.id, result.value);
    }
  }

  return [...imagesById.values()];
};
