import React, {useContext, useEffect, useMemo} from 'react'
import nina from '@nina-protocol/nina-sdk'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import { styled } from '@mui/material/styles'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/router'
import Dots from './Dots'
import Image from "next/image";


const { HubContext, NinaContext } = nina.contexts

const Hubs = () => {
  const { getHubs, hubState } = useContext(HubContext)
  const wallet = useWallet()

  useEffect(() => {
    getHubs()
  }, [])
  
  const hubs = useMemo(() => {
    return Object.values(hubState)
  }, [hubState])


  if (hubs.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '250px',
        }}
      >
        <Dots size="80px" />
      </Box>
    )
  }

  return (
    <HubsContainer overflowX="visible">
      <Box>
        <Box sx={{ paddingLeft: { md: '15px', xs: '0' } }}>
          <Typography
            variant="h2"
            align="left"
            fontWeight={'700'}
            className={classes.sectionHeader}
          >
            Hubs
          </Typography>
        </Box>
        <HubGrid container >
          {hubs?.map(hub => {
            const imageUrl = hub?.json?.image;
            console.log('hub :>> ', hub);
            return(
              <HubTile item md={4}>
                {imageUrl &&
                  <Link href={`/${hub.handle}`}>
                    <a>
                      <Image
                        src={imageUrl}
                        height={100}
                        width={100}
                        layout="responsive"
                        priority={true}
                        unoptimized={true}
                        loading="eager"
                      />
                    </a>
                  </Link>
                }
              </HubTile>
            )
          })}

        </HubGrid>

        
        {/* <HubSlider hubs={hubs} /> */}
      </Box>
    </HubsContainer>
  )
}

const PREFIX = 'hubs'

const classes = {
  sectionHeader: `${PREFIX}-sectionHeader`,
}

const HubsContainer = styled('div')(({ theme }) => ({
  width: '1010px',
  margin: 'auto',
  overflowX: 'visible',
  [theme.breakpoints.down('md')]: {
    width: '80vw',
    marginBottom: '100px',
  },
}))

const HubGrid = styled(Grid)(() => ({
  border: '2px solid red',
  // padding: '15px 15px 15px'
}))

const HubTile = styled(Grid)(() => ({
  border: '2px solid red',
  padding: '15px 15px 15px'
}))


export default Hubs