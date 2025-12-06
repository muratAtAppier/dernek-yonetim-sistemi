export default function Footer() {
  return (
    <footer className="mt-16 border-t pt-8 pb-6 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
        <p className="font-medium">
          © {new Date().getFullYear()} Dernek Yönetim Sistemi
        </p>
      </div>
    </footer>
  )
}
