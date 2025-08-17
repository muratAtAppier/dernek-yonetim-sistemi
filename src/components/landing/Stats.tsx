export default function Stats() {
  const items = [
    { label: 'Aktif Üye', value: '2.4K+' },
    { label: 'Toplantı', value: '320+' },
    { label: 'Şablon', value: '75+' },
    { label: 'Kasa İşlemi', value: '18K+' },
  ]
  return (
    <section className="rounded-2xl border">
      <div className="grid grid-cols-2 gap-6 p-6 md:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="text-center">
            <div className="text-2xl font-semibold tracking-tight">{it.value}</div>
            <div className="text-xs text-muted-foreground">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
