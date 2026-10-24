/**
 * Run an async mapper over items with a bounded number of concurrent workers.
 * Preserves input order in the results array.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) {
    return []
  }
  const results: R[] = new Array(items.length)
  const concurrency = Math.min(Math.max(limit, 1), items.length)
  let next = 0

  async function worker(): Promise<void> {
    while (true) {
      const index = next
      next += 1
      if (index >= items.length) {
        return
      }
      results[index] = await fn(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  return results
}
