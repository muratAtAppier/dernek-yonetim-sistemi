import { Mail, Phone, Linkedin } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata = {
  title: 'Bize Ulaşın',
  description: 'İletişim bilgilerimiz',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent pb-4">
              Bize Ulaşın
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Dernek yönetim sistemi hakkında merak ettikleriniz için bizimle
              iletişime geçin.
            </p>
          </div>

          {/* Contact Card */}
          <Card className="shadow-xl border-2">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl">İletişim Bilgileri</CardTitle>
              <CardDescription>
                Size en kısa sürede dönüş yapabilmek için aşağıdaki iletişim
                kanallarından bize ulaşabilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Phone */}
              <div className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Telefon
                  </p>
                  <a
                    href="tel:+905427113606"
                    className="text-lg font-semibold hover:text-primary transition-colors"
                  >
                    +90 542 711 36 06
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    E-posta
                  </p>
                  <a
                    href="mailto:muratulusal@yahoo.com"
                    className="text-lg font-semibold hover:text-primary transition-colors break-all"
                  >
                    muratulusal@yahoo.com
                  </a>
                </div>
              </div>

              {/* LinkedIn */}
              <div className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Linkedin className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    LinkedIn
                  </p>
                  <a
                    href="https://www.linkedin.com/in/murat-ulusal/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold hover:text-primary transition-colors break-all"
                  >
                    linkedin.com/in/murat-ulusal
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back to Home Button */}
          <div className="mt-8 flex justify-center">
            <Link href="/">
              <Button variant="outline" size="lg" className="px-8">
                Anasayfaya Dön
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
