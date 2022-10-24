import { useEffect, useContext, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useWallet } from '@solana/wallet-adapter-react'
import axios from 'axios'
import { Box, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { styled } from '@mui/system'
import Hub from '@nina-protocol/nina-internal-sdk/esm/Hub'
import Release from '@nina-protocol/nina-internal-sdk/esm/Release'
import Nina from '@nina-protocol/nina-internal-sdk/esm/Nina'
import { truncateAddress } from '@nina-protocol/nina-internal-sdk/src/utils/truncateAddress'
import Subscribe from './Subscribe'
import NewProfileCtas from './NewProfileCtas'

const Dots = dynamic(() => import('./Dots'))
const TabHeader = dynamic(() => import('./TabHeader'))
const ReusableTable = dynamic(() => import('./ReusableTable'))

const Profile = ({ profilePubkey }) => {
  const wallet = useWallet()
  const router = useRouter()

  const {
    getUserCollectionAndPublished,
    collectRoyaltyForRelease,
  } = useContext(Release.Context)
  const { getHubsForUser } = useContext(Hub.Context)
  const {
    getSubscriptionsForUser,
    filterSubscriptionsForUser,
    subscriptionState,
    ninaClient
  } = useContext(Nina.Context)


  const [profilePublishedReleases, setProfilePublishedReleases] =
    useState(undefined)
  const [profileCollectionReleases, setProfileCollectionReleases] =
    useState(undefined)
  const [profileHubs, setProfileHubs] = useState(undefined)
  const [activeView, setActiveView] = useState()
  const [profileSubscriptions, setProfileSubscriptions] = useState()
  const [profileSubscriptionsTo, setProfileSubscriptionsTo] = useState()
  const [profileSubscriptionsFrom, setProfileSubscriptionsFrom] = useState()
  const [inDashboard, setInDashboard] = useState(false)

  const [fetched, setFetched] = useState(false)

  const [views, setViews] = useState([
    { name: 'releases', playlist: undefined, disabled: false },
    { name: 'collection', playlist: undefined, disabled: false },
    { name: 'hubs', playlist: null, disabled: false },
    { name: 'followers', playlist: null, disabled: false },
    { name: 'following', playlist: null, disabled: false },
  ])

  const artistNames = useMemo(() => {
    if (profilePublishedReleases?.length > 0) {
      return [
        ...new Set(
          profilePublishedReleases?.map(
            (release) => release.metadata.properties.artist
          )
        ),
      ]
    }
  }, [profilePublishedReleases])

  useEffect(() => {
    getUserData(profilePubkey)
  }, [])

  useEffect(() => {
    if (wallet.connected && profilePubkey === wallet.publicKey?.toBase58()) {
      console.log('in dashboard')
      setInDashboard(true)
    }
  }, [wallet, profilePubkey])

  useEffect(() => {
    if (router.query.view) {
      const viewIndex = views.findIndex((view) => view.name === router.query.view)
      setActiveView(viewIndex)
    }
  }, [router.query.view])
  
  useEffect(() => {
    const to = []
    const from = []
    if (profileSubscriptions){
      profileSubscriptions.forEach((sub) => {
        if (sub.to === profilePubkey) {
          to.push(sub)
        } else if (sub.from === profilePubkey) {
          from.push(sub)
        }
      })
      setProfileSubscriptionsTo(to)
      setProfileSubscriptionsFrom(from)
    }
  }, [profileSubscriptions])

  useEffect(() => {
    setProfileSubscriptions(filterSubscriptionsForUser(profilePubkey))
  }, [subscriptionState])


  useEffect(() => {
    let viewIndex
    let updatedView = views.slice()
    if (!inDashboard){
      if (profilePublishedReleases?.length === 0) {
        viewIndex = updatedView.findIndex((view) => view.name === 'releases')
        updatedView[viewIndex].disabled = true
      }
      if (profileCollectionReleases?.length === 0) {
        viewIndex = updatedView.findIndex((view) => view.name === 'collection')
        updatedView[viewIndex].disabled = true
      }
      if (profileHubs?.length === 0) {
        viewIndex = updatedView.findIndex((view) => view.name === 'hubs')
        updatedView[viewIndex].disabled = true
      }
      if (profileSubscriptionsTo?.length === 0) {
        viewIndex = updatedView.findIndex((view) => view.name === 'followers')
        updatedView[viewIndex].disabled = false
      }
      if (profileSubscriptionsFrom?.length === 0) {
        viewIndex = updatedView.findIndex((view) => view.name === 'following')
        updatedView[viewIndex].disabled = false
      }
    }

    setViews(updatedView)
  }, [profilePublishedReleases, profileCollectionReleases, profileHubs, profileSubscriptionsTo, profileSubscriptionsFrom])

  useEffect(() => {
    if (!router.query.view && !activeView) {
      const viewIndex = views.findIndex((view) => !view.disabled)
      setActiveView(viewIndex)
    }
  }, [views])

  const getUserData = async () => {
    const hubs = await getHubsForUser(profilePubkey)

    try {
      const [collected, published] = await getUserCollectionAndPublished(
        profilePubkey,
        inDashboard
      )
  
      if (inDashboard) {
        published?.forEach((release) => {
          const accountData = release.accountData.release
          release.recipient = accountData.revenueShareRecipients.find(
            (recipient) => recipient.recipientAuthority === profilePubkey
          )
          release.price = ninaClient.nativeToUiString(
            accountData.price,
            accountData.paymentMint
          )
          release.remaining = `${accountData.remainingSupply} / ${accountData.totalSupply}`
          release.collected = ninaClient.nativeToUiString(
            accountData.totalCollected,
            accountData.paymentMint
          )
          release.collectable = release.recipient.owed > 0
          release.collectableAmount = ninaClient.nativeToUiString(
            release.recipient.owed,
            accountData.paymentMint
          )
          release.paymentMint = accountData.paymentMint
        })
      }
  
      const subscriptions = await getSubscriptionsForUser(profilePubkey)
  
      setProfileCollectionReleases(collected)
      setProfilePublishedReleases(published)
      setProfileSubscriptions(subscriptions)
  
      let viewIndex
      let updatedView = views.slice()
  
      viewIndex = updatedView.findIndex((view) => view.name === 'releases')
      updatedView[viewIndex].playlist = published
  
      viewIndex = updatedView.findIndex((view) => view.name === 'collection')
      updatedView[viewIndex].playlist = collected
      setProfileHubs(hubs)
    } catch (err) {
      console.log(err)
    }
    setFetched(true)
  } 

  const viewHandler = (event) => {
    const index = parseInt(event.target.id)
    const activeViewName = views[index].name
    const path = router.pathname.includes('dashboard')
      ? 'dashboard'
      : `profiles/${profilePubkey}`

    const newUrl = `/${path}?view=${activeViewName}`
    window.history.replaceState(
      { ...window.history.state, as: newUrl, url: newUrl },
      '',
      newUrl
    )
    setActiveView(index)
  }

  const renderTables = (activeView, inDashboard) => {
    switch (activeView) {
      case 0:
        return (
          <>
            {(inDashboard && profilePublishedReleases?.length === 0) ? (
              <NewProfileCtas activeViewIndex={activeView} />
            ) : (
              <ReusableTable
                tableType={'profilePublishedReleases'}
                items={profilePublishedReleases}
                hasOverflow={true}
                inDashboard={inDashboard}
              />

            )}
          </>
        )
      case 1:
        return (
          <>
            {(inDashboard && profileCollectionReleases?.length === 0) ? (
              <NewProfileCtas activeViewIndex={activeView} />
            ) : (
              <ReusableTable
                tableType={'profileCollectionReleases'}
                items={profileCollectionReleases}
                hasOverflow={true}
              />
            )}
          </>
        )
      case 2:
        return (
          <>
           {(inDashboard && profileHubs?.length === 0) ? (
              <NewProfileCtas activeViewIndex={activeView} />
            ) : ( 
              <ReusableTable
                tableType={'profileHubs'}
                items={profileHubs}
                hasOverflow={true}
              />
            )}
          </>
        )
      case 3: 
        return (
          <>
            {(inDashboard && profileSubscriptionsTo?.length === 0) ? (
                <NewProfileCtas activeViewIndex={activeView} />
            ) : (
              <ReusableTable
                tableType={'followers'}
                items={profileSubscriptionsTo}
              />
            )}
          </>
        )
      case 4: 
        return (
          <>
            {(inDashboard && profileSubscriptionsFrom?.length === 0) ? (
                <NewProfileCtas activeViewIndex={activeView} />
              ) : (
              <ReusableTable
                tableType={'following'}
                items={profileSubscriptionsFrom}
              />
            )}
          </>
        )
      default:
        break
    }
  }


  return (
    <>
       <ProfileContainer>
          <ProfileHeaderWrapper>
            <ProfileHeaderContainer>
              {fetched && profilePubkey && (
                <Box sx={{mb:1}} display='flex'>
                  <Typography>{truncateAddress(profilePubkey)}</Typography>
                  
                  {wallet.connected && (
                    <Subscribe accountAddress={profilePubkey} />
                  )}
                </Box>
              )}
              {fetched.user && artistNames?.length > 0 && (
                <ProfileOverflowContainer>
                  {`Publishes as ${artistNames?.map((name) => name).join(', ')}`}
                </ProfileOverflowContainer>
              )}
            </ProfileHeaderContainer>
          </ProfileHeaderWrapper>

        {fetched &&  (
            <Box sx={{ py: 1 }}>
              <TabHeader
                viewHandler={viewHandler}
                activeView={activeView}
                profileTabs={views}
                followersCount={profileSubscriptionsTo?.length}
                followingCount={profileSubscriptionsFrom?.length}
              />
            </Box>
          )}

        <>
          {!fetched && (
            <ProfileDotWrapper>
              <Box sx={{ margin: 'auto' }}>
                <Dots />
              </Box>
            </ProfileDotWrapper>
          )}

          <ProfileTableContainer>
            {fetched && renderTables(activeView, inDashboard)}
          </ProfileTableContainer>
        </>
      </ProfileContainer>
    </>
  )
}

const ProfileContainer = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  flexDirection: 'column',
  justifyItems: 'center',
  textAlign: 'center',
  minWidth: theme.maxWidth,
  maxWidth: theme.maxWidth,
  height: '86vh',
  overflowY: 'hidden',
  margin: '75px auto 0px',
  ['-webkit-overflow-scroll']: 'touch',
  [theme.breakpoints.down('md')]: {
    display: 'flex',
    flexDirection: 'column',
    justifyItems: 'center',
    alignItems: 'center',
    marginTop: '25px',
    paddingTop: 0,
    minHeight: '100% !important',
    maxHeight: '80vh',
    overflow: 'hidden',
    marginLeft: 0,
  },
}))

