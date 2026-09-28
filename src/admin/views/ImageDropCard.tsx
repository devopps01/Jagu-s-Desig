'use client'

import { useRef, useState } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp'

const ImageDropCard = ({
  imageUrl,
  imageName,
  imageAlt,
  onFile
}: {
  imageUrl?: string
  imageName?: string
  imageAlt?: string
  onFile: (file: File) => void
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const takeFile = (file?: File | null) => {
    if (!file || !file.type.startsWith('image/')) return

    onFile(file)
  }

  return (
    <Box
      onClick={() => inputRef.current?.click()}
      onDragOver={event => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={event => {
        event.preventDefault()
        setDragging(false)
        takeFile(event.dataTransfer.files?.[0])
      }}
      sx={{
        cursor: 'pointer',
        border: '2px dashed',
        borderColor: dragging ? 'primary.main' : 'primary.light',
        borderRadius: 2,
        minHeight: 200,
        width: '100%',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        p: 4,
        bgcolor: dragging ? 'action.selected' : 'action.hover',
        overflow: 'hidden'
      }}
    >
      <input
        ref={inputRef}
        type='file'
        accept={ACCEPT}
        hidden
        onChange={event => {
          takeFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      {imageUrl ? (
        <Box>
          <img
            src={imageUrl}
            alt={imageAlt || imageName || 'Selected image'}
            style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain', display: 'block', margin: '0 auto' }}
          />
          <Typography className='mbs-3' variant='body2'>
            {imageName || 'Selected image'}
          </Typography>
          <Typography color='text.secondary' variant='caption'>
            {imageAlt || 'Click or drop to change image'}
          </Typography>
        </Box>
      ) : (
        <Box>
          <i className='tabler-upload text-[2.25rem] text-primary' />
          <Typography className='mbs-2' color='text.primary'>
            Drag & drop an image here
          </Typography>
          <Typography color='text.secondary' variant='body2'>
            or click to browse JPG, PNG, WEBP
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default ImageDropCard
