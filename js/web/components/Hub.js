import { useEffect, useMemo, useState, useContext } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { Box, Typography } from '@mui/material'
import { styled } from '@mui/system'
import Hub from '@nina-protocol/nina-internal-sdk/esm/Hub'
import Release from '@nina-protocol/nina-internal-sdk/esm/Release'
import Audio from '@nina-protocol/nina-internal-sdk/esm/Audio'
import { useSnackbar } from 'notistack'

const Dots = dynamic(() => import('./Dots'))
const HubHeader = dynamic(() => import('./HubHeader'))
const HubCollaborators = dynamic(() => import('./HubCollaborators'))
const HubReleases = dynamic(() => import('./HubReleases'))
const TabHeader = dynamic(() => import('./TabHeader'))
const ReusableTable = dynamic(() => import('./ReusableTable'))
const HubComponent = ({ hubPubkey }) => {
  const {
    getHub,
    hubState,
    filterHubContentForHub,
    filterHubCollaboratorsForHub,
    hubContentState,
  } = useContext(Hub.Context)

  const { releaseState } = useContext(Release.Context)

  const [hubReleases, setHubReleases] = useState(undefined)
  const [releaseData, setReleaseData] = useState(undefined)
  const [collaboratorsData, setCollaboratorsData] = useState(undefined)
  const [activeView, setActiveView] = useState(undefined)
  const [fetchedHubInfo, setFetchedHubInfo] = useState(false)
  const [fetchedReleases, setFetchedReleases] = useState(false)
  const [fetchedCollaborators, setFetchedCollaborators] = useState(false)
  const [invalidHubPubkey, setInvalidHubPubkey] = useState(false)
  const [views, setViews] = useState([
    { name: 'releases', playlist: undefined, visible: true },
    { name: 'collaborators', playlist: undefined, visible: true },
  ])
  const hubData = useMemo(() => hubState[hubPubkey], [hubState, hubPubkey])

  useEffect(() => {
    if (!hubPubkey) {
      setFetchedHubInfo(false)
    }
    getHub(hubPubkey)
    if (hubPubkey) {
      setFetchedHubInfo(true)
    }
    if (fetchedHubInfo && !hubPubkey) {
      setInvalidHubPubkey(true)
    }
  }, [hubPubkey])

  useEffect(() => {
    const [releases] = filterHubContentForHub(hubPubkey)
    const collaborators = filterHubCollaboratorsForHub(hubPubkey)
    console.log('collaborators', collaborators)
    setHubReleases(releases)
    setCollaboratorsData(collaborators)
    let updatedView = views.slice()
    let viewIndex
    if (releases.length > 0) {
      setActiveView(0)
      viewIndex = updatedView.findIndex((view) => view.name === 'releases')
      updatedView[viewIndex].visible = true
      console.log('releaseData', releases)
      updatedView[viewIndex].playlist = releases
      setFetchedReleases(true)
    }
    if (releases.length === 0 && collaborators.length > 0) {
      setActiveView(1)
      setFetchedReleases(false)
    }
    if (collaborators) {
      setFetchedCollaborators(true)
    }
    setViews(updatedView)
  }, [hubContentState])

  useEffect(() => {
    let updatedView = views.slice()
    let viewIndex
    const data = hubReleases?.map((hubRelease) => {
      const releaseMetadata = releaseState.metadata[hubRelease.release]
      releaseMetadata.releasePubkey = hubRelease.release
      return releaseMetadata
    })
    setReleaseData(data)
    viewIndex = updatedView.findIndex((view) => view.name === 'releases')
    updatedView[viewIndex].playlist = releaseData
  }, [releaseState, hubReleases, views])

  const viewHandler = (event) => {
    const index = parseInt(event.target.id)
    setActiveView(index)
  }

  return (
    <>
      <Head>
        <title>{`Nina: ${
          hubData?.json.displayName ? `${hubData.json.displayName}'s Hub` : ''
        }`}</title>
        <meta
          name="description"
          content={`${hubData?.json.displayName}'s Hub on Nina.`}
        />
        <meta name="og:type" content="website" />
        <meta
          name="og:title"
          content={`Nina: ${
            hubData?.json.displayName ? `${hubData.json.displayName}'s Hub` : ''
          }`}
        />
        <meta
          name="og:description"
          content={`${
            hubData?.json.displayName ? hubData?.json.displayName : ''
          }: ${
            hubData?.json.description ? hubData?.json.description : ''
          } \n Published via Nina Hubs.`}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@ninaprotocol" />
        <meta name="twitter:creator" content="@ninaprotocol" />
        <meta name="twitter:image:type" content="image/jpg" />
        <meta
          name="twitter:title"
          content={`${hubData?.json.displayName}'s Hub on Nina`}
        />
        <meta name="twitter:description" content={hubData?.json.description} />
        <meta name="twitter:image" content={hubData?.json.image} />
        <meta name="og:image" content={hubData?.json.image} />
      </Head>

      <ResponsiveHubContainer>
        <ResponsiveHubHeaderContainer>
          {!fetchedHubInfo && !hubData && (
            <ResponsiveDotHeaderContainer>
              <Dots />
            </ResponsiveDotHeaderContainer>
          )}
          {fetchedHubInfo && hubData && <HubHeader hubData={hubData} />}
          {invalidHubPubkey && (
            <Typography>No Hub found at this address</Typography>
          )}
        </ResponsiveHubHeaderContainer>
        <Box sx={{ py: 1 }}>
          <TabHeader
            viewHandler={viewHandler}
            isActive={activeView}
            profileTabs={views}
            releaseData={releaseData}
            type={'hubsView'}
          />
        </Box>
        <ResponsiveHubContentContainer>
          {activeView === 0 && (
            <>
              {!fetchedReleases && (
                <ResponsiveDotContainer>
                  <Dots />
                </ResponsiveDotContainer>
              )}
              {fetchedReleases && releaseData && (
                <ReusableTable tableType={'hubReleases'} releases={releaseData} />
              )}
            </>
          )}
          {activeView === 1 && (
            <>
              {!fetchedCollaborators && (
                <ResponsiveDotContainer>
                  <Dots />
                </ResponsiveDotContainer>
              )}
              {fetchedCollaborators && !collaboratorsData && (
                <Box sx={{ my: 1 }}>No collaborators found in this Hub</Box>
              )}
              {fetchedCollaborators && (
                <ReusableTable tableType={'hubCollaborators'} releases={collaboratorsData} />
              )}
            </>
          )}
        </ResponsiveHubContentContainer>
      </ResponsiveHubContainer>
    </>
  )
}