const ProfileHeaderContainer = styled(Box)(({ theme }) => ({
  maxWidth: '100%',
  textAlign: 'left',
  [theme.breakpoints.down('md')]: {
    paddingLeft: '10px',
    paddingRight: '10px',
  },
}))

const ProfileHeaderWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'left',
  justifyContent: 'start',
  py: 5,
  pl: 1,
  pb: 1,
  maxWidth: '100vw',
  minHeight: '100px',
  [theme.breakpoints.down('md')]: {
    width: '100vw',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'no-wrap',
    height: '100px',
  },
}))

const ProfileOverflowContainer = styled(Box)(({ theme }) => ({
  overflow: 'hidden',
  display: ['-webkit-box'],
  ['-webkit-line-clamp']: '4',
  ['-webkit-box-orient']: 'vertical',
  textOverflow: 'ellipsis',
  [theme.breakpoints.down('md')]: {
    ['-webkit-line-clamp']: '4',
  },
}))

const ProfileTableContainer = styled(Box)(({ theme }) => ({
  paddingBottom: '100px',
  [theme.breakpoints.down('md')]: {
    paddingBottom: '100px',
    overflow: 'scroll',
  },
}))

const ProfileDotWrapper = styled(Box)(({ theme }) => ({
  fontSize: '80px',
  display: 'flex',
  width: '100%',
  height: '100%',
  display: 'flex',
  textAlign: 'center',
  [theme.breakpoints.down('md')]: {
    fontSize: '30px',
    left: '50%',
    top: '50%',
  },
}))

export default Profile
