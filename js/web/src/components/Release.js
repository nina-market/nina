import React, { useState, useContext, useEffect } from 'react'
import ninaCommon from 'nina-common'
import Button from '@material-ui/core/Button'
import { makeStyles, useTheme } from '@material-ui/core/styles'
import ReleaseCard from './ReleaseCard'
import ReleaseTabs from './ReleaseTabs'

const { ExchangeContext, ReleaseContext } = ninaCommon.contexts

const Release = ({ match }) => {
  const releasePubkey = match.params.releasePubkey
  const classes = useStyles()
  const theme = useTheme()
  const { releaseState, getRelease, getRedeemablesForRelease } =
    useContext(ReleaseContext)
  const { getExchangeHistoryForRelease } = useContext(ExchangeContext)
  const [metadata, setMetadata] = useState(
    releaseState?.metadata[releasePubkey] || null
  )

  useEffect(() => {
    if (!metadata) {
      getRelease(releasePubkey)
    }
    getRedeemablesForRelease(releasePubkey)
    getExchangeHistoryForRelease(releasePubkey)
  }, [])

  useEffect(() => {
    if (releaseState.metadata[releasePubkey]) {
      setMetadata(releaseState.metadata[releasePubkey])
    }
  }, [releaseState?.metadata[releasePubkey]])

  if (metadata && Object.keys(metadata).length === 0) {
    return (
      <div className={`${classes.release}__pendingContainer`}>
        <h1>{`We're still preparing this release for sale, check back soon!`}</h1>
        <Button onClick={() => getRelease(releasePubkey)}>Refresh</Button>
      </div>
    )
  }

  return (
    <>
      <div style={theme.helpers.grid} className={`${classes.release}`}>
        <ReleaseCard
          metadata={metadata}
          preview={false}
          releasePubkey={releasePubkey}
        />
        <div className={classes.releaseControls}>
          <ReleaseTabs releasePubkey={releasePubkey} />
        </div>
      </div>
    </>
  )
}

const useStyles = makeStyles(() => ({
  release: {
    width: '80vw',
    margin: 'auto',
    height: '75vh',
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  releaseControls: {
    margin: 'auto',
    height: '100%',
    width: '80%',
  },
}))

export default Release
