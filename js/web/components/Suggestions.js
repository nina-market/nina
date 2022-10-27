import React, { useContext } from 'react'
import Image from 'next/image'
import { useState, useRef, useMemo } from 'react'
import { imageManager } from '@nina-protocol/nina-internal-sdk/src/utils'
import Link from 'next/link'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import { truncateAddress } from '@nina-protocol/nina-internal-sdk/src/utils/truncateAddress'
const { getImageFromCDN, loader } = imageManager
import Typography from '@mui/material/Typography'
import { useRouter } from 'next/router'
import Subscribe from './Subscribe'
import { useSnackbar } from 'notistack'

const Suggestions = ({ items, itemsTotal, publicKey }) => {
  const router = useRouter()
  const scrollRef = useRef()
  const { enqueueSnackbar } = useSnackbar()

  const handleClick = (e, path) => {
    e.stopPropagation()
    e.preventDefault()
    router.push(path)
  }

  const getSuggestionReason = (item) => {
    let data = { ...item }
    delete data.hub
    const relevanceCounts = Object.fromEntries(
      Object.entries(data).sort(([, a], [, b]) => a - b)
    )
    const reason = Object.entries(relevanceCounts).pop()
    if (reason) {
      const reasonMessage = suggestionCopyFormatter(reason[0], reason[1])
      return reasonMessage
    }
    return
  }

  const suggestionCopyFormatter = (reason, count) => {
    const pluralize = count > 1
    const suggestions = {
      collectedCount: `This Hub has ${count} release${
        pluralize ? 's' : ''
      } you’ve collected`,
      publishedCount: `This Hub has ${count} release${
        pluralize ? 's' : ''
      } you’ve published`,
      hubSubscriptionCount: `This Hub is followed by people ${count} you follow`,
      collectorHubCount: `${count} of your collector${
        pluralize ? 's' : ''
      } are part of this Hub`,
      hubReleaseCount: ` Releases on your Hub are also on this Hub`,
    }
    if (suggestions[reason]) {
      return suggestions[reason]
    }
  }

  const feedItems = useMemo(() => {
    const feedItemComponents = items?.map((item, i) => {
      const hub = item.hub
      const reason = getSuggestionReason(item)
      return (
        <SuggestionItem key={i}>
          <ImageWrapper>
            <Image
              height={100}
              width={100}
              src={getImageFromCDN(
                hub.data?.image,
                100,
                Date.parse(hub.datetime)
                )}
                alt={i}
                priority={true}
                loader={loader}
                unoptimized={true}
                onClick={(e) => handleClick(e, `/hubs/${hub?.handle}`)}
                />
          </ImageWrapper>

          <CopyWrapper>
            <Typography my={1}>
              <Link href={`/hubs/${hub?.handle}`} passHref>
                {`${hub.data.displayName}`}
              </Link>{' '}
              created by{' '}
              <Link href={`/profiles/${hub.authority}`} passHref>
                {`${truncateAddress(hub?.authority)}`}
              </Link>
            </Typography>
            {publicKey && (
              <Typography my={1} variant="body1">{reason}</Typography>
            )}

            <Subscribe
              accountAddress={hub.publicKey}
              hubHandle={hub.handle}
              inFeed={true}
            />
          </CopyWrapper>
        </SuggestionItem>
      )
    })
    return feedItemComponents
  }, [items])

  return (
    <ScrollWrapper>
      <Box>
        <FeedWrapper ref={scrollRef}>
          {!publicKey && (
            <Typography my={1} variant="body1">
              Connect your wallet to begin following hubs.
            </Typography>
          )}

          {feedItems &&
            feedItems?.map((item, index) => (
              <CardWrapper key={index}>{item}</CardWrapper>
            ))}
        </FeedWrapper>
        {itemsTotal === items?.length && (
          <Typography variant="h4" sx={{ textAlign: 'center' }}>
            No more items
          </Typography>
        )}
      </Box>
    </ScrollWrapper>
  )
}

const ScrollWrapper = styled(Box)(({ theme }) => ({
  overflowY: 'scroll',
  overflowX: 'hidden',
  '&::-webkit-scrollbar': {
    display: 'none' /* Safari and Chrome */,
  },
  [theme.breakpoints.down('md')]: {
    width: '100vw',
    padding: '100px 0px',
    overflowY: 'scroll',
  },
}))

const FeedWrapper = styled(Box)(({ theme }) => ({
  padding: '15px',
  marginTop: '30px',
  minHeight: '75vh',
  '& a': {
    color: theme.palette.blue,
  },
  [theme.breakpoints.down('md')]: {
    padding: '0px 30px',
    overflowX: 'auto',
    minHeight: '80vh',
  },
}))

const CardWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  '& p': {
    marginTop: '0px',
  }
}))

const SuggestionItem = styled(Box)(({ theme }) => ({
  height: '100px',
  padding: '15px 0',
  margin: '15px 0',
  border: '1px solid',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  display: 'flex',
  '& img': {
    cursor: 'pointer',
  },
}))

const ImageWrapper = styled(Box)(({ theme }) => ({

}))


const CopyWrapper = styled(Box)(({ theme }) => ({
  padding: '0 15px',
}))

export default Suggestions
