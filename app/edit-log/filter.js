import { mergeByCorrelationId } from './merge.js'

/**
 * @param {ReadonlyArray<{ source?: string }>} entries
 * @param {'all' | 'feature' | 'intent' | 'mutation-debug'} mode
 */
export function filterEntries(entries, mode = 'all') {
  if (mode === 'all') return entries
  if (mode === 'feature' || mode === 'intent') {
    return entries.filter((e) => e.source === 'feature')
  }
  if (mode === 'mutation-debug') {
    return entries.filter((e) => e.source === 'mutation')
  }
  return entries
}

/**
 * correlated 병합 후 feature 우선 — 동일 correlation의 orphan mutation 제거
 * @param {ReadonlyArray<import('./entry.js').createEntry extends (...args: any) => infer R ? R : never>} entries
 */
export function mergeIntent(entries) {
  const merged = mergeByCorrelationId(entries)
  return merged.filter((e) => {
    if (e.source === 'feature') return true
    if (e.sources?.includes('feature')) return false
    return true
  })
}
