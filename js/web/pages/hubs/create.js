import React from 'react'
import HubCreate from '@nina-protocol/nina-internal-sdk/esm/HubCreate'
import Head from 'next/head'
import { styled } from '@mui/material/styles'

const CreateHubPage = () => {
  return (
    <>
      <Head>
        <title>Nina Hubs - Create Hub</title>
        <meta
          name="description"
          content={'Nina Protocol is a digitally native music ecosystem'}
        />
        <meta name="og:type" content="website" />
        <meta name="og:title" content="Nina - Create Hub" />
        <meta
          name="og:description"
          content={'Nina Protocol is a digitally native music ecosystem'}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@ninaprotocol" />
        <meta name="twitter:creator" content="@ninaprotocol" />
        <meta name="twitter:image:type" content="image/png" />
        <meta name="twitter:title" content="Nina Hubs - Create" />
        <meta
          name="twitter:description"
          content={'Nina Protocol is a digitally native music ecosystem'}
        />
        <meta
          name="twitter:image"
          content="https://ninaprotocol.com/images/nina-blue.png"
        />
        <meta
          name="og:image"
          href="https://ninaprotocol.com/images/nina-blue.png"
        />
      </Head>

      <HubCreate update={false} inHubs={false} />
    </>
  )
}

export default CreateHubPage
