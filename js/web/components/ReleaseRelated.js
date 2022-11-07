import React, { useEffect, useState, useContext } from 'react'
import { Helmet } from 'react-helmet'
import Audio from '@nina-protocol/nina-internal-sdk/esm/Audio'
import Release from '@nina-protocol/nina-internal-sdk/esm/Release'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined'
import Button from '@mui/material/Button'
import { useSnackbar } from 'notistack'
import ReleaseListTable from './ReleaseListTable'
import ReleaseTileList from './ReleaseTileList'
import ScrollablePageWrapper from './ScrollablePageWrapper'

const ReleaseRelated = ({ releasePubkey }) => {
  const { getRelatedForRelease, filterRelatedForRelease, releaseState } =
    useContext(Release.Context)
  const { resetQueueWithPlaylist } = useContext(Audio.Context)
  const [listView, setListView] = useState(false)
  const [relatedReleases, setRelatedReleases] = useState(null)
  const [userHandles, setUserHandles] = useState(null)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    getRelatedForRelease(releasePubkey)
  }, [])

  useEffect(() => {
    const related = filterRelatedForRelease(releasePubkey)
    setRelatedReleases(related)
  }, [releaseState.tokenData])

  useEffect(() => {
    if (relatedReleases) {
      const handles = relatedReleases.map((release) => {
        return release.metadata.properties.artist
      })
      const filteredHandles = [...new Set(handles)]
      setUserHandles(filteredHandles.join(' / '))
    }
  }, [relatedReleases])

  const handleViewChange = () => {
    setListView(!listView)
  }

  return (
    <>
      <Helmet>
        <title>{`Nina: Releases by ${userHandles}`} </title>
        <meta name="description" content={`Releases by ${userHandles}`} />
      </Helmet>
      <ScrollablePageWrapper>
        <Wrapper>
          {relatedReleases?.length > 0 && (
            <>
              <CollectionHeader listView={listView}>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: '700 !important' }}
                  align="left"
                >
                  Releases by {userHandles}
                  <span>
                    <Button
                      onClick={() =>
                        resetQueueWithPlaylist(
                          relatedReleases.map(
                            (release) => release.releasePubkey
                          )
                        ).then(() => {
                          enqueueSnackbar(
                            `Now Playing: Releases by ${userHandles}`,
                            { variant: 'info' }
                          )
                        })
                      }
                    >
                      <PlayCircleOutlineOutlinedIcon sx={{ color: 'black' }} />
                    </Button>
                  </span>
                </Typography>
                <Typography
                  onClick={handleViewChange}
                  sx={{ cursor: 'pointer' }}
                >
                  {listView ? 'Cover View' : 'List View'}
                </Typography>
              </CollectionHeader>

              {listView && (
                <ReleaseListTable
                  releases={relatedReleases}
                  tableType="userCollection"
                  key="releases"
                />
              )}
              {!listView && <ReleaseTileList releases={relatedReleases} />}
            </>
          )}
        </Wrapper>
      </ScrollablePageWrapper>
    </>
  )
}

const CollectionHeader = styled(Box)(() => ({
  maxWidth: '960px',
  margin: 'auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '15px',
}))

const Wrapper = styled(Box)(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    padding: '0px 30px',
    overflowX: 'auto',
  },
}))

export default ReleaseRelated