const ResponsiveHubContainer = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  flexDirection: 'column',
  justifyItems: 'center',
  textAlign: 'center',
  minWidth: theme.maxWidth,
  maxWidth: theme.maxWidth,
  maxHeight: '60vh',
  webkitOverflowScrolling: 'touch',

  [theme.breakpoints.down('md')]: {
    display: 'flex',
    flexDirection: 'column',
    justifyItems: 'center',
    alignItems: 'center',
    marginTop: '125px',
    maxHeight: '80vh',
  },
}))

const ResponsiveHubHeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'left',
  justifyContent: 'start',
  py: 5,
  px: 1,
  m: 1,
  minHeight: '115px',
  [theme.breakpoints.down('md')]: {
    width: '100vw',
  },
}))

const ResponsiveHubContentContainer = styled(Box)(({ theme }) => ({
  minHeight: '60vh',
  width: theme.maxWidth,
  webkitOverflowScrolling: 'touch',
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  [theme.breakpoints.down('md')]: {
    width: '100vw',
    padding: '0px 30px',
    height: '100vh',
    overflowY: 'unset',
    minHeight: '60vh',
  },
}))

const ResponsiveDotContainer = styled(Box)(({ theme }) => ({
  fontSize: '80px',
  position: 'absolute',
  left: '50%',
  top: '50%',
  display: 'table-cell',
  textAlign: 'center',
  verticalAlign: 'middle',
  display: 'table-cell',
  textAlign: 'center',
  verticalAlign: 'middle',
  [theme.breakpoints.down('md')]: {
    fontSize: '30px',
    left: '47%',
    top: '53%',
  },
}))

const ResponsiveDotHeaderContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '20%',
  left: '20%',
  fontSize: '80px',
  [theme.breakpoints.down('md')]: {
    fontSize: '30px',
    left: '13%',
  },
}))
export default HubComponent
