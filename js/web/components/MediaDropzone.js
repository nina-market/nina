import React, { useContext } from 'react'
import 'react-dropzone-uploader/dist/styles.css'
import Dropzone from 'react-dropzone-uploader'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined'
import Image from 'next/image'
import Nina from '@nina-protocol/nina-internal-sdk/esm/Nina'

const MediaDropzone = ({
  type,
  setArtwork,
  setTrack,
  handleProgress,
  processingProgress,
}) => {
  const { MAX_AUDIO_FILE_UPLOAD_SIZE, MAX_IMAGE_FILE_UPLOAD_SIZE } = useContext(
    Nina.Context
  )

  const handleChangeStatus = ({ file, meta, restart, remove }, status) => {
    if (meta.status === 'error_validation') {
      const height = meta.height
      const width = meta.width
      const size = meta.size / 1000000
      if (file.type.includes('audio')) {
        if (file.type !== 'audio/mpeg') {
          alert(`Your track is not an MP3. \nPlease upload an MP3.`)
        } else {
          alert(
            `Your track is ${size} mb... \nPlease upload a file smaller than ${MAX_AUDIO_FILE_UPLOAD_SIZE} MBs`
          )
        }
      } else {
        if (height !== width) {
          alert(
            `your image's dimensions are ${height} x ${width}... \nPlease upload a square image`
          )
        } else {
          alert(
            `your image is ${size} mb... \nPlease upload an image smaller than ${MAX_IMAGE_FILE_UPLOAD_SIZE} MBs`
          )
        }
      }
      remove()
    }
    if (type === 'artwork') {
      if (status === 'removed') {
        setArtwork(undefined)
      } else {
        setArtwork({
          file,
          meta,
          restart,
        })
      }
    } else if (type === 'track') {
      if (status === 'removed') {
        setTrack(undefined)
      } else {
        setTrack({
          file,
          meta,
          restart,
        })
      }
    }
  }

  const inputLayout = (type) => {
    if (type === 'track') {
      return (
        <>
          <AddOutlinedIcon />
          <Typography variant="h2">Upload Track</Typography>
          <Typography variant="subtitle1">File Formats: MP3</Typography>
        </>
      )
    } else {
      return (
        <>
          <AddOutlinedIcon />
          <Typography variant="h2">Upload Artwork</Typography>
          <Typography variant="subtitle1">File Formats: JPG, PNG</Typography>
        </>
      )
    }
  }

  const validateImage = (fileWithMeta) => {
    const height = fileWithMeta.meta.height
    const width = fileWithMeta.meta.width
    const size = fileWithMeta.file.size / 1000000

    if (height !== width) {
      return true
    }

    if (size > MAX_IMAGE_FILE_UPLOAD_SIZE) {
      return true
    }
    return false
  }

  const validateTrack = (fileWithMeta) => {
    const size = fileWithMeta.file.size / 1000000
    if (size > MAX_AUDIO_FILE_UPLOAD_SIZE) {
      return true
    }
    if (fileWithMeta.file.type !== 'audio/mpeg') {
      return true
    }
    return false
  }

  const Preview = ({ meta, fileWithMeta }) => {
    if (meta.type.includes('image') && meta.previewUrl) {
      handleProgress(meta.percent, meta.type.includes('image'))
      return (
        <Box style={previewBoxStyles}>
          {cancelIcon(fileWithMeta.remove)}
          <Image src={meta.previewUrl} layout="fill" />
        </Box>
      )
    } else if (meta.type.includes('audio')) {
      handleProgress(meta.percent, meta.type.includes('image'))
      var minutes = Math.floor(meta.duration / 60)
      var seconds = Math.ceil(meta.duration - minutes * 60)

      return (
        <Box style={{ ...previewBoxStyles, ...audioPreviewStyles }}>
          {cancelIcon(fileWithMeta.remove)}
          <Box sx={{ padding: '35px 15px' }}>
            <Typography
              align="left"
              variant="h5"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              maxWidth="100%"
              overflow="hidden"
            >
              {meta.name}
            </Typography>
            <Typography align="left" variant="subtitle1">
              {minutes}:{seconds}
            </Typography>
            <Typography align="left" variant="subtitle1">
              {processingProgress === 1 ? 'Processed' : 'Processing'}:{' '}
              {(processingProgress * 100).toFixed(2)}%
            </Typography>
          </Box>
        </Box>
      )
    } else {
      return null
    }
  }

  const previewBoxStyles = {
    position: 'relative',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    color: 'white',
  }

  const audioPreviewStyles = {
    backgroundColor: '#2D81FF',
    '& h5': {
      border: '2px solid red !important',
      color: 'red !important',
    },
  }

  const cancelIcon = (remove) => (
    <ClearOutlinedIcon
      onClick={remove}
      style={{
        position: 'absolute',
        top: '15px',
        left: '10px',
        color: 'white',
      }}
    />
  )

  return (
    <Dropzone
      onChangeStatus={handleChangeStatus}
      accept={type === 'track' ? 'audio/*' : 'image/*'}
      maxFiles={1}
      validate={
        type === 'track'
          ? (fileWithMeta) => validateTrack(fileWithMeta)
          : (fileWithMeta) => validateImage(fileWithMeta)
      }
      SubmitButtonComponent={null}
      autoUpload={false}
      canRestart={false}
      classNames={{
        dropzone: classes.dropZone,
        inputLabel: classes.dropZoneInputLabel,
        preview: classes.dropZonePreviewWrapper,
        previewStatusContainer: classes.dropZonePreviewStatusContainer,
      }}
      inputContent={inputLayout(type)}
      PreviewComponent={Preview}
      styles={{
        dropzone: {
          minHeight: 60,
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          height: type === 'track' ? '113px' : '350px',
          cursor: 'pointer',
          marginBottom: type === 'track' ? '15px' : '',
          boxShadow: 'inset 0px 0px 30px 0px #0000001A',
          backgroundColor: '#EAEAEA',
        },
        preview: {
          margin: 'auto',
          alignItems: 'center',
        },
        previewImage: {
          width: '100%',
          maxHeight: '100%',
          maxWidth: 'unset',
        },
        inputLabel: {
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          padding: '15px',
        },
      }}
    />
  )
}

const PREFIX = 'MediaDropzone'

const classes = {
  dropZone: `${PREFIX}-dropZone`,
  dropZoneInputLabel: `${PREFIX}-dropZoneInputLabel`,
  dropZonePreviewWrapper: `${PREFIX}-dropZonePreviewWrapper`,
  dropZonePreviewStatusContainer: `${PREFIX}-dropZonePreviewStatusContainer`,
}

export default MediaDropzone
