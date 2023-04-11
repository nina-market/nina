import React, { useEffect, useState, useContext, useMemo } from 'react'
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
import Wallet from '@nina-protocol/nina-internal-sdk/esm/Wallet'
import WalletConnectModal from '@nina-protocol/nina-internal-sdk/esm/WalletConnectModal'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import StepContent from '@mui/material/StepContent'
import Nina from '@nina-protocol/nina-internal-sdk/esm/Nina'
import dynamic from 'next/dynamic'

const BundlrModal = dynamic(() =>
  import('@nina-protocol/nina-internal-sdk/esm/BundlrModal')
)
const IdentityVerification = dynamic(() => import('./IdentityVerification'))
const Onboard = () => {
  const router = useRouter()
  const {
    bundlrBalance,
    getBundlrBalance,
    getBundlrPricePerMb,
    solPrice,
    getSolPrice,
    getUserBalances,
    verificationState,
  } = useContext(Nina.Context)
  const { query } = router
  const [code, setCode] = useState()
  const { wallet } = useContext(Wallet.Context)
  const [claimedError, setClaimedError] = useState(false)
  const [claimedCodeSuccess, setClaimedCodeSuccess] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const { enqueueSnackbar } = useSnackbar()
  const profilePubkey = wallet?.publicKey?.toBase58()
  const [profileVerifications, setProfileVerifications] = useState([])
  const bundlrUsdBalance = useMemo(
    () => bundlrBalance * solPrice,
    [bundlrBalance, solPrice]
  )
  useEffect(() => {
    refreshBundlr()
    getUserBalances()
  }, [])
  useEffect(() => {
    if (!router.isReady) return
    if (router.isReady && query.code) {
      const onboardingCodeString = query.code.toString()
      const formattedOnboardingCodeString = onboardingCodeString.replaceAll(
        '/',
        ''
      )
      if (formattedOnboardingCodeString) {
        setCode(formattedOnboardingCodeString)
      }
    }
  }, [router.isReady])

  useEffect(() => {
    if (verificationState[profilePubkey]) {
      setProfileVerifications(verificationState[profilePubkey])
    }
  }, [verificationState])

  useEffect(() => {
    if (wallet.connected) {
      setActiveStep(1)
    }
  }, [wallet.connected])

  useEffect(() => {
    if (claimedCodeSuccess) {
      setActiveStep(2)
    }
  }, [claimedCodeSuccess])
  useEffect(() => {
    if (bundlrUsdBalance > 0.05) {
      setActiveStep(3)
    }
  }, [bundlrUsdBalance])

  const onboardingSteps = [
    {
      title: 'Login or Sign Up',
      content: `To get started, please login or sign up below.`,
      cta: (
        <WalletConnectModal inOnboardingFlow={true}>
          Login / Sign Up
        </WalletConnectModal>
      ),
    },
    {
      title: 'Claim your onboarding code',
      content: `   Once you've connected your wallet, you'll be able to claim your
          onboarding code. This code will give you access to the Nina ecosystem. Your onboarding code is: ${code}`,

      cta: (
        <>
          <ClaimCodeButton onClick={() => handleClaimCode(code)}>
            Claim Code
          </ClaimCodeButton>
          {claimedError && (
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
        </>
      ),
    },
    {
      title: 'Fund your Upload Account',
      content: `  You now have .2 SOL into your account. SOL is used to pay storage and transaction fees on Nina. Once you've claimed your code, you'll need to fund your Upload
          Account. This account is used to pay for storage and transaction fees
          on Nina.`,
      cta: <BundlrModal inOnboardFlow={true} />,
    },
    {
      title: 'Verify your Account (optional)',
      content: `        Now that you have claimed your code and funded your account, you can
            verify your account via your Soundcloud or Twitter profile.`,
      cta: (
        <>
          <IdentityVerification
            verifications={profileVerifications}
            profilePublicKey={profilePubkey}
            inOnboardingFlow={true}
          />
          <Box />
          <ClaimCodeButton
            onClick={() => setActiveStep(4)}
            sx={{ marginTop: '10px' }}
          >
            Do this Later
          </ClaimCodeButton>
        </>
      ),
    },
  ]

  const signUpSteps = [
    {
      title: 'Sign Up',
      content: `To get started, please sign up below.`,
      cta: (
        <>
          <ClaimCodeButton>Sign up with email</ClaimCodeButton>
          <Box mb={1}/>
          <ClaimCodeButton>Sign up with wallet</ClaimCodeButton>
        </>
      ),
    },
    {
      title: 'Verify your Account (optional)',
      content: `        Now that you have set up your account, you can
            verify it via your Soundcloud or Twitter profile.`,
      cta: (
        <>
          <IdentityVerification
            verifications={profileVerifications}
            profilePublicKey={profilePubkey}
            inOnboardingFlow={true}
          />
          <Box />
          <ClaimCodeButton
            onClick={() => setActiveStep(4)}
            sx={{ marginTop: '10px' }}
          >
            Do this Later
          </ClaimCodeButton>
        </>
      ),
    },
  ]

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

  const refreshBundlr = () => {
    getBundlrBalance()
    getBundlrPricePerMb()
    getSolPrice()
  }

  const OnboardSteps = (steps) => {

    return (
      <Box sx={{ width: '75%' }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => {
            return (
              <Step key={index}>
                <StepLabel>{step.title}</StepLabel>
                <StepContent>
                  <Typography variant="body1" mb={1}>
                    {step.content}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      width: '75%',
                    }}
                  >
                    {step.cta}
                  </Box>
                </StepContent>
              </Step>
            )
          })}
        </Stepper>
      </Box>
    )
  }

  const SignUpSteps = () => {
    return(
      <Box sx={{ width: '75%' }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {signUpSteps.map((step, index) => {
            return (
              <Step key={index}>
                <StepLabel>{step.title}</StepLabel>
                <StepContent>
                  <Typography variant="body1" mb={1}>
                    {step.content}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      width: '75%',
                    }}
                  >
                    {step.cta}
                  </Box>
                </StepContent>
              </Step>
            )
          }
          )}
        </Stepper>
      </Box>
    )
  }

  return (
    <ScrollablePageWrapper>
      <StyledGrid>
        <GetStartedPageWrapper>
          <>
            <Box mb={2}>
              <Typography variant="h1" mb={1}>
                Welcome to Nina.
              </Typography>
              {code !== undefined ? (
                <>
                  {activeStep < onboardingSteps.length ? (
                    <>
                      <Typography variant="h3" mb={1}>
                        You are receiving complimentary SOL to create your Hub
                        and start uploading your music. Please follow the steps
                        below to get started.
                      </Typography>
                      {OnboardSteps(onboardingSteps)}
                    </>
                  ) : (
                    <Box>
                      <Typography variant="h1" mb={1}>
                        {`You're all set.`}
                      </Typography>
                      <Typography variant="h3" mb={1}>
                        You can now start uploading your music to Nina.
                      </Typography>
                      <Box
                        mt={2}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          width: '50%',
                        }}
                      >
                        <Link href="/dashboard">
                          <ClaimCodeButton sx={{ marginTop: '10px' }}>
                            Go to Dashboard
                          </ClaimCodeButton>
                        </Link>
                        <Link href="/hubs/create">
                          <ClaimCodeButton sx={{ marginTop: '10px' }}>
                            Create a Hub
                          </ClaimCodeButton>
                        </Link>
                        <Link href="/upload">
                          <ClaimCodeButton sx={{ marginTop: '10px' }}>
                            Publish a Track
                          </ClaimCodeButton>
                        </Link>
                      </Box>
                    </Box>
                  )}
                </>
              ) : (
                <>
                  <Typography variant="h3" mb={1}>
                    Follow the steps below to get started.
                  </Typography>
                  {OnboardSteps(signUpSteps)}
                </>
              )}
            </Box>
          </>
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
      opacity: '50%',
    },
  },
}))

const GetStartedPageWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  margin: '0px auto ',
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
  border: `1px solid ${theme.palette.black}`,
  borderRadius: '0px',
  padding: '16px 20px',
  color: theme.palette.black,
  fontSize: '12px',
}))

export default Onboard
