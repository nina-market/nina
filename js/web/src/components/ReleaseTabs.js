import React, { useState, useEffect, useContext, useRef } from 'react'
import ninaCommon from 'nina-common'
import { useWallet } from '@solana/wallet-adapter-react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import { makeStyles } from '@material-ui/core/styles'
import SettingsIcon from '@material-ui/icons/Settings'
import ReleasePurchase from './ReleasePurchase'

const { Exchange, ReleaseInfo, ReleaseSettings } = ninaCommon.components
const { ExchangeContext, ReleaseContext } = ninaCommon.contexts

const ReleaseTabs = (props) => {
  const { releasePubkey } = props
  const classes = useStyles()
  const wallet = useWallet()
  const { releaseState, getRedemptionRecordsForRelease, redeemableState } =
    useContext(ReleaseContext)
  const { exchangeState } = useContext(ExchangeContext)
  const [redeemables, setRedeemables] = useState()
  const [redemptionRecords, setRedemptionRecords] = useState()
  const [artistAddress, setArtistAddress] = useState()
  const [tabIndex, setTabIndex] = useState(0)
  const [userIsPublisher, setUserIsPublisher] = useState(false)
  const metadata = releaseState.metadata[releasePubkey]
  const tabListRef = useRef()

  useEffect(() => {
    setArtistAddress(
      releaseState.tokenData[releasePubkey]?.authority.toBase58()
    )
    setUserIsPublisher(
      wallet?.publicKey?.toBase58() ===
        releaseState.tokenData[releasePubkey]?.authority.toBase58()
    )
  }, [wallet?.connected, releasePubkey])

  useEffect(() => {
    setRedeemables(redeemableState[releasePubkey])
  }, [wallet?.connected, redeemableState])

  useEffect(() => {
    if (wallet?.connected && userIsPublisher) {
      getRedemptionRecordsForRelease(releasePubkey)
    }
  }, [userIsPublisher])

  useEffect(() => {
    if (
      releaseState.redemptionRecords &&
      releaseState.redemptionRecords[releasePubkey]
    ) {
      setRedemptionRecords(releaseState.redemptionRecords[releasePubkey])
    }
  }, [wallet?.connected, releaseState.redemptionRecords])

  useEffect(() => {
    if (!wallet?.connected) {
      const tabs = tabListRef.current.props.children
      if (tabs.length < 4) {
        setTabIndex(0)
      }
    }
  }, [wallet?.connected])

  return (
    <div className={classes.releaseTabsWrapper}>
      <div className={classes.releaseTabsContainer}>
        <Tabs
          releasePubkey={releasePubkey}
          className={classes.releaseTabs}
          selectedIndex={tabIndex}
          onSelect={(index) => setTabIndex(index)}
        >
          <TabList className={classes.releaseTabsList} ref={tabListRef}>
            <Tab>Buy</Tab>
            <Tab>Market</Tab>
            <Tab>Info</Tab>
            {wallet?.connected && userIsPublisher && (
              <Tab>
                <SettingsIcon fontSize="small" color="secondary" />
              </Tab>
            )}
          </TabList>
          <TabPanel style={{ height: '93%' }}>
            {releasePubkey && <ReleasePurchase releasePubkey={releasePubkey} />}
          </TabPanel>
          <TabPanel style={{ height: '93%' }}>
            <Exchange
              releasePubkey={releasePubkey}
              exchanges={exchangeState.exchanges}
            />
          </TabPanel>
          <TabPanel style={{ height: '93%' }}>
            {releasePubkey && (
              <>
                <ReleaseInfo
                  releasePubkey={releasePubkey}
                  metadata={metadata}
                  artistAddress={artistAddress}
                  userIsPublisher={userIsPublisher}
                  redeemables={redeemables}
                  redemptionRecords={redemptionRecords}
                />
              </>
            )}
          </TabPanel>
          {wallet?.connected && userIsPublisher && (
            <TabPanel style={{ height: '93%' }}>
              <ReleaseSettings
                releasePubkey={releasePubkey}
                inCreateFlow={false}
                redemptionRecords={redemptionRecords}
              />
            </TabPanel>
          )}
        </Tabs>
      </div>
    </div>
  )
}

const useStyles = makeStyles((theme) => ({
  releaseTabsWrapper: {
    border: `${theme.vars.borderWidth} solid ${theme.vars.purpleLight}`,
    borderRadius: `${theme.vars.borderRadius}`,
    height: '100%',
  },
  releaseTabsContainer: {
    padding: '0 1rem',
    height: '94%',
  },
  releaseTabsList: {
    display: 'flex',
    width: '100%',
    borderBottom: `1px solid ${theme.vars.purple}`,
    justifyContent: 'flex-start',
    paddingLeft: '0',
  },
  releaseTabs: {
    height: '100%',
  },
}))

export default ReleaseTabs
