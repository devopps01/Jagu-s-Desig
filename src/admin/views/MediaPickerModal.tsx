'use client'

import { useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'

import CustomTextField from '@core/components/mui/TextField'
import ImageDropCard from '@admin/views/ImageDropCard'

export type PickedMedia = {
  url: string
  name: string
  alt: string
}

type FolderPayload = {
  path: string
  folders: string[]
  files: { name: string; url: string; size: number }[]
}

type ImageMetaForm = {
  name: string
  alt: string
}

const imageMetaSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required('Image name is required')
    .min(2, 'Image name must be at least 2 characters')
    .max(80, 'Image name must be at most 80 characters')
    .matches(/^[a-zA-Z0-9._-]+$/, 'Use letters, numbers, dash, underscore or dot only'),
  alt: yup
    .string()
    .trim()
    .required('Alt text is required')
    .min(3, 'Alt text must be at least 3 characters')
    .max(160, 'Alt text must be at most 160 characters')
})

const MediaPickerModal = ({
  open,
  file,
  onClose,
  onSelect
}: {
  open: boolean
  file: File | null
  onClose: () => void
  onSelect: (media: PickedMedia) => void
}) => {
  const [step, setStep] = useState<1 | 2>(1)
  const [currentPath, setCurrentPath] = useState('uploads')
  const [data, setData] = useState<FolderPayload | null>(null)
  const [newFolder, setNewFolder] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [localFile, setLocalFile] = useState<File | null>(file)

  const previewUrl = useMemo(() => (localFile ? URL.createObjectURL(localFile) : ''), [localFile])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ImageMetaForm>({
    resolver: yupResolver(imageMetaSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { name: '', alt: '' }
  })

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const load = async (folderPath: string) => {
    const res = await fetch(`/api/admin/media/folders?path=${encodeURIComponent(folderPath)}`)
    const json = await res.json()

    if (!res.ok) {
      setError(json.message || 'Could not open folder')

      return
    }

    setData(json)
    setCurrentPath(json.path || folderPath)
    setError('')
  }

  useEffect(() => {
    if (!open) return

    setStep(1)
    setError('')
    setLocalFile(file)
    reset({
      name: file ? file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]+/g, '-') : '',
      alt: ''
    })
    void load(currentPath || 'uploads')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file])

  const crumbs = (currentPath || '').split('/').filter(Boolean)

  const createFolder = async () => {
    const res = await fetch('/api/admin/media/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: currentPath, name: newFolder })
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.message || 'Could not create folder')

      return
    }

    setNewFolder('')
    await load(json.path)
  }

  const onSaveImage = handleSubmit(async values => {
    if (!localFile) {
      setError('Please drop or select an image first')

      return
    }

    setLoading(true)
    setError('')

    const form = new FormData()

    form.append('file', localFile)
    form.append('folder', currentPath)
    form.append('name', values.name.trim())
    form.append('alt', values.alt.trim())

    const res = await fetch('/api/admin/media/upload', { method: 'POST', body: form })
    const json = await res.json()

    setLoading(false)

    if (!res.ok) {
      setError(json.message || 'Upload failed')

      return
    }

    onSelect({ url: json.url, name: json.name, alt: json.alt })
    onClose()
  })

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>{step === 1 ? 'Upload or choose an image' : 'Image name & alt text'}</DialogTitle>
      <form id='image-meta-form' onSubmit={onSaveImage} noValidate>
        <DialogContent className='flex flex-col gap-4'>
          {error ? <Typography color='error'>{error}</Typography> : null}
          <ImageDropCard
            imageUrl={previewUrl}
            imageName={localFile?.name || ''}
            imageAlt={localFile ? 'Drop another image to replace' : 'Click or drop an image here'}
            onFile={next => {
              setLocalFile(next)
              setError('')
              reset({
                name: next.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]+/g, '-'),
                alt: ''
              })
            }}
          />
          {step === 1 ? (
            <>
              <Breadcrumbs>
                <Link component='button' type='button' onClick={() => void load('')}>
                  public
                </Link>
                {crumbs.map((crumb, index) => {
                  const next = crumbs.slice(0, index + 1).join('/')

                  return (
                    <Link key={next} component='button' type='button' onClick={() => void load(next)}>
                      {crumb}
                    </Link>
                  )
                })}
              </Breadcrumbs>
              <Box className='flex gap-3'>
                <CustomTextField
                  size='small'
                  label='New folder'
                  value={newFolder}
                  onChange={event => setNewFolder(event.target.value)}
                />
                <Button variant='outlined' type='button' onClick={() => void createFolder()}>
                  Create folder
                </Button>
              </Box>
              <Box className='flex flex-wrap gap-2'>
                {data?.folders.length ? (
                  data.folders.map(folder => (
                    <Button
                      key={folder}
                      variant='outlined'
                      type='button'
                      startIcon={<i className='tabler-folder' />}
                      onClick={() => void load(currentPath ? `${currentPath}/${folder}` : folder)}
                    >
                      {folder}
                    </Button>
                  ))
                ) : (
                  <Typography color='text.secondary'>No subfolders</Typography>
                )}
              </Box>
              {data?.files?.length ? (
                <Box>
                  <Typography variant='body2' className='mbe-2'>
                    Or use an image already in this folder
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 1.5 }}>
                    {data.files.map(item => (
                      <Box
                        key={item.url}
                        component='button'
                        type='button'
                        onClick={() => {
                          onSelect({ url: item.url, name: item.name.replace(/\.[^.]+$/, ''), alt: item.name })
                          onClose()
                        }}
                        sx={{
                          p: 0,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          bgcolor: 'background.paper',
                          aspectRatio: '3 / 4'
                        }}
                      >
                        <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : null}
            </>
          ) : (
            <>
              <Typography variant='body2'>Folder: /{currentPath || ''}</Typography>
              <Controller
                name='name'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required
                    label='Image name'
                    placeholder='product-banner'
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                  />
                )}
              />
              <Controller
                name='alt'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    required
                    label='Alt text'
                    placeholder='Describe this image'
                    error={Boolean(errors.alt)}
                    helperText={errors.alt?.message}
                  />
                )}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button type='button' onClick={onClose}>
            Cancel
          </Button>
          {step === 1 ? (
            <Button variant='contained' type='button' onClick={() => setStep(2)}>
              Use this folder
            </Button>
          ) : (
            <>
              <Button type='button' onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant='contained' type='submit' disabled={loading}>
                Save image
              </Button>
            </>
          )}
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default MediaPickerModal
