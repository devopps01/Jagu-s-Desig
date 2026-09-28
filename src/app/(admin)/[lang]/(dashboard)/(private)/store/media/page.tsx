'use client'

import { useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'

import ImageDropCard from '@admin/views/ImageDropCard'
import MediaPickerModal from '@admin/views/MediaPickerModal'

const MediaLibraryPage = () => {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [last, setLast] = useState<{ url: string; name: string; alt: string } | null>(null)

  return (
    <Card>
      <CardHeader title='Image upload' subheader='Click or drag an image, then choose folder, name and alt text' />
      <CardContent>
        <ImageDropCard
          imageUrl={last?.url}
          imageName={last?.name}
          imageAlt={last?.alt}
          onFile={nextFile => {
            setFile(nextFile)
            setOpen(true)
          }}
        />
        <MediaPickerModal
          open={open}
          file={file}
          onClose={() => {
            setOpen(false)
            setFile(null)
          }}
          onSelect={setLast}
        />
      </CardContent>
    </Card>
  )
}

export default MediaLibraryPage
