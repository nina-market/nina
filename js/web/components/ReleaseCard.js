import React, { useContext, useMemo } from 'react'
import { styled } from '@mui/material/styles'
import nina from "@nina-protocol/nina-sdk";
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import { Typography } from '@mui/material'
import { Fade } from '@mui/material'
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined'
import ControlPointIcon from '@mui/icons-material/ControlPoint'
import Image from './Image'

import {useSnackbar} from 'notistack'
import AddToHubModal from './AddToHubModal.js'

const {AudioPlayerContext, ReleaseContext, HubContext} = nina.contexts

const ReleaseCard = (props) => {
  const { artwork, metadata, preview, releasePubkey, userHubs } = props
  const { updateTxid, addTrackToQueue } = useContext(AudioPlayerContext)
  const { releaseState } = useContext(ReleaseContext)
  const image = useMemo(() => metadata?.image)
  const {enqueueSnackbar} = useSnackbar()

  console.log('userHubs :>> ', userHubs);


  return (
    <StyledReleaseCard>
      <StyledReleaseInfo>
        {metadata && (
          <CtaWrapper sx={{ display: 'flex' }}>
            <Button
              onClick={() =>
                updateTxid(
                  metadata.properties.files[0].uri,
                  releasePubkey,
                  true
                )
              }
              sx={{ height: '22px', width: '28px' }}
            >
              <PlayCircleOutlineOutlinedIcon sx={{ color: 'white' }} />
            </Button>
            <Button
              onClick={() => {
                addTrackToQueue(releasePubkey)
              }}
              sx={{ height: '22px', width: '28px' }}
            >
              <ControlPointIcon sx={{ color: 'white' }} />
            </Button>

            {userHubs?.length > 0 && (
              <Repost>
                <AddToHubModal userHubs={userHubs} releasePubkey={releasePubkey} metadata={metadata}/>
              </Repost>
            )}
          </CtaWrapper>
        )}

        {metadata && (
          <Fade in={true}>
            <Typography variant="h4" color="white" align="left">
              {metadata?.properties?.artist.substring(0, 100) ||
                metadata?.artist.substring(0, 100)}
              ,{' '}
              <i>
                {metadata?.properties?.title.substring(0, 100) ||
                  metadata?.title.substring(0, 100)}
              </i>
            </Typography>
          </Fade>
        )}
      </StyledReleaseInfo>

      <Box>
        {preview ? (
          <Image
            src={
              artwork?.meta.status === undefined ? '' : artwork.meta.previewUrl
            }
            alt={metadata.artist}
            layout="responsive"
            height={350}
            width={350}
            release={releaseState[releasePubkey]}
          />
        ) : (
          <Image
            height={350}
            width={350}
            layout="responsive"
            src={image}
            alt={metadata?.name}
            release={releaseState.tokenData[releasePubkey]}
            priority={true}
          />
        )}
      </Box>
    </StyledReleaseCard>
  )
}

const StyledReleaseCard = styled(Box)(() => ({
  width: '100%',
  minHeight: '100%',
  margin: 'auto',
}))

const CtaWrapper = styled(Box)(() => ({
  '& .MuiButton-root': {
    width: '21px',
    marginRight: '10px',
  },
}))

const Repost = styled(Box)(() => ({
  border: '2px solid red'
}))

const StyledReleaseInfo = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.blue,
  color: theme.palette.white,
  minHeight: '52px',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: theme.spacing(1),
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: {
    minHeight: '52px',
    height: 'unset',
    paddingBottom: '15px',
  },
}))

export default ReleaseCard
