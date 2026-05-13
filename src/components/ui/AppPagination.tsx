const PAGE_SIZES = [10, 20, 50, 100]

interface Props {
  page: number
  totalPages: number
  totalCount: number
  size: number
  loading?: boolean
  onChange: (page: number) => void
  onSizeChange: (size: number) => void
}

export function AppPagination({ page, totalPages, totalCount, size, loading, onChange, onSizeChange }: Props) {
  if (totalCount === 0) return null

  const from = (page - 1) * size + 1
  const to   = Math.min(page * size, totalCount)

  function getPageNumbers(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      <p className="text-xs text-slate-500 shrink-0">
        Showing <span className="font-semibold text-slate-700">{from}–{to}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalCount}</span> entries
      </p>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 whitespace-nowrap">Rows</span>
          <select
            value={size}
            onChange={e => onSizeChange(Number(e.target.value))}
            className="h-8 px-2 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:border-indigo-500 cursor-pointer"
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            disabled={page <= 1 || loading}
            onClick={() => onChange(page - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400 select-none">…</span>
            ) : (
              <button
                key={p}
                disabled={loading}
                onClick={() => onChange(p as number)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold border transition-colors ${
                  p === page
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            disabled={page >= totalPages || loading}
            onClick={() => onChange(page + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
