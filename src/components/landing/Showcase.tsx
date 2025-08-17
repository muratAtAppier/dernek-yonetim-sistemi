export default function Showcase() {
  return (
    <section className="rounded-2xl border">
      <div className="grid gap-6 p-6 md:grid-cols-2">
        <div className="flex flex-col justify-center">
          <h2 className="text-2xl font-semibold tracking-tight">Muhasebe ve Üyelik Panosu</h2>
          <p className="mt-2 text-muted-foreground">
            Tahsilat durumu, gelir/gider dağılımı ve kasa bakiyesi gibi grafiklerle derneğinizin
            mali görünümünü tek ekranda izleyin.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border bg-muted/20">
          {/* Non-interactive preview: use the reference screenshot */}
          <img
            src="/landing/webdernek-dashboard.svg"
            alt="Pano önizlemesi"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}
