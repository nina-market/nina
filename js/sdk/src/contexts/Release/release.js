import React, { createContext, useEffect, useState, useContext } from 'react'
import * as anchor from '@project-serum/anchor'
import NinaSdk from '@nina-protocol/js-sdk'
import promiseRetry from 'promise-retry'

import Nina from '../Nina'
import Wallet from '../Wallet'
import axios from 'axios'
import { ninaErrorHandler } from '../../utils/errors'
import { encryptData } from '../../utils/encrypt'
import releasePurchaseHelper from '../../utils/releasePurchaseHelper'
import { logEvent } from '../../utils/event'
import { initSdkIfNeeded } from '../../utils/sdkInit'
import { getConfirmTransaction } from '../../utils'

const ReleaseContext = createContext()
const ReleaseContextProvider = ({ children }) => {
  const {
    addReleaseToCollection,
    collection,
    getUserBalances,
    usdcBalance,
    removeReleaseFromCollection,
    getSolPrice,
    verficationState,
    setVerificationState,
    solBalance,
  } = useContext(Nina.Context)
  const [releasePurchasePending, setReleasePurchasePending] = useState({})
  const [
    releasePurchaseTransactionPending,
    setReleasePurchaseTransactionPending,
  ] = useState({})
  const { wallet } = useContext(Wallet.Context)
  const [pressingState, setPressingState] = useState(defaultPressingState)
  const [redeemableState, setRedeemableState] = useState({})
  const [searchResults, setSearchResults] = useState(searchResultsInitialState)
  const [releaseState, setReleaseState] = useState({
    metadata: {},
    tokenData: {},
    releaseMintMap: {},
    redemptionRecords: {},
    collectedDates: {},
  })
  const [gatesState, setGatesState] = useState({})
  const [releasesRecentState, setReleasesRecentState] = useState({
    published: [],
    highlights: [],
  })
  const [allReleases, setAllReleases] = useState([])
  const [allReleasesCount, setAllReleasesCount] = useState(null)
  const [fetchedUserProfileReleases, setFetchedUserProfileReleases] = useState(
    {}
  )
  const [pendingReleases, setPendingReleases] = useState({})

  const resetSearchResults = () => {
    setSearchResults(searchResultsInitialState)
  }

  const resetPressingState = () => {
    setPressingState(defaultPressingState)
  }

  const {
    releaseInit,
    releasePurchase,
    closeRelease,
    collectRoyaltyForRelease,
    addRoyaltyRecipient,
    getRelease,
    getReleasesPublishedByUser,
    getReleasesCollectedByUser,
    getReleasesRecent,
    getReleasesAll,
    getReleaseRoyaltiesByUser,
    filterReleasesUserCollection,
    getUserCollectionAndPublished,
    filterReleasesPublishedByUser,
    filterReleasesRecent,
    filterReleasesAll,
    filterRoyaltiesByUser,
    filterReleasesList,
    calculateStatsByUser,
    redeemableInitialize,
    redeemableRedeem,
    redeemableUpdateShipping,
    filterSearchResults,
    getCollectorsForRelease,
    releasePurchaseViaHub,
    initializeReleaseAndMint,
    releaseCreateMetadataJson,
    releaseInitViaHub,
    validateUniqueMd5Digest,
    getFeedForUser,
    trackPendingRelease,
    removePendingRelease,
    fetchGatesForRelease,
  } = releaseContextHelper({
    releaseState,
    setReleaseState,
    pressingState,
    setPressingState,
    releasePurchasePending,
    setReleasePurchasePending,
    usdcBalance,
    getUserBalances,
    addReleaseToCollection,
    encryptData,
    searchResults,
    setSearchResults,
    collection,
    redeemableState,
    setRedeemableState,
    removeReleaseFromCollection,
    releasesRecentState,
    setReleasesRecentState,
    allReleases,
    setAllReleases,
    setAllReleasesCount,
    getSolPrice,
    releasePurchaseTransactionPending,
    setReleasePurchaseTransactionPending,
    fetchedUserProfileReleases,
    setFetchedUserProfileReleases,
    verficationState,
    setVerificationState,
    pendingReleases,
    setPendingReleases,
    solBalance,
    setGatesState,
    gatesState,
    wallet,
  })

  useEffect(() => {
    initSdkIfNeeded()

    if (wallet.connected) {
      let releaseCreationPending = localStorage.getItem(
        'release_creation_pending'
      )
      if (releaseCreationPending) {
        releaseCreationPending = JSON.parse(releaseCreationPending)
        setPendingReleases(releaseCreationPending)
        Object.keys(releaseCreationPending).forEach((releasePublicKey) => {
          const pendingRelease = releaseCreationPending[releasePublicKey]
          if (pendingRelease.wallet === wallet.publicKey.toBase58()) {
            trackPendingRelease({
              releasePublicKey: new anchor.web3.PublicKey(releasePublicKey),
              artist: pendingRelease.artist,
              title: pendingRelease.title,
              wallet: wallet.publicKey.toBase58(),
              date: pendingRelease.date,
              status: 'pending',
            })
          }
        })
      } else {
        setPendingReleases({})
      }
    }
  }, [wallet.connected])

  return (
    <ReleaseContext.Provider
      value={{
        pressingState,
        resetPressingState,
        releaseInit,
        closeRelease,
        releasePurchase,
        releasePurchasePending,
        releaseState,
        setReleaseState,
        collectRoyaltyForRelease,
        addRoyaltyRecipient,
        getRelease,
        getReleasesPublishedByUser,
        getReleasesCollectedByUser,
        getReleasesRecent,
        getReleasesAll,
        getReleaseRoyaltiesByUser,
        getUserCollectionAndPublished,
        filterReleasesUserCollection,
        filterReleasesPublishedByUser,
        filterRoyaltiesByUser,
        filterReleasesList,
        calculateStatsByUser,
        redeemableInitialize,
        redeemableRedeem,
        searchResults,
        resetSearchResults,
        redeemableUpdateShipping,
        releasesRecentState,
        filterReleasesRecent,
        filterReleasesAll,
        allReleases,
        allReleasesCount,
        filterSearchResults,
        setSearchResults,
        getCollectorsForRelease,
        releasePurchaseViaHub,
        initializeReleaseAndMint,
        releaseCreateMetadataJson,
        releaseInitViaHub,
        releasePurchaseTransactionPending,
        validateUniqueMd5Digest,
        getFeedForUser,
        fetchedUserProfileReleases,
        pendingReleases,
        removePendingRelease,
        fetchGatesForRelease,
        gatesState,
      }}
    >
      {children}
    </ReleaseContext.Provider>
  )
}

