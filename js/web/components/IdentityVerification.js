import { useEffect, useContext, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useWallet } from '@solana/wallet-adapter-react'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Nina from '@nina-protocol/nina-internal-sdk/esm/Nina'
import axios from 'axios'
import Web3 from 'web3'
import { truncateAddress } from '@nina-protocol/nina-internal-sdk/src/utils/truncateAddress'
import { logEvent } from '@nina-protocol/nina-internal-sdk/src/utils/event'
import { useSnackbar } from 'notistack'
import IdentityVerificationModal from './IdentityVerificationModal'
import {
  verifyEthereum,
  verifyTwitter,
  deleteTwitterVerification,
  deleteEthereumVerification,
  verifySoundcloud,
  verifyInstagram,
} from '../utils/identityVerification'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSoundcloud,
  faTwitter,
  faInstagram,
  faEthereum,
} from '@fortawesome/free-brands-svg-icons'

const IdentityVerification = ({ verifications, profilePublicKey }) => {
  const web3 = new Web3(process.env.ETH_CLUSTER_URL)
  const { enqueueSnackbar } = useSnackbar()
  const router = useRouter()
  const { publicKey, signTransaction, sendTransaction } = useWallet()
  const {
    ninaClient,
    getVerificationsForUser,
    NinaProgramAction,
    checkIfHasBalanceToCompleteAction,
  } = useContext(Nina.Context)
  const { provider } = ninaClient

  const [open, setOpen] = useState(false)
  const [ethAddress, setEthAddress] = useState(undefined)
  const [soundcloudHandle, setSoundcloudHandle] = useState(undefined)
  const [soundcloudToken, setSoundcloudToken] = useState(undefined)
  const [twitterHandle, setTwitterHandle] = useState(undefined)
  const [twitterToken, setTwitterToken] = useState(undefined)
  const [instagramHandle, setInstagramHandle] = useState(undefined)
  const [instagramToken, setInstagramToken] = useState(undefined)
  const [instagramUserId, setInstagramUserId] = useState(undefined)
  const [action, setAction] = useState(undefined)
  const [activeType, setActiveType] = useState(undefined)
  const [activeValue, setActiveValue] = useState(undefined)

  const logos = {
    soundcloud: (
      <FontAwesomeIcon
        icon={faSoundcloud}
        size="1x"
        style={{ height: '16px' }}
      />
    ),
    twitter: (
      <FontAwesomeIcon icon={faTwitter} size="1x" style={{ height: '16px' }} />
    ),
    instagram: (
      <FontAwesomeIcon
        icon={faInstagram}
        size="1x"
        style={{ height: '16px' }}
      />
    ),
    ethereum: (
      <FontAwesomeIcon icon={faEthereum} size="1x" style={{ height: '16px' }} />
    ),
  }

  const accountVerifiedForType = (type) => {
    return verifications.find((verification) => verification.type === type)
  }

  const displayNameForValue = (value, type) => {
    if (type === 'ethereum') {
      return truncateAddress(value)
    }
    return value
  }

  const displayNameForType = (type) => {
    const verification = verifications.find(
      (verification) => verification.type === type
    )
    return (
      verification.displayName || displayNameForValue(verification.value, type)
    )
  }

  const valueForType = (type) => {
    return verifications.find((verification) => verification.type === type)
      .value
  }

  const buttonTextForType = (type) => {
    if (accountVerifiedForType(type)) {
      return displayNameForType(type)
    } else {
      return 'Connect'
    }
  }

  const buttonTypes = useMemo(() => {
    const buttonArray = []
    if (publicKey?.toBase58() === profilePublicKey) {
      buttonArray.push('twitter', 'soundcloud', 'ethereum')
    } else {
      verifications.forEach((verification) => {
        if (verification.type === 'twitter') {
          buttonArray.push('twitter')
        }
        if (verification.type === 'soundcloud') {
          buttonArray.push('soundcloud')
        }
        if (verification.type === 'instagram') {
          buttonArray.push('instagram')
        }
        if (verification.type === 'ethereum') {
          buttonArray.push('ethereum')
        }
      })
    }
    return buttonArray
  }, [publicKey, verifications])

  useEffect(() => {
    const codeSource = localStorage.getItem('codeSource')
    const getHandle = async () => {
      try {
        setActiveType(codeSource)
        if (codeSource === 'soundcloud') {
          const response = await axios.post(
            `${process.env.NINA_IDENTITY_ENDPOINT}/sc/user`,
            {
              code: router.query.code,
            }
          )
          if (response.data) {
            setSoundcloudHandle(response.data.username)
            setActiveValue(response.data.username)
            setSoundcloudToken(response.data.token.access_token)
          }
        } else if (codeSource === 'instagram') {
          const response = await axios.post(
            `${process.env.NINA_IDENTITY_ENDPOINT}/ig/user`,
            {
              code: router.query.code,
            }
          )
          if (response.data) {
            setInstagramHandle(response.data.username)
            setActiveValue(response.data.username)
            setInstagramToken(response.data.token)
            setInstagramUserId(response.data.userId)
          }
        } else if (codeSource === 'twitter') {
          const response = await axios.post(
            `${process.env.NINA_IDENTITY_ENDPOINT}/tw/user`,
            {
              code: router.query.code,
            }
          )
          if (response.data) {
            setTwitterHandle(response.data.username)
            setActiveValue(response.data.username)
            setTwitterToken(response.data.token)
          }
        }
      } catch (error) {
        console.warn(error)
        setActiveValue(undefined)
      }
    }

    if (router.query.code) {
      getHandle()
    } else if (ethAddress) {
      setActiveValue(ethAddress)
    }
    setOpen(true)
  }, [router.query.code, ethAddress])

  const handleIdentityButtonAction = async (type) => {
    if (accountVerifiedForType(type)) {
      const value = valueForType(type)

      const params = {
        type,
        value,
      }
      if (publicKey) {
        params.wallet = publicKey.toBase58()
      }

      logEvent('connection_action', 'engagement', params)

      switch (type) {
        case 'twitter':
          window.open(`https://twitter.com/${value}`, '_blank')
          break
        case 'instagram':
          window.open(`https://instagram.com/${value}`, '_blank')
          break
        case 'soundcloud':
          window.open(`https://soundcloud.com/${value}`, '_blank')
          break
        case 'ethereum':
          window.open(`https://etherscan.io/address/${value}`, '_blank')
          break
      }
    } else {
      await handleConnectAccount(type)
    }
  }

  const handleVerify = async () => {
    switch (localStorage.getItem('codeSource')) {
      case 'soundcloud':
        await verifySoundcloud(
          provider,
          soundcloudHandle,
          publicKey,
          signTransaction,
          soundcloudToken
        )
        await getVerificationsForUser(profilePublicKey)
        break
      case 'twitter':
        await verifyTwitter(
          provider,
          twitterHandle,
          twitterToken,
          publicKey,
          signTransaction
        )
        await getVerificationsForUser(profilePublicKey)
        break
      case 'instagram':
        await verifyInstagram(
          provider,
          instagramUserId,
          instagramHandle,
          publicKey,
          signTransaction,
          instagramToken
        )
        await getVerificationsForUser(profilePublicKey)
        break
      case 'ethereum':
        await verifyEthereum(provider, ethAddress, publicKey, signTransaction)
        await getVerificationsForUser(profilePublicKey)
        break
    }
  }

  const handleConnectAccount = async (type) => {
    const error = await checkIfHasBalanceToCompleteAction(
      NinaProgramAction.CONNECTION_CREATE
    )
    if (error) {
      enqueueSnackbar(error.msg)
      return
    }

    localStorage.setItem('codeSource', type)

    switch (type) {
      case 'soundcloud':
        router.push(
          `https://soundcloud.com/connect?client_id=${process.env.SC_CLIENT_ID}&redirect_uri=${process.env.IDENTITY_REDIRECT_URI}&response_type=code&scope=non-expiring`
        )
        break
      case 'instagram':
        router.push(
          `https://api.instagram.com/oauth/authorize?client_id=${process.env.IG_CLIENT_ID}&redirect_uri=${process.env.IDENTITY_REDIRECT_URI}/&scope=user_profile,user_media&response_type=code`
        )
        break
      case 'twitter':
        router.push(
          `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_AUTH_CLIENT_ID}&redirect_uri=${process.env.IDENTITY_REDIRECT_URI}&scope=users.read%20tweet.read&state=state&code_challenge=challenge&code_challenge_method=plain`
        )
        break

      case 'ethereum':
        setEthAddress(undefined)
        var accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })
        setEthAddress(accounts[0])
        break
    }
  }
  return (
    <>
      <CtaWrapper>
        {buttonTypes &&
          buttonTypes.map((buttonType, index) => {
            return (
              <Button
                onClick={() => handleIdentityButtonAction(buttonType)}
                key={index}
              >
                <Box display="flex" alignItems="center">
                  {logos[buttonType]}{' '}
                  <Typography ml={1} variant="body2">
                    {buttonTextForType(buttonType)}
                  </Typography>
                </Box>
              </Button>
            )
          })}
      </CtaWrapper>
      {activeValue && (
        <Box>
          <IdentityVerificationModal
            action={handleVerify}
            type={localStorage.getItem('codeSource')}
            value={activeValue}
            open={open}
            setOpen={setOpen}
          />
        </Box>
      )}
    </>
  )
}

const CtaWrapper = styled(Box)(({ theme }) => ({
  '& button': {
    color: 'black',
    border: '1px solid black',
    borderRadius: '0px',
    margin: '0 8px',
    [theme.breakpoints.down('md')]: {
      border: 'none',
      margin: '0px',
      padding: '10px 10px 10px 0px',
      '& p': {
        display: 'none',
      },
    },
    '& svg': {
      fontSize: '16px',
      [theme.breakpoints.down('md')]: {
        fontSize: '20px',
      },
    },
  },
}))

export default IdentityVerification
