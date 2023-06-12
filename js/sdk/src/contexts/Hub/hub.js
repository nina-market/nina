import React, { createContext, useContext, useState } from 'react'
import * as anchor from '@project-serum/anchor'
import { ninaErrorHandler } from '../../utils/errors'
import { findAssociatedTokenAddress } from '../../utils/web3'
import Release from '../Release'
import Nina from '../Nina'
import NinaSdk from '@nina-protocol/js-sdk'
import { shuffle } from '../../utils'
import { logEvent } from '../../utils/event'
import { initSdkIfNeeded } from '../../utils/sdkInit'

const HubContext = createContext()
const HubContextProvider = ({ children }) => {
  const { releaseState, setReleaseState, getRelease } = useContext(
    Release.Context
  )
  const {
    savePostsToState,
    postState,
    setPostState,
    verificationState,
    setVerificationState,
    solBalance,
  } = useContext(Nina.Context)
  const [hubState, setHubState] = useState({})
  const [hubCollaboratorsState, setHubCollaboratorsState] = useState({})
  const [hubContentState, setHubContentState] = useState({})
  const [hubContentFetched, setHubContentFetched] = useState(new Set())
  const [initialLoad, setInitialLoad] = useState(false)
  const [addToHubQueue, setAddToHubQueue] = useState(new Set())
  const [hubsCount, setHubsCount] = useState(0)
  const [allHubs, setAllHubs] = useState([])
  const [featuredHubs, setFeaturedHubs] = useState()
  const [fetchedHubsForUser, setFetchedHubsForUser] = useState(new Set())
  const {
    getHubs,
    getHub,
    getHubsForUser,
    getHubsForRelease,
    filterHubsForRelease,
    hubInit,
    hubUpdateConfig,
    hubAddCollaborator,
    hubUpdateCollaboratorPermission,
    hubAddRelease,
    hubRemoveCollaborator,
    hubContentToggleVisibility,
    hubWithdraw,
    postInitViaHub,
    postUpdateViaHubPost,
    filterHubCollaboratorsForHub,
    filterHubContentForHub,
    filterHubsForUser,
    collectRoyaltyForReleaseViaHub,
    getHubPubkeyForHubHandle,
    validateHubHandle,
    filterFeaturedHubs,
    filterHubsAll,
    getHubFeePending,
  } = hubContextHelper({
    savePostsToState,
    hubState,
    setHubState,
    hubCollaboratorsState,
    setHubCollaboratorsState,
    hubContentState,
    setHubContentState,
    postState,
    setPostState,
    initialLoad,
    setInitialLoad,
    getRelease,
    addToHubQueue,
    setAddToHubQueue,
    allHubs,
    setAllHubs,
    hubsCount,
    setHubsCount,
    featuredHubs,
    setFeaturedHubs,
    hubContentFetched,
    setHubContentFetched,
    releaseState,
    setReleaseState,
    fetchedHubsForUser,
    setFetchedHubsForUser,
    verificationState,
    setVerificationState,
    solBalance,
  })

  return (
    <HubContext.Provider
      value={{
        getHubs,
        getHub,
        getHubsForUser,
        getHubsForRelease,
        filterHubsForRelease,
        hubInit,
        hubUpdateConfig,
        hubAddCollaborator,
        hubUpdateCollaboratorPermission,
        hubAddRelease,
        hubRemoveCollaborator,
        hubContentToggleVisibility,
        hubWithdraw,
        postInitViaHub,
        postUpdateViaHubPost,
        hubState,
        hubCollaboratorsState,
        hubContentState,
        getHubFeePending,
        filterHubCollaboratorsForHub,
        filterHubContentForHub,
        filterHubsForUser,
        initialLoad,
        collectRoyaltyForReleaseViaHub,
        getHubPubkeyForHubHandle,
        validateHubHandle,
        addToHubQueue,
        featuredHubs,
        setFeaturedHubs,
        filterFeaturedHubs,
        filterHubsAll,
        hubContentFetched,
        fetchedHubsForUser,
      }}
    >
      {children}
    </HubContext.Provider>
  )
}