const releaseContextHelper = ({
  releaseState,
  setReleaseState,
  pressingState,
  setPressingState,
  releasePurchasePending,
  setReleasePurchasePending,
  addReleaseToCollection,
  usdcBalance,
  getUserBalances,
  collection,
  releasesRecentState,
  setReleasesRecentState,
  allReleases,
  setAllReleases,
  setAllReleasesCount,
  releasePurchaseTransactionPending,
  setReleasePurchaseTransactionPending,
  fetchedUserProfileReleases,
  setFetchedUserProfileReleases,
  verificationState,
  setVerificationState,
  setPendingReleases,
  solBalance,
  setGatesState,
  gatesState,
}) => {
  const {  NINA_CLIENT_IDS, nativeToUi, isSol, isUsdc } = NinaSdk.utils
  const { provider } = NinaSdk.client
  const ids = NINA_CLIENT_IDS[process.env.SOLANA_CLUSTER]

  const initializeReleaseAndMint = async (hubPubkey) => {
    const release = await NinaSdk.client.Release.initializeReleaseAndMint(
      hubPubkey
    )
    return release
  }

  const releaseInitViaHub = async ({
    hubPubkey,
    retailPrice,
    amount,
    resalePercentage,
    isUsdc = true,
    metadataUri,
    artist,
    title,
    catalogNumber,
    release,
    releaseBump,
    releaseMint,
    isOpen,
  }) => {
    try {
      logEvent('release_init_initiated', 'engagement', {
        publicKey: release.toBase58(),
        wallet: provider.wallet.publicKey.toBase58(),
      })
      const newRelease = await NinaSdk.client.Release.releaseInitViaHub(
        hubPubkey,
        retailPrice,
        amount,
        resalePercentage,
        isUsdc,
        metadataUri,
        artist,
        title,
        catalogNumber,
        release,
        releaseBump,
        releaseMint,
        isOpen
      )

      setPressingState({
        ...pressingState,
        pending: false,
        completed: true,
      })

      logEvent('release_init_success', 'engagement', {
        publicKey: release.toBase58(),
        wallet: provider.wallet.publicKey.toBase58(),
      })

      return newRelease
    } catch (error) {
      if (error.toString().includes('unable_to_confirm_transaction')) {
        trackPendingRelease({
          releasePublicKey: release,
          artist,
          title,
          wallet: provider.wallet.publicKey.toBase58(),
          date: new Date(),
        })
      }
      logEvent('release_init_via_hub_failure', 'engagement', {
        publicKey: release.toBase58(),
        wallet: provider.wallet.publicKey.toBase58(),
        solBalance,
      })

      return ninaErrorHandler(error)
    }
  }

  const releasePurchaseViaHub = async (releasePubkey, hubPubkey) => {
    try {
      setReleasePurchaseTransactionPending({
        ...releasePurchaseTransactionPending,
        [releasePubkey]: true,
      })

      logEvent('release_purchase_via_hub_initiated', 'engagement', {
        publicKey: releasePubkey,
        hub: hubPubkey,
        wallet: provider.wallet.publicKey.toBase58(),
      })

      setReleasePurchasePending({
        ...releasePurchasePending,
        [releasePubkey]: true,
      })

      setReleasePurchaseTransactionPending({
        ...releasePurchaseTransactionPending,
        [releasePubkey]: false,
      })

      const txId = await releasePurchaseHelper(
        releasePubkey,
        provider,
        usdcBalance,
        hubPubkey
      )

      await getConfirmTransaction(txId, provider.connection)

      setReleasePurchasePending({
        ...releasePurchasePending,
        [releasePubkey]: false,
      })

      getUserBalances()
      await axios.get(
        `${
          process.env.NINA_API_ENDPOINT
        }/accounts/${provider.wallet.publicKey.toBase58()}/collected?txId=${txId}`
      )
      await getRelease(releasePubkey)
      addReleaseToCollection(releasePubkey)

      logEvent('release_purchase_via_hub_success', 'engagement', {
        publicKey: releasePubkey,
        hub: hubPubkey,
        wallet: provider.wallet.publicKey.toBase58(),
      })

      return {
        success: true,
        msg: 'Release purchased!',
      }
    } catch (error) {
      getUserBalances()
      getRelease(releasePubkey)
      setReleasePurchasePending({
        ...releasePurchasePending,
        [releasePubkey]: false,
      })
      setReleasePurchaseTransactionPending({
        ...releasePurchaseTransactionPending,
        [releasePubkey]: false,
      })
      logEvent('release_purchase_via_hub_failure', 'engagement', {
        publicKey: releasePubkey,
        hub: hubPubkey,
        wallet: provider.wallet.publicKey.toBase58(),
        solBalance,
      })
      return ninaErrorHandler(error)
    }
  }

  const releaseInit = async ({
    retailPrice,
    amount,
    resalePercentage,
    artist,
    title,
    catalogNumber,
    metadataUri,
    isUsdc = true,
    release,
    releaseBump,
    releaseMint,
    isOpen,
  }) => {
    setPressingState({
      ...pressingState,
      pending: true,
    })

    try {
      logEvent('release_init_initiated', 'engagement', {
        publicKey: release.toBase58(),
        wallet: provider.wallet.publicKey.toBase58(),
      })
      const newRelease = await NinaSdk.client.Release.releaseInit(
        retailPrice,
        amount,
        resalePercentage,
        artist,
        title,
        catalogNumber,
        metadataUri,
        isUsdc,
        release,
        releaseBump,
        releaseMint,
        isOpen
      )
      const releasePubkey = newRelease.release.release.publicKey
      await getRelease(releasePubkey)

      setPressingState({
        ...pressingState,
        pending: false,
        completed: true,
      })

      logEvent('release_init_success', 'engagement', {
        publicKey: release.toBase58(),
        wallet: provider.wallet.publicKey.toBase58(),
      })

      return newRelease
    } catch (error) {
      if (error.toString().includes('unable_to_confirm_transaction')) {
        trackPendingRelease({
          releasePublicKey: release,
          artist,
          title,
          wallet: provider.wallet.publicKey.toBase58(),
          fate: new Date(),
        })
      }

      setPressingState({
        pending: false,
        completed: false,
      })

      logEvent('release_init_failure', 'engagement', {
        publicKey: release.toBase58(),
        wallet: provider.wallet.publicKey.toBase58(),
        solBalance,
      })
      return ninaErrorHandler(error)
    }
  }

  const closeRelease = async (releasePubkey) => {
    try {
      const closedRelease = await NinaSdk.client.Release.closeRelease(
        releasePubkey
      )
      releasePubkey = closedRelease.release.release.publicKey
      await getRelease(releasePubkey)

      return {
        success: true,
        msg: 'Release closed',
      }
    } catch (error) {
      return ninaErrorHandler(error)
    }
  }

  const releasePurchase = async (releasePubkey) => {
    logEvent('release_purchase_initiated', 'engagement', {
      publicKey: releasePubkey,
      wallet: provider.wallet.publicKey.toBase58(),
    })

    setReleasePurchaseTransactionPending({
      ...releasePurchaseTransactionPending,
      [releasePubkey]: true,
    })

    setReleasePurchasePending({
      ...releasePurchasePending,
      [releasePubkey]: true,
    })

    try {
      setReleasePurchaseTransactionPending({
        ...releasePurchaseTransactionPending,
        [releasePubkey]: false,
      })

      const txId = await releasePurchaseHelper(
        releasePubkey,
        provider,
        usdcBalance
      )
      await getConfirmTransaction(txId, provider.connection)
      await getUserBalances()

      await axios.get(
        `${
          process.env.NINA_API_ENDPOINT
        }/accounts/${provider.wallet.publicKey.toBase58()}/collected?txId=${txId}`
      )
      await getRelease(releasePubkey)
      await addReleaseToCollection(releasePubkey)

      setReleasePurchasePending({
        ...releasePurchasePending,
        [releasePubkey]: false,
      })

      logEvent('release_purchase_success', 'engagement', {
        publicKey: releasePubkey,
        wallet: provider.wallet.publicKey.toBase58(),
      })

      return {
        success: true,
        msg: 'Release purchased!',
      }
    } catch (error) {
      getUserBalances()
      getRelease(releasePubkey)
      setReleasePurchasePending({
        ...releasePurchasePending,
        [releasePubkey]: false,
      })

      setReleasePurchaseTransactionPending({
        ...releasePurchaseTransactionPending,
        [releasePubkey]: false,
      })

      logEvent('release_purchase_failure', 'engagement', {
        publicKey: releasePubkey,
        wallet: provider.wallet.publicKey.toBase58(),
        solBalance,
      })

      return ninaErrorHandler(error)
    }
  }

  const collectRoyaltyForRelease = async (recipient, releasePubkey) => {
    if (!releasePubkey || !recipient) {
      return
    }
    try {
      const collectedRelease = await NinaSdk.client.Release.collectRoyaltyForRelease(
        recipient,
        releasePubkey,
        releaseState
      )
      releasePubkey = collectedRelease.release.release.publicKey
      await getRelease(releasePubkey)
      await getUserBalances()
      return {
        success: true,
        msg: `You collected $${nativeToUi(recipient.owed, ids.mints.usdc)}`,
      }
    } catch (error) {
      console.warn(error)
      getUserBalances()
      getRelease(releasePubkey)
      return ninaErrorHandler(error)
    }
  }

  const addRoyaltyRecipient = async (release, updateData, releasePubkey) => {
    try {
      const royaltyRecipient = await NinaSdk.client.Release.addRoyaltyRecipient(
        release,
        updateData,
        releasePubkey
      )
      releasePubkey = royaltyRecipient.release.release.publicKey
      getRelease(releasePubkey)
      getUserBalances()

      return {
        success: true,
        msg: `Revenue share transferred.`,
      }
    } catch (error) {
      getRelease(releasePubkey)
      getUserBalances()
      return ninaErrorHandler(error)
    }
  }

  /*

  RELEASE PROGRAM LOOKUPS

  */

  const getRelease = async (releasePubkey) => {
    try {
      const { release } = await NinaSdk.client.Release.fetch(releasePubkey, true)
      const newState = updateStateForReleases([release])
      setReleaseState((prevState) => ({
        ...prevState,
        tokenData: { ...prevState.tokenData, ...newState.tokenData },
        metadata: { ...prevState.metadata, ...newState.metadata },
        releaseMintMap: {
          ...prevState.releaseMintMap,
          ...newState.releaseMintMap,
        },
      }))
    } catch (error) {
      console.warn(error)
    }
  }

  const getReleasesPublishedByUser = async (
    publicKey,
    withAccountData = false
  ) => {
    try {
      const { published } = await NinaSdk.client.Account.fetchPublished(
        publicKey,
        withAccountData
      )
      const newState = updateStateForReleases(published)
      setReleaseState((prevState) => ({
        ...prevState,
        tokenData: { ...prevState.tokenData, ...newState.tokenData },
        metadata: { ...prevState.metadata, ...newState.metadata },
        releaseMintMap: {
          ...prevState.releaseMintMap,
          ...newState.releaseMintMap,
        },
      }))
    } catch (error) {
      console.warn(error)
    }
  }

  const getReleasesCollectedByUser = async (publicKey) => {
    try {
      const { collected } = await NinaSdk.client.Account.fetchCollected(publicKey)
      const newState = updateStateForReleases(collected)
      setReleaseState((prevState) => ({
        ...prevState,
        tokenData: { ...prevState.tokenData, ...newState.tokenData },
        metadata: { ...prevState.metadata, ...newState.metadata },
        releaseMintMap: {
          ...prevState.releaseMintMap,
          ...newState.releaseMintMap,
        },
      }))
    } catch (error) {
      console.warn(error)
    }
  }

  const getUserCollectionAndPublished = async (
    publicKey,
    withAccountData = false
  ) => {
    try {
      const { collected } = await NinaSdk.client.Account.fetchCollected(
        publicKey,
        withAccountData
      )
      const { published } = await NinaSdk.client.Account.fetchPublished(
        publicKey,
        withAccountData
      )
      const { revenueShares } = await NinaSdk.client.Account.fetchRevenueShares(
        publicKey,
        withAccountData
      )
      const newState = updateStateForReleases([
        ...published,
        ...revenueShares,
        ...collected,
      ])
      setReleaseState((prevState) => ({
        ...prevState,
        tokenData: { ...prevState.tokenData, ...newState.tokenData },
        metadata: { ...prevState.metadata, ...newState.metadata },
        releaseMintMap: {
          ...prevState.releaseMintMap,
          ...newState.releaseMintMap,
        },
        collectedDates: {
          ...prevState.collectedDates,
          ...newState.collectedDates,
        },
      }))

      const publishedAndRevenueShares = [...published, ...revenueShares].filter(
        (value, index, self) => {
          return (
            self.findIndex((value2) => value2.publicKey === value.publicKey) ===
            index
          )
        }
      )
      setFetchedUserProfileReleases({
        ...fetchedUserProfileReleases,
        [publicKey]: {
          collected: collected.map((release) => release.publicKey),
          published: publishedAndRevenueShares.map(
            (release) => release.publicKey
          ),
        },
      })

      return [collected, publishedAndRevenueShares]
    } catch (error) {
      console.warn(error)
      return [[], []]
    }
  }

  const getReleaseRoyaltiesByUser = async (publicKey) => {
    try {
      const { revenueShares } = await NinaSdk.client.Account.fetchRevenueShares(
        publicKey,
        true
      )
      const newState = updateStateForReleases(revenueShares)
      setReleaseState((prevState) => ({
        ...prevState,
        tokenData: { ...prevState.tokenData, ...newState.tokenData },
        metadata: { ...prevState.metadata, ...newState.metadata },
        releaseMintMap: {
          ...prevState.releaseMintMap,
          ...newState.releaseMintMap,
        },
      }))
    } catch (error) {
      console.warn(error)
    }
  }

  const updateStateForReleases = (releases) => {
    const updatedReleaseState = {
      tokenData: {},
      metadata: {},
      releaseMintMap: {},
      collectedDates: {},
    }
    releases.forEach((release) => {
      if (release.accountData) {
        updatedReleaseState.tokenData[release.publicKey] = {
          ...release.accountData.release,
        }
      }
      updatedReleaseState.metadata[release.publicKey] = {
        ...release.metadata,
        publishedThroughHub: release.publishedThroughHub || undefined,
      }
      updatedReleaseState.releaseMintMap[release.publicKey] = release.mint
      if (release.collectedDate) {
        updatedReleaseState.collectedDates[release.publicKey] =
          release.collectedDate
      }
    })
    return updatedReleaseState
  }

  const getReleasesRecent = async (
    params = undefined,
    withAccountData = true
  ) => {
    try {
      await initSdkIfNeeded()
      const highlightsHubPubkey =
        process.env.REACT_APP_CLUSTER === 'devnet'
          ? '4xHeZW8BK8HeCinoDLsGiGwtYsjQ9zBb71m5vdDa5ceS'
          : '4QECgzp8hjknK3pvPEMoXATywcsNnH4MU49tVvDWLgKg'
      const published = []

      let highlights = (
        await NinaSdk.client.Hub.fetchReleases(
          highlightsHubPubkey,
          withAccountData,
          params
        )
      ).releases

      const allReleases = [...published, ...highlights]
      setAllReleasesCount(published.total)
      const newState = updateStateForReleases(allReleases)
      setReleaseState((prevState) => ({
        ...prevState,
        tokenData: { ...prevState.tokenData, ...newState.tokenData },
        metadata: { ...prevState.metadata, ...newState.metadata },
        releaseMintMap: {
          ...prevState.releaseMintMap,
          ...newState.releaseMintMap,
        },
      }))

      highlights = highlights.sort(
        (a, b) => b.metadata.properties.date - a.metadata.properties.date
      )
      setReleasesRecentState({
        published: published.map((release) => release.publicKey),
        highlights: highlights.map((release) => release.publicKey),
      })
    } catch (error) {
      console.warn(error)
    }
  }

  const getReleasesAll = async () => {
    try {
      const all = [...allReleases]

      const releases = (
        await NinaSdk.client.Release.fetchAll(
          { limit: 25, offset: allReleases.length },
          true
        )
      ).releases
      console.log('releases', releases)
      all.push(...releases.map((release) => release.publicKey))

      const newState = updateStateForReleases(releases)

      setReleaseState((prevState) => ({
        ...prevState,
        tokenData: { ...prevState.tokenData, ...newState.tokenData },
        metadata: { ...prevState.metadata, ...newState.metadata },
        releaseMintMap: {
          ...prevState.releaseMintMap,
          ...newState.releaseMintMap,
        },
      }))

      setAllReleasesCount(releases.total)
      setAllReleases(all)
    } catch (error) {
      console.warn(error)
    }
  }

  const getCollectorsForRelease = async (releasePubkey) => {
    const { collectors } = await NinaSdk.client.Release.fetchCollectors(releasePubkey)
    const updatedVerificationState = { ...verificationState }
    return collectors.map((collector) => {
      if (collector.verifications.length > 0) {
        updatedVerificationState[collector.publicKey] = collector.verifications
      }
      setVerificationState((prevState) => ({
        ...prevState,
        ...updatedVerificationState,
      }))
      return collector.publicKey
    })
  }

  const getFeedForUser = async (publicKey, offset) => {
    try {
      const { data } = await axios.get(
        `${process.env.NINA_API_ENDPOINT}/accounts/${publicKey}/feed?offset=${offset}`
      )

      const releases = []
      const updatedVerificationState = {}

      data.feedItems.forEach((feedItem) => {
        if (feedItem.release) {
          releases.push(feedItem.release)
        }
        if (feedItem.authority.verifications.length > 0) {
          updatedVerificationState[feedItem.authority.publicKey] =
            feedItem.authority.verifications
        }
        if (feedItem.toAccount?.verifications?.length > 0) {
          updatedVerificationState[feedItem.toAccount.publicKey] =
            feedItem.toAccount.verifications
        }
      })
      setVerificationState((prevState) => ({
        ...prevState,
        ...updatedVerificationState,
      }))
      const newState = updateStateForReleases(releases)
      setReleaseState((prevState) => ({
        ...prevState,
        tokenData: { ...prevState.tokenData, ...newState.tokenData },
        metadata: { ...prevState.metadata, ...newState.metadata },
        releaseMintMap: {
          ...prevState.releaseMintMap,
          ...newState.releaseMintMap,
        },
      }))

      return data
    } catch (error) {
      console.warn(error)
    }
  }

  /*

  STATE FILTERS

  */

  const filterReleasesUserCollection = (publicKey = undefined) => {
    if (!publicKey && !provider.wallet?.connected) {
      return []
    }
    let releasePublicKeys
    if (publicKey) {
      releasePublicKeys = fetchedUserProfileReleases[publicKey].collected
    } else {
      releasePublicKeys = Object.keys(collection)
    }
    const releases = []
    releasePublicKeys?.forEach((releasePubkey) => {
      const tokenData = releaseState.tokenData[releasePubkey]
      const metadata = releaseState.metadata[releasePubkey]
      metadata.collectedDate = releaseState.collectedDates[releasePubkey]
      if (metadata) {
        releases.push({ tokenData, metadata, releasePubkey })
      }
    })

    return releases
  }

  const filterReleasesList = (releaseList) => {
    const releases = []
    releaseList?.forEach((releasePubkey) => {
      const tokenData = releaseState.tokenData[releasePubkey]
      const metadata = releaseState.metadata[releasePubkey]
      if (metadata) {
        releases.push({ tokenData, metadata, releasePubkey })
      }
    })
    return releases
  }

  const filterReleasesRecent = () => {
    const releasesPublished = []
    releasesRecentState.published.forEach((releasePubkey) => {
      const tokenData = releaseState.tokenData[releasePubkey]
      const metadata = releaseState.metadata[releasePubkey]
      if (metadata) {
        releasesPublished.push({ tokenData, metadata, releasePubkey })
      }
    })

    const releasesHighlights = []
    releasesRecentState.highlights.forEach((releasePubkey) => {
      const tokenData = releaseState.tokenData[releasePubkey]
      const metadata = releaseState.metadata[releasePubkey]
      if (metadata) {
        releasesHighlights.push({ tokenData, metadata, releasePubkey })
      }
    })
    return {
      published: releasesPublished,
      highlights: releasesHighlights,
    }
  }

  const filterReleasesAll = () => {
    const allReleasesArray = []
    allReleases.forEach((releasePubkey) => {
      const tokenData = releaseState.tokenData[releasePubkey]
      const metadata = releaseState.metadata[releasePubkey]
      if (metadata) {
        allReleasesArray.push({ tokenData, metadata, releasePubkey })
      }
    })
    allReleasesArray.sort(
      (a, b) => a.tokenData.releaseDatetime > b.tokenData.releaseDatetime
    )
    return allReleasesArray
  }

  const filterSearchResults = (releaseIds) => {
    if (!releaseIds) {
      return
    }
    const resultArray = []
    releaseIds.forEach((releasePubkey) => {
      const tokenData = releaseState.tokenData[releasePubkey]
      const metadata = releaseState.metadata[releasePubkey]
      if (metadata) {
        resultArray.push({ tokenData, metadata, releasePubkey })
      }
    })
    resultArray.sort(
      (a, b) => a.tokenData.releaseDatetime > b.tokenData.releaseDatetime
    )
    return resultArray
  }

  const filterReleasesPublishedByUser = (userPubkey = undefined) => {
    // Return results for passed in user if another user isn't specified
    if (!userPubkey) {
      userPubkey = provider.wallet?.publicKey.toBase58()
    }

    const releases = []
    Object.keys(releaseState.tokenData).forEach((releasePubkey) => {
      const tokenData = releaseState.tokenData[releasePubkey]
      const metadata = releaseState.metadata[releasePubkey]

      const releaseData = {}

      if (tokenData.authority === userPubkey && metadata) {
        releaseData.tokenData = tokenData
        releaseData.metadata = metadata
        releaseData.releasePubkey = releasePubkey
      }

      tokenData.revenueShareRecipients.forEach((recipient) => {
        if (recipient.recipientAuthority === userPubkey && metadata) {
          releaseData.recipient = recipient
          releaseData.tokenData = tokenData
          releaseData.metadata = metadata
          releaseData.releasePubkey = releasePubkey
        }
      })

      if (Object.keys(releaseData).length > 0) {
        releases.push(releaseData)
      }
    })

    return releases
  }

  const filterRoyaltiesByUser = (userPubkey = undefined) => {
    if (
      !provider.wallet?.connected ||
      (!userPubkey && !provider.wallet?.publicKey)
    ) {
      return
    }
    // Return results for passed in user if another user isn't specified
    if (!userPubkey) {
      userPubkey = provider.wallet?.publicKey.toBase58()
    }

    const releases = []
    Object.keys(releaseState.tokenData).forEach((releasePubkey) => {
      const tokenData = releaseState.tokenData[releasePubkey]
      const metadata = releaseState.metadata[releasePubkey]
      tokenData.royaltyRecipients.forEach((recipient) => {
        if (recipient.recipientAuthority === userPubkey && metadata) {
          releases.push({ tokenData, metadata, releasePubkey, recipient })
        }
      })
    })
    return releases
  }

  const calculateRoyaltyStatsForUser = (userPubkey = undefined) => {
    let royaltyUncollected = []
    let royaltyOwed = 0
    let royaltyCollected = 0
    let royaltyCount = 0

    filterRoyaltiesByUser(userPubkey).forEach((release) => {
      release.royaltyRecipients.forEach((recipient) => {
        if (recipient.recipientAuthority === userPubkey) {
          royaltyCount += 1
          const owed = recipient.owed
          if (owed > 0) {
            royaltyUncollected.push(release)
            royaltyOwed += nativeToUi(owed, release.paymentMint)
          }
          royaltyCollected += nativeToUi(
            recipient.collected,
            release.paymentMint
          )
        }
      })
    })

    return {
      royaltyCount,
      royaltyUncollected,
      royaltyOwed,
      royaltyCollected,
    }
  }

  const calculateReleaseStatsByUser = (userPubkey = undefined) => {
    if (
      !provider.wallet?.connected ||
      (!userPubkey && !provider.wallet?.publicKey)
    ) {
      return
    }
    // Return results for passed in user if another user isn't specified
    if (!userPubkey) {
      userPubkey = provider.wallet?.publicKey.toBase58()
    }

    const releases = filterReleasesPublishedByUser(userPubkey)

    let salesCount = 0
    let salesAmountUsdc = 0
    let salesAmountSol = 0
    let secondarySalesCount = 0
    let secondarySalesAmountUsdc = 0
    let secondarySalesAmountSol = 0

    releases.forEach((release) => {
      if (isUsdc(release.paymentMint)) {
        salesAmountUsdc += release.saleTotal
        secondarySalesAmountUsdc += release.exchangeSaleTotal
      } else if (isSol(release.paymentMint)) {
        salesAmountSol += release.saleTotal
        secondarySalesAmountSol += release.exchangeSaleTotal
      }
      salesCount += release.saleCounter
      secondarySalesCount += release.exchangeSaleCounter
    })

    return {
      publishedCount: releases.length,
      salesCount,
      salesAmountUsdc: nativeToUi(salesAmountUsdc, ids.mints.usdc),
      salesAmountSol: nativeToUi(salesAmountSol, ids.mints.wsol),
      secondarySalesCount,
      secondarySalesAmountUsdc: nativeToUi(
        secondarySalesAmountUsdc,
        ids.mints.usdc
      ),
      secondarySalesAmountSol: nativeToUi(
        secondarySalesAmountSol,
        ids.mints.wsol
      ),
    }
  }

  const calculateStatsByUser = (userPubkey = undefined) => {
    if (
      !provider.wallet?.connected ||
      (!userPubkey && !provider.wallet?.publicKey)
    ) {
      return
    }
    // Return results for passed in user if another user isn't specified
    if (!userPubkey) {
      userPubkey = provider.wallet?.publicKey.toBase58()
    }

    return {
      ...calculateReleaseStatsByUser(userPubkey),
      ...calculateRoyaltyStatsForUser(userPubkey),
    }
  }

  const fetchGatesForRelease = async (releasePubkey) => {
    try {
      const { gates } = (
        await axios.get(
          `${process.env.NINA_GATE_URL}/releases/${releasePubkey}/gates`
        )
      ).data
      if (gates.length > 0) {
        setGatesState((prevState) => ({
          ...prevState,
          [releasePubkey]: gates,
        }))
      } else {
        const prevState = { ...gatesState }
        delete prevState[releasePubkey]
        setGatesState(prevState)
      }

      return gates
    } catch (error) {
      console.warn(error)
    }
  }

  /*

  UTILS

  */

  const releaseCreateMetadataJson = ({
    release,
    artist,
    title,
    sellerFeeBasisPoints,
    catalogNumber,
    description,
    trackTx,
    artworkTx,
    trackType,
    duration,
    md5Digest,
  }) => {
    const name = `${artist} - ${title}`
    let metadata = {
      name,
      symbol: catalogNumber,
      description,
      seller_fee_basis_points: sellerFeeBasisPoints,
      image: `https://www.arweave.net/${artworkTx}`,
      animation_url: `https://www.arweave.net/${trackTx}?ext=mp3`,
      external_url: `https://ninaprotocol.com/${release}`,
      attributes: [],
      collection: {
        name: `${artist} - ${title} (Nina)`,
        family: 'Nina',
      },
      properties: {
        artist: artist,
        title: title,
        date: new Date(),
        md5Digest,
        files: [
          {
            uri: `https://www.arweave.net/${trackTx}`,
            track: 1,
            track_title: title,
            duration: duration,
            type: trackType,
          },
        ],
        category: 'audio',
      },
    }

    return metadata
  }

  const validateUniqueMd5Digest = async (hash) => {
    try {
      if (process.env.SOLANA_CLUSTER === 'devnet') {
        return false
      }
      let path = process.env.NINA_IDENTITY_ENDPOINT + `/hash/${hash}`
      const response = await fetch(path)
      const { release } = await response.json()
      if (release) {
        return release
      } else {
        return false
      }
    } catch (error) {
      console.warn(error)
    }
  }

  // Pending Release Helpers

  const trackPendingRelease = async ({
    releasePublicKey,
    artist,
    title,
    wallet,
    date,
  }) => {
    const releasePublicKeyString = releasePublicKey.toBase58()
    await promiseRetry(
      async (retry) => {
        let pendingRelease = await lookupPendingRelease({
          releasePublicKey,
          artist,
          title,
          wallet,
          date,
        })
        if (!pendingRelease.solanaReleaseExists) {
          // If the release has been pending for more than 5 minutes,
          // remove it from pending releases as it is safe to assume
          // it will never be created on Solana
          const pendingFor5Minutes =
            Date.now() - Date.parse(pendingRelease.date) > 50000
          if (pendingFor5Minutes) {
            updatePendingRelease(releasePublicKeyString, 'failed_solana')
            return releasePublicKeyString
          }
          const error = new Error('release_does_not_exist_on_solana')
          error.releasePublicKey = releasePublicKeyString

          retry(error)
          return
        }

        if (!pendingRelease.ninaReleaseExists) {
          const error = new Error('release_does_not_exist_on_nina')
          error.releasePublicKey = releasePublicKeyString
          retry(error)
          return
        }
        updatePendingRelease(releasePublicKeyString, 'success')

        return releasePublicKeyString
      },
      {
        retries: 60,
        minTimeout: 1000,
        maxTimeout: 5000,
      }
    )
  }

  const removePendingRelease = async (releasePublicKey) => {
    let releaseCreationPending = localStorage.getItem(
      'release_creation_pending'
    )

    if (releaseCreationPending) {
      releaseCreationPending = JSON.parse(releaseCreationPending)
      delete releaseCreationPending[releasePublicKey]
      localStorage.setItem(
        'release_creation_pending',
        JSON.stringify(releaseCreationPending)
      )
      logEvent('pending_release_removed', 'engagement', {
        releaseCreationPending,
      })

      setPendingReleases(releaseCreationPending)
    }
  }

  const updatePendingRelease = async (releasePublicKey, status) => {
    let releaseCreationPending = localStorage.getItem(
      'release_creation_pending'
    )

    if (releaseCreationPending) {
      releaseCreationPending = JSON.parse(releaseCreationPending)
      releaseCreationPending[releasePublicKey].status = status
      localStorage.setItem(
        'release_creation_pending',
        JSON.stringify(releaseCreationPending)
      )
      setPendingReleases(releaseCreationPending)
    }
    await getRelease(releasePublicKey)
  }

  const lookupPendingRelease = async ({
    releasePublicKey,
    artist,
    title,
    wallet,
    date,
  }) => {
    await initSdkIfNeeded()
    const solanaAccount = await NinaSdk.client.program.account.release.fetch(
      releasePublicKey,
      'confirmed'
    )
    const releasePublicKeyString = releasePublicKey.toBase58()
    const ninaRelease = await NinaSdk.client.Release.fetch(releasePublicKeyString)
    let releaseCreationPending = localStorage.getItem(
      'release_creation_pending'
    )
    if (!releaseCreationPending) {
      releaseCreationPending = {}
    } else {
      releaseCreationPending = JSON.parse(releaseCreationPending)
    }

    let pendingRelease = releaseCreationPending[releasePublicKeyString]
    if (pendingRelease) {
      pendingRelease.ninaReleaseExists = ninaRelease.release ? true : false
      pendingRelease.solanaReleaseExists = solanaAccount ? true : false
    } else {
      pendingRelease = {
        artist,
        title,
        ninaReleaseExists: ninaRelease.release ? true : false,
        solanaReleaseExists: solanaAccount ? true : false,
        date,
        wallet,
        status: 'pending',
      }
    }

    const updatedReleaseCreationPending = {
      ...releaseCreationPending,
      [releasePublicKeyString]: pendingRelease,
    }

    setPendingReleases((prevState) => {
      return {
        ...prevState,
        [releasePublicKeyString]: pendingRelease,
      }
    })

    localStorage.setItem(
      'release_creation_pending',
      JSON.stringify(updatedReleaseCreationPending)
    )

    return pendingRelease
  }

  return {
    releaseInitViaHub,
    releasePurchaseViaHub,
    addRoyaltyRecipient,
    releaseInit,
    closeRelease,
    releasePurchase,
    collectRoyaltyForRelease,
    getRelease,
    getReleasesPublishedByUser,
    getReleasesCollectedByUser,
    getReleasesRecent,
    getReleasesAll,
    getReleaseRoyaltiesByUser,
    getUserCollectionAndPublished,
    filterReleasesUserCollection,
    filterReleasesPublishedByUser,
    filterReleasesRecent,
    filterReleasesAll,
    filterReleasesList,
    filterRoyaltiesByUser,
    calculateStatsByUser,
    filterSearchResults,
    getCollectorsForRelease,
    initializeReleaseAndMint,
    releaseCreateMetadataJson,
    validateUniqueMd5Digest,
    getFeedForUser,
    trackPendingRelease,
    removePendingRelease,
    fetchGatesForRelease,
  }
}

const defaultPressingState = {
  releasePubkey: undefined,
  completed: false,
  pending: false,
}

const searchResultsInitialState = {
  releaseIds: [],
  releases: [],
  searched: false,
  pending: false,
  query: null,
}

export default {
  Context: ReleaseContext,
  Provider: ReleaseContextProvider,
}
