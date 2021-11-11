import React from 'react'
import ninaCommon from 'nina-common'
import 'react-dropzone-uploader/dist/styles.css'
import Dropzone from 'react-dropzone-uploader'
import { Typography, Box } from '@mui/material'
import { styled } from '@mui/material/styles'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined'

const { NinaClient } = ninaCommon.utils
const MediaDropzone = ({
  type,
  releasePubkey,
  metadata,
  setArtwork,
  setTrack,
}) => {
  const getUploadParams = ({ file }) => {
    const body = new FormData()
    body.append('file', file)
    body.append('type', type)
    body.append('tokenId', releasePubkey)
    if (metadata) {
      body.append('artist', metadata.artist)
      body.append('title', metadata.title)
      body.append('description', metadata.description)
      body.append('duration', metadata.duration)
      body.append('catalogNumber', metadata.catalogNumber)
      body.append('sellerFeeBasisPoints', metadata.resalePercentage)
    }
    return {
      url: `${NinaClient.endpoints.pressingPlant}/api/file`,
      body,
    }
  }

  const handleChangeStatus = ({ file, meta, restart }, status) => {
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
    //NOTE: we should reject non-square files for artwork

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

  const Preview = ({ meta, fileWithMeta: { remove } }) => {
    if (meta.type.includes('image')) {
      return (
        <Box style={previewBoxStyles}>
          {cancelIcon(remove)}
          <img src={meta.previewUrl} style={{ width: '100%' }} />
        </Box>
      )
    } else {
      var minutes = Math.floor(meta.duration / 60)
      var seconds = Math.ceil(meta.duration - minutes * 60)

      return (
        <Box style={{ ...previewBoxStyles, ...audioPreviewStyles }}>
          {cancelIcon(remove)}
          <Box sx={{ padding: '35px 15px' }}>
            <Typography align="left" variant="h5">
              {meta.name}
            </Typography>
            <Typography align="left" variant="subtitle1">
              {minutes}:{seconds}
            </Typography>
          </Box>
        </Box>
      )
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
  }

  const StyledPreview = styled(Preview)(() => ({
    border: '2px solid red !important',
  }))

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
      getUploadParams={getUploadParams}
      onChangeStatus={handleChangeStatus}
      accept={type === 'track' ? 'audio/*' : 'image/*'}
      maxFiles={1}
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
      PreviewComponent={StyledPreview}
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
