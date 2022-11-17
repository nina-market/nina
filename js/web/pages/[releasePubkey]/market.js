import Head from 'next/head'
import dynamic from 'next/dynamic'
import Release from '../../components/Release'
import NinaSdk from '@nina-protocol/js-sdk'
const NotFound = dynamic(() => import('../../components/NotFound'))

const ReleaseMarketPage = (props) => {
  const { metadata } = props
  if (!metadata) {
    return <NotFound />
  }
  return (
    <>
      <Head>
        <title>{`Nina: ${metadata?.properties.artist} - ${metadata?.properties.title} (Market)`}</title>
        <meta
          name="description"
          content={`Secondary Market for ${metadata?.properties.artist} - ${metadata?.properties.title}. \n Published on Nina.`}
        />
        <meta name="og:type" content="website" />
        <meta
          name="og:title"
          content={`Nina: ${metadata?.properties.artist} - ${metadata?.properties.title} (Market)`}
        />
        <meta
          name="og:description"
          content={`Secondary Market for ${metadata?.properties.artist} - ${metadata?.properties.title}. \n Published on Nina.`}
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
      <Release {...props} />
    </>
  )
}

export const getStaticPaths = async () => {
  if (!NinaSdk.client.program) {
    await NinaSdk.client.init(
      process.env.NINA_API_ENDPOINT,
      process.env.SOLANA_CLUSTER_URL,
      process.env.NINA_PROGRAM_ID
    )
  }

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

export default ReleaseMarketPage
