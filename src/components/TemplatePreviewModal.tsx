"use client"

import React from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'

export function TemplatePreviewModal({ open, onClose, html }: { open: boolean; onClose: () => void; html: string }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative w-[95vw] h-[90vh] max-w-5xl flex flex-col">
        <div className="p-2 border-b flex items-center justify-between">
          <div className="font-medium text-sm">Önizleme</div>
          <Button onClick={onClose} variant="outline" size="sm">Kapat</Button>
        </div>
        <CardContent className="flex-1 overflow-auto p-4">
          <div className="border rounded min-h-full bg-white text-black" dangerouslySetInnerHTML={{ __html: html }} />
        </CardContent>
      </Card>
    </div>
  )
}
