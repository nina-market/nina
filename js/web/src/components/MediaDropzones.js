import React, { useState, useEffect } from 'react'
import { styled } from '@mui/material/styles'
import MediaDropzone from './MediaDropzone.js'
import Box from '@mui/material/Box'

function MediaDropzones({
  values,
  releasePubkey,
  artwork,
  setArtwork,
  track,
  setTrack,
}) {
  const [metadata, setMetadata] = useState({})

  useEffect(() => {
    setMetadata({
      artist: values.releaseForm?.artist,
      title: values.releaseForm?.title,
      description: values.releaseForm?.description,
      catalogNumber: values.releaseForm?.catalogNumber,
      duration: track ? track.meta?.duration : 0,
      resalePercentage: values.releaseForm.resalePercentage * 100,
    })
  }, [values, track])

  return (
    <StyledDropZones>
      <label htmlFor="track"></label>
      <MediaDropzone
        type="track"
        releasePubkey={releasePubkey}
        track={track}
        setTrack={setTrack}
      />
      <label htmlFor="artwork"></label>
      <MediaDropzone
        type="artwork"
        artwork={artwork}
        setArtwork={setArtwork}
        releasePubkey={releasePubkey}
        metadata={metadata}
      />
    </StyledDropZones>
  )
}

const StyledDropZones = styled(Box)(() => ({
  border: '2px solid blue',
  height: '100%',
}))

export default MediaDropzones
