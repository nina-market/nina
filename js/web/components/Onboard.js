import React, { useEffect, useState, useContext, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import axios from 'axios'
import { encodeBase64 } from 'tweetnacl-util'
import ScrollablePageWrapper from './ScrollablePageWrapper'
import { styled } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import Box from '@mui/system/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSnackbar } from 'notistack'
import dynamic from 'next/dynamic'
import {
  WalletDialogButton,
  WalletDialogProvider,
} from '@solana/wallet-adapter-material-ui'

const EmailCapture = dynamic(
  () => import('@nina-protocol/nina-internal-sdk/esm/EmailCapture'),
  { ssr: false }
)
const Onboard = () => {
  const router = useRouter()
  // console.log(useWalletDialog())
  const { query } = router
  const [code, setCode] = useState()
  const [invalidCode, setInvalidCode] = useState(false)
  const wallet = useWallet()
  const [claimedError, setClaimedError] = useState(false)
  const [claimedStatus, setClaimedStatus] = useState(false)
  const [claimedCodeSuccess, setClaimedCodeSuccess] = useState(false)
  const [headerCopy, setHeaderCopy] = useState(
    'Your wallet is not connected, please connect your wallet to continue.'
  )
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    if (!router.isReady) return
    if (router.isReady && query.code) {
      const onboardingCodeString = query.code.toString()
      if (onboardingCodeString) {
        setCode(onboardingCodeString)
      }
    }
  }, [router.isReady])

  useEffect(() => {
    if (wallet.connected) {
      setHeaderCopy(
        'Welcome to Nina. Nina is an independent music ecosystem that offers artists new models for releasing music. Click below to claim your onboarding code.'
      )
    }
  }, [wallet.connected])

  useEffect(() => {
    if (wallet.connected && claimedCodeSuccess) {
      setHeaderCopy(
        'Code has been redeemed. You now have access to the Nina ecosystem. For next steps, we recommend you create a Hub and start releasing music.'
      )
    }
  }, [wallet.connected, claimedCodeSuccess])

  const handleGenerateCode = async () => {
    const message = new TextEncoder().encode(wallet.publicKey.toBase58())
    const messageBase64 = encodeBase64(message)
    const signature = await wallet.signMessage(message)
    const signatureBase64 = encodeBase64(signature)

    const response = await axios.post(
      `${process.env.NINA_IDENTITY_ENDPOINT}/onboardingCodes`,
      {
        message: messageBase64,
        signature: signatureBase64,
        publicKey: wallet.publicKey.toBase58(),
      }
    )

    if (response.data) {
      setCode(response.data.onboardingCode.code)
    }
  }

  const handleClaimCode = async (code) => {
    const message = new TextEncoder().encode(wallet.publicKey.toBase58())
    const messageBase64 = encodeBase64(message)
    const signature = await wallet.signMessage(message)
    const signatureBase64 = encodeBase64(signature)

    try {
      const response = await axios.post(
        `${process.env.NINA_IDENTITY_ENDPOINT}/onboardingCodes/${code}`,
        {
          message: messageBase64,
          signature: signatureBase64,
          publicKey: wallet.publicKey.toBase58(),
        }
      )
      console.log('response', response.data)
      if (response.data.success) {
        enqueueSnackbar('Code has been successfully redeemed', {
          info: 'success',
        })
        setClaimedError(false)
        setClaimedCodeSuccess(true)
      }
      return
    } catch (error) {
      enqueueSnackbar('Code has already been redeemed or is invalid', {
        variant: 'error',
      })
      console.error(error)
      setClaimedError(true)
    }
  }

  // const handleClaimCode = async (code) => {
  //   const message = new TextEncoder().encode(wallet.publicKey.toBase58())
  //   const messageBase64 = encodeBase64(message)
  //   const signature = await wallet.signMessage(message)
  //   const signatureBase64 = encodeBase64(signature)

  //   const response = await axios.post(
  //     `${process.env.NINA_IDENTITY_ENDPOINT}/onboardingCodes/${code}`,
  //     {
  //       message: messageBase64,
  //       signature: signatureBase64,
  //       publicKey: wallet.publicKey.toBase58(),
  //     }
  //   )

  //   if (response.data.success) {
  //     console.log('success')
  //     setClaimedStatus(true)
  //   }
  // }

  //  const handleClick: = useCallback(
  //    (event) => {
  //      if (onClick) onClick(event)
  //      if (!event.defaultPrevented) setOpen(true)
  //    },
  //    [onClick, setOpen]
  //  )

  //  const handleWalletConnect = useCallback((e) => {
  //   if (!e.defaultPrevented) setOpen(true)
  //  }, [setOpen])
  return (
    <ScrollablePageWrapper>
      <StyledGrid>
        <GetStartedPageWrapper>
          <>
            <Box mb={2}>
              <Typography variant="h1" mb={1}>
                {headerCopy}
              </Typography>
              {!wallet.connected && (
                <>
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{ display: 'flex', flexDirection: 'row' }}
                    >
                      {/* <BlueTypography variant="h3" onClick={(e) => handleWalletConnect(e)}>Connect your wallet</BlueTypography> */}
                      <StyledWalletDialogProvider>
                        <WalletDialogButton>
                          <BlueTypography variant="h3">
                            Connect Your Wallet
                          </BlueTypography>
                        </WalletDialogButton>
                      </StyledWalletDialogProvider>
                      or
                      <Link href="https://phantom.app">
                        <a target="_blank">
                          <Typography variant="h3" sx={{ margin: '0px 8px' }}>
                            create a wallet
                          </Typography>
                        </a>
                      </Link>
                      to get started.
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
            {wallet.connected && (
              <ClaimCodeButton onClick={() => handleClaimCode(code)}>
                Claim Code
              </ClaimCodeButton>
            )}
          </>

          {wallet.connected && claimedCodeSuccess && (
            <>
              <Button
                fullWidth
                variant="outlined"
                sx={{ height: '54px', mt: 1, '&:hover': { opacity: '50%' } }}
              >
                <Link href="/hubs/create" passHref>
                  <a>
                    <Typography variant="body2" align="left">
                      Create a Hub
                    </Typography>
                  </a>
                </Link>
              </Button>

              <Button
                fullWidth
                variant="outlined"
                sx={{ height: '54px', mt: 1, '&:hover': { opacity: '50%' } }}
              >
                <Link href="/hubs/create" passHref>
                  <a>
                    <Typography variant="body2" align="left">
                      Start Exploring
                    </Typography>
                  </a>
                </Link>
              </Button>
              <Box>
                <Typography variant="h3" mt={2}>
                  If you have any questions,{' '}
                  <a
                    href="mailto:contact@ninaprotocol.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    get in touch
                  </a>{' '}
                  or{' '}
                  <Link href="/learn" passHref>
                    <a>click here to learn more about Nina.</a>
                  </Link>
                </Typography>
              </Box>
            </>
          )}

          <button onClick={() => handleGenerateCode()}>Generate Code</button>
          <label for="code">OnboardingCode</label>
          <input
            type="text"
            id="code"
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />

          <button onClick={() => handleClaimCode(code)}>Claim</button>
          {wallet.connected && claimedError && (
            <Typography mt={1} mb={1}>
              This code has already been claimed or is invalid. If you believe
              this is an error, please contact us at{' '}
              <a
                href="mailto:contact@ninaprotocol.com"
                target="_blank"
                rel="noreferrer"
              >
                contact@ninaprotocol.com
              </a>
              .
            </Typography>
          )}
        </GetStartedPageWrapper>
      </StyledGrid>
    </ScrollablePageWrapper>
  )
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  paddingTop: '20px',
  maxHeight: '90vh',
  justifyContent: 'center',
  alignItems: 'center',
  '& a': {
    textDecoration: 'none',
    color: theme.palette.blue,
    '&:hover': {
      opacity: '85%',
    },
  },
}))

const GetStartedPageWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  margin: '100px auto ',
  display: 'flex',
  flexDirection: 'column',
  gridColumn: '1/3',
  maxWidth: '1000px',
  textAlign: 'left',
  [theme.breakpoints.down('md')]: {
    width: '80%',
    margin: '25px auto',
    paddingBottom: '100px',
  },
}))

const ClaimCodeButton = styled(Button)(({ theme }) => ({
  border: `1px solid ${theme.palette.blue}`,
  borderRadius: '0px',
  padding: '16px 20px',
  color: theme.palette.blue,
}))

const BlueTypography = styled(Typography)(({ theme }) => ({
  color: `${theme.palette.blue} !important`,
  marginRight: '8px',
  cursor: 'pointer',
  '&:hover': {
    opacity: '85%',
  },
}))

const StyledWalletDialogProvider = styled(WalletDialogProvider)(
  ({ theme }) => ({
    '& .MuiList-root': {
      background: `${theme.palette.transparent} !important`,
    },
    '& .MuiButton-root': {
      backgroundColor: `${theme.palette.white}`,
    },
    '& .MuiButton-startIcon': {
      display: 'none',
    },
    '& .MuiPaper-root': {
      width: '400px',
      height: 'auto',
      ...theme.helpers.gradient,
      '& .MuiDialogTitle-root': {
        color: `${theme.palette.white} !important`,
        textAlign: 'center',
        padding: '60px 0 0',
        textTransform: 'uppercase',
        margin: 'auto',
        background: 'none !important',
        fontSize: '16px !important',
        fontWeight: '700 !important',
        '& h2': {
          backgroundColor: `${theme.palette.white} !important`,
        },
        '& .MuiButtonBase-root': {
          display: 'none',
        },
      },
      '& .MuiDialogContent-root': {
        padding: '24px',
      },
      '& .MuiListItem-root': {
        padding: `8px 24px`,
        boxShadow: 'none',
        width: '241px',
        margin: 'auto',
        '&:hover': {
          boxShadow: 'none',
        },
        '& .MuiButton-root': {
          textAlign: 'center',
          borderRadius: '50px',
          color: `${theme.palette.blue}`,
          fontSize: '10px',
          fontWeight: '700',
          justifyContent: 'center',
          textTransform: 'uppercase',
          padding: '6px 0',
          '&:hover': {
            opacity: '1',
            backgroundColor: `${theme.palette.blue} !important`,
            color: `${theme.palette.white}`,
          },
          '& .MuiButton-endIcon': {
            display: 'none',
          },
        },
      },
    },
  })
)

export default Onboard
