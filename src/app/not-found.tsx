export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">
        Sayfa bulunamadı
      </h1>
      <p className="text-sm text-muted-foreground">
        Aradığınız kaynak kaldırılmış veya hiç var olmamış olabilir.
      </p>
      <a href="/" className="text-primary underline text-sm">
        Ana sayfaya dön
      </a>
    </div>
  )
}
