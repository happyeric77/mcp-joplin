import { AxiosInstance } from 'axios';

const MAX_PAGES = 50;

/**
 * Generic paginated fetch helper for Joplin API endpoints that return
 * `{ items: T[], has_more: boolean }` responses.
 */
export async function fetchAllPages<T>(
  client: AxiosInstance,
  url: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await client.get(url, {
      params: { ...params, page },
    });
    const data = response.data;
    const items = data.items || data;

    if (Array.isArray(items) && items.length > 0) {
      allItems.push(...items);
      hasMore = data.has_more === true;
      page++;
    } else {
      hasMore = false;
    }

    if (page > MAX_PAGES) {
      console.warn(
        `Reached maximum page limit (${MAX_PAGES}) while fetching ${url}`,
      );
      break;
    }
  }

  return allItems;
}
