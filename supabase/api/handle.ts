import { getQuery, readBody } from 'h3'

import type {
  ApiContext,
  ApiHandlerResult,
  Json,
} from '../../../../nuxt/server/api/_types'
import { formatRowsResponseTimestamps } from '../../../../nuxt/server/api/format_timestamptz_response'

function categoryPrefixFromKey(key: string): string {
  const i = key.indexOf('-')
  return i === -1 ? key : key.slice(0, i)
}

function sanitizeCategoryFilter(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120)
}

export async function handleLanguagesApi(
  ctx: ApiContext
): Promise<ApiHandlerResult> {
  const { segments, method, supabase, ok, event } = ctx
  if (segments[0] !== 'translations') return { handled: false }

  /** GET /translations/categories/:locale — grupy po prefiksie klucza przed pierwszym `-`. */
  if (method === 'GET' && segments[1] === 'categories' && segments[2]) {
    const locale = decodeURIComponent(String(segments[2]))
    const { data, error } = await supabase
      .from('translations')
      .select('key')
      .eq('locale', locale)
    if (error)
      return { handled: true, status: 500, body: { error: error.message } }
    const counts = new Map<string, number>()
    for (const row of data ?? []) {
      const key = String((row as { key?: string }).key ?? '')
      if (!key) continue
      const cat = categoryPrefixFromKey(key)
      counts.set(cat, (counts.get(cat) ?? 0) + 1)
    }
    const list = [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
    return { handled: true, body: ok(list) }
  }

  /** GET /translations/locale/:locale — pełna lista dla i18n (SSR). */
  if (segments[1] === 'locale' && segments[2] && method === 'GET') {
    const locale = decodeURIComponent(String(segments[2]))
    const pageSize = 1000
    const rows: Record<string, unknown>[] = []
    let from = 0

    while (true) {
      const to = from + pageSize - 1
      const { data, error } = await supabase
        .from('translations')
        .select('*')
        .eq('locale', locale)
        .order('id', { ascending: true })
        .range(from, to)
      if (error) {
        return { handled: true, status: 500, body: { error: error.message } }
      }
      const chunk = (data ?? []) as Record<string, unknown>[]
      if (chunk.length === 0) break
      rows.push(...chunk)
      if (chunk.length < pageSize) break
      from += pageSize
    }

    return { handled: true, body: ok(rows) }
  }

  /** PUT|POST /translations/batch */
  if (segments[1] === 'batch' && (method === 'PUT' || method === 'POST')) {
    const body = (await readBody(ctx.event)) as Json
    const rows = Array.isArray(body.items) ? body.items : []
    const { data, error } = await supabase
      .from('translations')
      .upsert(rows, { onConflict: 'id' })
      .select('*')
    if (error)
      return { handled: true, status: 400, body: { error: error.message } }
    return { handled: true, body: ok(data || []) }
  }

  /** PUT|PATCH /translations/:id — pojedyncze pole `value` (panel tłumaczeń). */
  if (
    (method === 'PUT' || method === 'PATCH') &&
    segments.length === 2 &&
    segments[1] &&
    /^\d+$/.test(String(segments[1]))
  ) {
    const id = Number(segments[1])
    const body = (await readBody(ctx.event)) as Json
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (
      body &&
      typeof body === 'object' &&
      !Array.isArray(body) &&
      'value' in body
    )
      patch.value = (body as Record<string, unknown>).value

    const { data, error } = await supabase
      .from('translations')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle()
    if (error)
      return { handled: true, status: 500, body: { error: error.message } }
    if (!data)
      return {
        handled: true,
        status: 404,
        body: { error: 'Translation not found' },
      }
    return { handled: true, body: ok(formatRowsResponseTimestamps([data])[0]) }
  }

  /** DELETE /translations/:id */
  if (
    method === 'DELETE' &&
    segments.length === 2 &&
    segments[1] &&
    /^\d+$/.test(String(segments[1]))
  ) {
    const id = Number(segments[1])
    const { error } = await supabase.from('translations').delete().eq('id', id)
    if (error)
      return { handled: true, status: 500, body: { error: error.message } }
    return { handled: true, body: ok({ message: 'Deleted' }) }
  }

  /** GET /translations?locale=&page=&per_page=&category=&search= */
  if (method === 'GET' && segments.length === 1) {
    const query = getQuery(event)
    const locale =
      String(query.locale ?? 'en')
        .trim()
        .slice(0, 16) || 'en'
    const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1)
    const perPageRaw = parseInt(String(query.per_page ?? '100'), 10) || 100
    const perPage = Math.min(200, Math.max(1, perPageRaw))
    const category = sanitizeCategoryFilter(String(query.category ?? '').trim())
    const search = String(query.search ?? '')
      .trim()
      .slice(0, 200)

    let q = supabase
      .from('translations')
      .select('*', { count: 'exact' })
      .eq('locale', locale)

    if (category) {
      q = q.or(`key.eq.${category},key.ilike.${category}-%`)
    }

    if (search) {
      const esc = search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
      q = q.or(`key.ilike.%${esc}%,value.ilike.%${esc}%`)
    }

    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const { data, error, count } = await q
      .order('key', { ascending: true })
      .range(from, to)

    if (error)
      return { handled: true, status: 500, body: { error: error.message } }

    const total = count ?? 0
    const lastPage = Math.max(1, Math.ceil(total / perPage))
    const rows = formatRowsResponseTimestamps((data ?? []) as unknown[])

    return {
      handled: true,
      body: ok({
        data: rows,
        current_page: page,
        last_page: lastPage,
        total,
      }),
    }
  }

  return { handled: true, status: 405, body: { error: 'Method not allowed' } }
}
