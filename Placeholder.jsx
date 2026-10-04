import { Hammer } from 'lucide-react'
import { PageHeader } from '../components/ui'

// Halaman sementara untuk fitur yang dikerjakan di modul berikutnya.
export default function Placeholder({ item }) {
  const Icon = item.icon
  return (
    <div>
      <PageHeader title={item.label} subtitle={item.desc} />
      <div className="card flex flex-col items-center px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Icon className="h-7 w-7" />
        </div>
        <p className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <Hammer className="h-4 w-4 text-slate-400" /> Segera hadir
        </p>
        <p className="mt-1.5 max-w-sm text-sm text-slate-500">
          Fitur ini dikerjakan pada <b>Modul {item.modul}</b>.
        </p>
      </div>
    </div>
  )
}