const hubContextHelper = ({
  hubState,
  setHubState,
  hubCollaboratorsState,
  setHubCollaboratorsState,
  hubContentState,
  setHubContentState,
  postState,
  setPostState,
  addToHubQueue,
  setAddToHubQueue,
  allHubs,
  setAllHubs,
  featuredHubs,
  setFeaturedHubs,
  hubContentFetched,
  setHubContentFetched,
  releaseState,
  setReleaseState,
  fetchedHubsForUser,
  setFetchedHubsForUser,
  verificationState,
  setVerificationState,
  solBalance,
}) => {
  const { NINA_CLIENT_IDS } = NinaSdk.utils
  const { provider } = NinaSdk.client
  const ids = NINA_CLIENT_IDS[process.env.SOLANA_CLUSTER]

  const hubInit = async (hubParams) => {
    try {
      logEvent('hub_init_with_credit_initiated', 'engagement', {
        wallet: provider.wallet.publicKey.toBase58(),
      })
      await initSdkIfNeeded()
      const createdHub = await NinaSdk.client.Hub.hubInit(hubParams)
      const hubPubkey = createdHub.createdHub.hub.publicKey
      logEvent('hub_init_with_credit_success', 'engagement', {
        hub: hubPubkey,
        wallet: provider.wallet.publicKey.toBase58(),
      })
      await getHub(hubPubkey)
      return {
        success: true,
        msg: 'Hub Created',
        hubPubkey: hubPubkey,
      }
    } catch (error) {
      logEvent('hub_init_with_credit_failure', 'engagement', {
        wallet: provider.wallet.publicKey.toBase58(),
        solBalance,
      })

      return ninaErrorHandler(error)
    }
  }

  const hubUpdateConfig = async (hubPubkey, uri, publishFee, referralFee) => {
    try {
      await initSdkIfNeeded()
      const updatedHub = await NinaSdk.client.Hub.hubUpdateConfig(
        hubPubkey,
        uri,
        publishFee,
        referralFee
      )
      hubPubkey = updatedHub.updatedHub.hub.publicKey
      await getHub(hubPubkey)

      return {
        success: true,
        msg: 'Hub Updated',
      }
    } catch (error) {
      return ninaErrorHandler(error)
    }
  }

  const hubAddCollaborator = async (
    hubPubkey,
    collaboratorPubkey,
    canAddContent,
    canAddCollaborator,
    allowance = 1
  ) => {
    try {
      const hubCollaborator = await NinaSdk.client.Hub.hubAddCollaborator(
        hubPubkey,
        collaboratorPubkey,
        canAddContent,
        canAddCollaborator,
        allowance
      )
      const hubPublicKey = hubCollaborator.hubPublicKey
      // returning hubPublicKey until endpoint is updated
      await getHub(hubPublicKey)
      //TODO: State needs to update in UI
      return {
        success: true,
        msg: 'Collaborator Added to hub',
      }
    } catch (error) {
      return ninaErrorHandler(error)
    }
  }

  const hubUpdateCollaboratorPermission = async (
    hubPubkey,
    collaboratorPubkey,
    canAddContent,
    canAddCollaborator,
    allowance = 1
  ) => {
    try {
      const updatedCollaborator =
        await NinaSdk.client.Hub.hubUpdateCollaboratorPermission(
          hubPubkey,
          collaboratorPubkey,
          canAddContent,
          canAddCollaborator,
          allowance
        )
      const hubPublicKey = updatedCollaborator.hubPublicKey
      // returning hubPublicKey until endpoint is updated
      await getHub(hubPublicKey)
      return {
        success: true,
        msg: 'Hub Collaborator Permissions Updated',
      }
    } catch (error) {
      return ninaErrorHandler(error)
    }
  }

  const hubAddRelease = async (hubPubkey, releasePubkey, fromHub) => {
    try {
      logEvent('hub_add_release_initiated', 'engagement', {
        release: releasePubkey,
        hub: hubPubkey,
        wallet: provider.wallet.publicKey.toBase58(),
      })

      let queue = new Set(addToHubQueue)
      queue.add(releasePubkey)
      setAddToHubQueue(queue)

      const release = await NinaSdk.client.Hub.hubAddRelease(
        hubPubkey,
        releasePubkey,
        fromHub,
        provider.wallet,
        provider.connection
      )

      releasePubkey = release.hubRelease.release.publicKey
      hubPubkey = release.hubRelease.hub.publicKey

      await getHubsForRelease(releasePubkey)

      queue = new Set(addToHubQueue)
      queue.delete(releasePubkey)
      setAddToHubQueue(queue)

      logEvent('hub_add_release_initiated', 'engagement', {
        release: releasePubkey,
        hub: hubPubkey,
        wallet: provider.wallet.publicKey.toBase58(),
      })

      return {
        success: true,
        msg: 'Release Added to Hub',
      }
    } catch (error) {
      const queue = new Set(addToHubQueue)
      addToHubQueue.delete(releasePubkey)
      setAddToHubQueue(queue)
      logEvent('hub_add_release_initiated', 'engagement', {
        release: releasePubkey,
        hub: hubPubkey,
        wallet: provider.wallet.publicKey.toBase58(),
        solBalance,
      })
      return ninaErrorHandler(error)
    }
  }

  const hubRemoveCollaborator = async (hubPubkey, collaboratorPubkey) => {
    try {
      // endpoint in fetchHubCollaborator needs to be updated, currently returns {success: true}
      const removedCollaborator = await NinaSdk.client.Hub.hubRemoveCollaborator(
        hubPubkey,
        collaboratorPubkey
      )
      const hubPublicKey = removedCollaborator.hubPublicKey
      const collaboratorPublicKey = removedCollaborator.collaboratorPublicKey
      const hubCollaboratorsStateCopy = { ...hubCollaboratorsState }
      await getHub(hubPublicKey)
      delete hubCollaboratorsStateCopy[collaboratorPublicKey]
      setHubCollaboratorsState(hubCollaboratorsStateCopy)
      return {
        success: true,
        msg: 'Collaborator Removed From Hub',
      }
    } catch (error) {
      return ninaErrorHandler(error)
    }
  }

  const hubContentToggleVisibility = async (
    hubPubkey,
    contentAccountPubkey,
    type
  ) => {
    try {
      const toggledContentResult = await NinaSdk.client.Hub.hubContentToggleVisibility(
        hubPubkey,
        contentAccountPubkey,
        type
      )

      let toggledContentPublicKey
      let toggledContent

      if (type === 'Post') {
        toggledContentPublicKey = toggledContentResult.hubRelease.post.publicKey
        toggledContent = Object.values(hubContentState).filter(
          (c) => c.post === toggledContentPublicKey
        )[0]
        toggledContent.visible = !toggledContent.visible
        const hubContentStateCopy = { ...hubContentState }

        hubContentState[toggledContent.publicKey] = toggledContent
        setHubContentState(hubContentStateCopy)
        return {
          success: true,
          msg: `Post has been ${
            toggledContent.visible ? 'unarchived' : 'archived'
          }`,
        }
      } else if (type === 'Release') {
        toggledContentPublicKey =
          toggledContentResult.hubRelease.release.publicKey
        toggledContent = Object.values(hubContentState).filter(
          (c) => c.release === toggledContentPublicKey
        )[0]
        toggledContent.visible = !toggledContent.visible
        const hubContentStateCopy = { ...hubContentState }

        hubContentState[toggledContent.publicKey] = toggledContent
        setHubContentState(hubContentStateCopy)
        return {
          success: true,
          msg: `Release has been ${
            toggledContent.visible ? 'unarchived' : 'archived'
          }`,
        }
      }
    } catch (error) {
      return ninaErrorHandler(error)
    }
  }

  const hubWithdraw = async (hubPubkey) => {
    try {
      const hubWithdrawal = await NinaSdk.client.Hub.hubWithdraw(hubPubkey)
      hubPubkey = hubWithdrawal.hub.hub.publicKey
      await getHub(hubPubkey)
      return {
        success: true,
        msg: 'Withdraw from Hub Successful.',
      }
    } catch (error) {
      return ninaErrorHandler(error)
    }
  }

  const postInitViaHub = async (
    hubPubkey,
    slug,
    uri,
    referenceRelease = undefined,
    fromHub
  ) => {
    try {
      const initializedPost = await NinaSdk.client.Hub.postInitViaHub(
        hubPubkey,
        slug,
        uri,
        referenceRelease,
        fromHub
      )

      if (referenceRelease) {
        referenceRelease = initializedPost.post.post.data.reference
        await getHubsForRelease(referenceRelease)
      }
      hubPubkey = initializedPost.post.hub.publicKey
      await getHub(hubPubkey)
      return {
        success: true,
        msg: 'Post created.',
      }
    } catch (error) {
      if (referenceRelease) {
        await getHubsForRelease(referenceRelease)
      }
      await getHub(hubPubkey)
      return ninaErrorHandler(error)
    }
  }

  const postUpdateViaHubPost = async (hubPubkey, slug, uri) => {
    try {
      const updatedPost = await NinaSdk.client.Hub.postUpdateViaHub(
        hubPubkey,
        slug,
        uri
      )
      hubPubkey = updatedPost.post.hub.publicKey
      await getHub(hubPubkey)

      return {
        success: true,
        msg: `Post updated.`,
      }
    } catch (error) {
      return ninaErrorHandler(error)
    }
  }

  const collectRoyaltyForReleaseViaHub = async (
    releasePubkey,
    hubPubkey,
    slug,
    uri
  ) => {
    try {
      const royaltyForRelease =
        await NinaSdk.client.Release.collectRoyaltyForReleaseViaHub(
          releasePubkey,
          hubPubkey,
          slug,
          uri
        )
      const recipient =
        royaltyForRelease.release.release.accountData.release.revenueShareRecipients.filter(
          (rec) =>
            rec.recipientAuthority === provider.wallet.publicKey.toBase58()
        )[0]
      const paymentMint =
        royaltyForRelease.release.release.accountData.release.paymentMint
      hubPubkey = royaltyForRelease.release.release.publishedThroughHub
      await getHub(hubPubkey)
      return {
        success: true,
        msg: `You collected $${NinaSdk.utils.nativeToUi(
          recipient.owed.toNumber(),
          paymentMint.toBase58()
        )} to the hub`,
      }
    } catch (error) {
      return ninaErrorHandler(error)
    }
  }

  const getHubs = async (featured = false) => {
    try {
      const updatedAllHubs = [...allHubs]
      await initSdkIfNeeded()
      const { hubs } = await NinaSdk.client.Hub.fetchAll(
        { offset: allHubs.length, limit: 25 },
        true
      )
      const updatedHubState = { ...hubState }
      hubs.forEach((hub) => {
        updatedAllHubs.push(hub.publicKey)
        const hubData = hub.accountData.hub
        delete hub.accountData
        updatedHubState[hub.publicKey] = {
          ...hub,
          ...hubData,
        }
      })
      if (featured) {
        setFeaturedHubs(updatedAllHubs.splice(0, 10))
      } else {
        setAllHubs(updatedAllHubs)
      }
      setHubState(updatedHubState)
    } catch (error) {
      console.warn(error)
    }
  }

  const getHub = async (hubPubkey) => {
    try {
      await initSdkIfNeeded()
      const hub = await NinaSdk.client.Hub.fetch(hubPubkey, true)

      const updatedHubState = { ...hubState }
      const hubData = hub.hub.accountData
      updatedHubState[hubPubkey] = {
        ...hub.hub,
        ...hubData,
      }
      setHubState(updatedHubState)

      const updatedHubCollaboratorState = { ...hubCollaboratorsState }
      const updatedVerificationState = { ...verificationState }
      hub.collaborators.forEach((collaborator) => {
        updatedVerificationState[collaborator.publicKey] =
          collaborator.verifications
        updatedHubCollaboratorState[
          collaborator.accountData.collaborator.publicKey
        ] = {
          ...collaborator.accountData.collaborator,
        }
      })

      setHubCollaboratorsState((prevState) => ({
        ...prevState,
        ...updatedHubCollaboratorState,
      }))
      setVerificationState((prevState) => ({
        ...prevState,
        ...updatedVerificationState,
      }))

      const updatedHubContent = { ...hubContentState }
      const updatedReleaseState = { ...releaseState }
      hub.releases.forEach((release) => {
        updatedHubContent[release.accountData.hubRelease.publicKey] = {
          ...release.accountData.hubContent,
          ...release.accountData.hubRelease,
          hubReleaseId: release.accountData.hubRelease.publicKey,
        }
        updatedReleaseState.tokenData[release.publicKey] = {
          ...release.accountData.release,
        }
        updatedReleaseState.metadata[release.publicKey] = {
          ...release.metadata,
          publishedThroughHub: release.publishedThroughHub || undefined,
        }
        updatedReleaseState.releaseMintMap[release.publicKey] = release.mint
      })
      setReleaseState(updatedReleaseState)

      const updatedPostState = { ...postState }
      hub.posts.forEach((post) => {
        updatedHubContent[post.accountData.hubPost.publicKey] = {
          ...post.accountData.hubContent,
          ...post.accountData.hubPost,
          hubPostId: post.accountData.hubPost.publicKey,
        }
        delete post.accountData
        updatedPostState[post.publicKey] = {
          publicKey: post.publicKey,
          ...post,
        }
      })
      setPostState(updatedPostState)
      setHubContentState(updatedHubContent)
      setHubContentFetched(new Set([...hubContentFetched, hubPubkey]))
      return hub
    } catch (error) {
      console.warn(error)
    }
  }

  const getHubsForUser = async (publicKey) => {
    try {
      await initSdkIfNeeded()
      const { hubs } = await NinaSdk.client.Account.fetchHubs(publicKey, true)
      const updatedHubCollaboratorState = {}
      const updatedHubState = { ...hubState }
      hubs.forEach((hub) => {
        updatedHubCollaboratorState[hub.accountData.collaborator.publicKey] =
          hub.accountData.collaborator

        const hubAccountData = hub.accountData.hub
        delete hub.accountData
        updatedHubState[hub.publicKey] = {
          ...hub,
          ...hubAccountData,
        }
      })
      setHubState((prevState) => ({ ...prevState, ...updatedHubState }))
      setHubCollaboratorsState((prevState) => ({
        ...prevState,
        ...updatedHubCollaboratorState,
      }))
      setFetchedHubsForUser(new Set([...fetchedHubsForUser, publicKey]))
      return hubs
    } catch (error) {
      console.warn(error)
      return []
    }
  }

  const getHubsForRelease = async (releasePubkey) => {
    try {
      await initSdkIfNeeded()
      const { hubs } = await NinaSdk.client.Release.fetchHubs(releasePubkey, true)
      const updatedHubState = {}
      const updatedHubContent = {}
      hubs.forEach((hub) => {
        const accountData = { ...hub.accountData }
        delete hub.accountData
        delete hub.hubReleasePublicKey
        updatedHubState[hub.publicKey] = {
          ...hub,
          ...accountData.hub,
        }

        updatedHubContent[accountData.hubRelease.publicKey] = {
          ...accountData.hubContent,
          ...accountData.hubRelease,
          hubReleaseId: accountData.hubRelease.publicKey,
        }
      })
      setHubState((prevState) => ({ ...prevState, ...updatedHubState }))
      setHubContentState((prevState) => ({
        ...prevState,
        ...updatedHubContent,
      }))
      return hubs
    } catch (error) {
      console.warn(error)
      return []
    }
  }

  /*

  STATE

  */

  const filterHubContentForHub = (hubPubkey) => {
    const hubReleases = []
    const hubPosts = []
    Object.values(hubContentState).forEach((hubContent) => {
      if (hubContent.hub === hubPubkey) {
        if (hubContent.contentType === 'ninaReleaseV1') {
          hubReleases.push(hubContent)
        } else if (hubContent.contentType === 'post') {
          hubPosts.push(hubContent)
        }
      }
    })
    return [hubReleases, hubPosts]
  }

  const filterHubCollaboratorsForHub = (hubPubkey) => {
    const hubCollaborators = []
    Object.values(hubCollaboratorsState).forEach((hubCollaborator) => {
      if (hubCollaborator.hub === hubPubkey) {
        hubCollaborators.push(hubCollaborator)
      }
    })

    return hubCollaborators.sort((a, b) => b.datetime - a.datetime)
  }

  const filterFeaturedHubs = () => {
    const featured = []
    featuredHubs?.forEach((hubId) => {
      const hub = hubState[hubId]
      if (hub) {
        featured.push(hub)
      }
    })
    return shuffle(featured)
  }

  const filterHubsForUser = (publicKey) => {
    const hubs = []
    Object.values(hubCollaboratorsState).forEach((hubCollaborator) => {
      if (hubCollaborator.collaborator === publicKey) {
        hubs.push({
          ...hubState[hubCollaborator.hub],
        })
      }
    })
    return hubs
  }

  const filterHubsForRelease = (releasePubkey) => {
    const hubIds = []
    Object.values(hubContentState).forEach((hubContent) => {
      if (hubContent.release === releasePubkey) {
        hubIds.push(hubContent.hub)
      }
    })
    return hubIds.map((hubId) => hubState[hubId])
  }

  const getHubPubkeyForHubHandle = async (handle) => {
    try {
      if (handle) {
        let hub = Object.values(hubState).filter(
          (hub) => hub.handle === handle
        )[0]
        if (!hub) {
          await initSdkIfNeeded()
          hub = await NinaSdk.client.Hub.fetch(handle)
        }
        return hub?.publicKey
      }
      return undefined
    } catch (error) {
      console.warn(error)
      return undefined
    }
  }

  const getHubFeePending = async (hubPubkey) => {
    if (typeof hubPubkey === 'string') {
      hubPubkey = new anchor.web3.PublicKey(hubPubkey)
    }
    const program = NinaSdk.client.program
    const hub = await program.account.hub.fetch(hubPubkey)
    let hubTokenAccount = await findAssociatedTokenAddress(
      hub.hubSigner,
      new anchor.web3.PublicKey(ids.mints.usdc)
    )
    const hubFeePendingAmount =
      await provider.connection.getTokenAccountBalance(hubTokenAccount)
    return hubFeePendingAmount.value.uiAmount
  }

  const filterHubsAll = () => {
    const allHubsArray = []
    allHubs.forEach((hubPubkey) => {
      const hub = hubState[hubPubkey]
      if (hub) {
        allHubsArray.push(hub)
      }
    })
    allHubsArray.sort((a, b) => a.datetime > b.datetime)
    return allHubsArray
  }

  const validateHubHandle = async (handle) => {
    try {
      await initSdkIfNeeded()
      const hub = await NinaSdk.client.Hub.fetch(handle)
      if (hub) {
        alert(
          `A hub with the handle ${handle} all ready exists, please choose a different handle.`
        )
        return false
      }
      return true
    } catch (error) {
      console.warn(error)
      return true
    }
  }

  return {
    getHubs,
    getHub,
    getHubsForUser,
    getHubsForRelease,
    filterHubsForRelease,
    hubInit,
    hubUpdateConfig,
    hubAddCollaborator,
    hubUpdateCollaboratorPermission,
    hubAddRelease,
    hubRemoveCollaborator,
    hubContentToggleVisibility,
    hubWithdraw,
    postInitViaHub,
    postUpdateViaHubPost,
    filterHubCollaboratorsForHub,
    filterHubContentForHub,
    filterHubsForUser,
    filterHubsAll,
    collectRoyaltyForReleaseViaHub,
    getHubPubkeyForHubHandle,
    validateHubHandle,
    filterFeaturedHubs,
    getHubFeePending,
  }
}

export default {
  Context: HubContext,
  Provider: HubContextProvider,
}
