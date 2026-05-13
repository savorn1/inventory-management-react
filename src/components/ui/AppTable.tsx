import type { ReactNode } from 'react'

interface Props {
  head: ReactNode
  body: ReactNode
}

export function AppTable({ head, body }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-max">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {head}
            </tr>
          </thead>
          <tbody>{body}</tbody>
        </table>
      </div>
    </div>
  )
}
