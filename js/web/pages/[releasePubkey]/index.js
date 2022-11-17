import React from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import NinaSdk from '@nina-protocol/js-sdk'
import { initSdkIfNeeded } from "@nina-protocol/nina-internal-sdk/src/utils/sdkInit";
const Release = dynamic(() => import('../../components/Release'))
const NotFound = dynamic(() => import('../../components/NotFound'))

const ReleasePage = (props) => {
  const { metadata } = props

  if (!metadata) {
    return <NotFound />
  }
  return (
    <>
      <Head>
        <title>{`Nina: ${metadata?.properties.artist} - "${metadata?.properties.title}"`}</title>
        <meta
          name="description"
          content={`${metadata?.properties.artist} - "${metadata?.properties.title}": ${metadata?.description} \n Published on Nina.`}
        />
        <meta name="og:type" content="website" />
        <meta
          name="og:title"
          content={`${metadata?.properties.artist} - "${metadata?.properties.title}" on Nina`}
        />
        <meta
          name="og:description"
          content={`${metadata?.properties.artist} - "${metadata?.properties.title}": ${metadata?.description} \n Published on Nina.`}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@ninaprotocol" />
        <meta name="twitter:creator" content="@ninaprotocol" />
        <meta name="twitter:image:type" content="image/jpg" />
        <meta
          name="twitter:title"
          content={`${metadata?.properties.artist} - "${metadata?.properties.title}" on Nina`}
        />
        <meta name="twitter:description" content={metadata?.description} />

        <meta name="twitter:image" content={metadata?.image} />
        <meta name="og:image" content={metadata?.image} />
      </Head>
      <Release metadataSsr={metadata} />
    </>
  )
}

export default ReleasePage

export const getStaticPaths = async () => {
  await initSdkIfNeeded()
  const paths = []
  const { releases } = await NinaSdk.Release.fetchAll({limit: 2000})
  releases.forEach((release) => {
    paths.push({
      params: {
        releasePubkey: release.publicKey,
      },
    })
  })

  return {
    paths,
    fallback: 'blocking',
  }
}

export const getStaticProps = async (context) => {
  const releasePubkey = context.params.releasePubkey

  try {
    await initSdkIfNeeded()
    const { release } = await NinaSdk.Release.fetch(releasePubkey)
    return {
      props: {
        metadata: release.metadata,
        releasePubkey,
      },
      revalidate: 1000,
    }
  } catch (error) {
    console.warn(error)
    return { props: {} }
  }
}
