'use client'

import { useState } from 'react'

export function ConfirmDeleteButton({
  label = 'Sil',
  confirmMessage,
  className,
}: {
  label?: string
  confirmMessage: string
  className?: string
}) {
  const [pending, setPending] = useState(false)
  return (
    <button
      type="submit"
      className={className}
      // ÖNEMLİ: disabled attribute'u tıklama anında set edince bazı tarayıcılarda
      // form submit iptal olabiliyor. Bunun yerine aria-disabled kullanıyoruz.
      aria-disabled={pending}
      data-pending={pending ? 'true' : 'false'}
      onClick={(e) => {
        if (pending) return
        if (!confirm(confirmMessage)) {
          e.preventDefault()
          return
        }
        // Pending state'i göster ama butonu gerçek anlamda disable etme ki
        // form submit işlemi gerçekleşsin.
        setPending(true)
        // Eğer yine de kullanıcı tekrar tıklarsa engellemek için state kontrolü yeterli.
      }}
    >
      {pending ? 'Siliniyor…' : label}
    </button>
  )
}
