import React, { useEffect, useState, useContext } from 'react'
import { styled } from '@mui/material/styles'
import { withFormik } from 'formik'
import Button from '@mui/material/Button'
import Input from '@mui/material/Input'
import Box from '@mui/material/Box'
import Wallet from '@nina-protocol/nina-internal-sdk/esm/Wallet'
import Exchange from '@nina-protocol/nina-internal-sdk/esm/Exchange'
import Dots from '@nina-protocol/nina-internal-sdk/esm/Dots'
import dynamic from 'next/dynamic'
import NinaSdk from '@nina-protocol/js-sdk'

const WalletConnectModal = dynamic(() =>
  import('@nina-protocol/nina-internal-sdk/esm/WalletConnectModal')
)
const BuySellForm = (props) => {
  const { onSubmit, isBuy, release, amount, setAmount } = props

  const { wallet } = useContext(Wallet.Context)
  const { exchangeInitPending } = useContext(Exchange.Context)
  const [pending, setPending] = useState(false)
  const [buyPending, setBuyPending] = useState(false)
  const [sellPending, setSellPending] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  useEffect(() => {
    setPending(exchangeInitPending[release.publicKey])
  }, [exchangeInitPending[release.publicKey]])

  useEffect(() => {
    if (pending && exchangeInitPending.isSelling) {
      setSellPending(true)
    } else if (pending && !exchangeInitPending.isSelling) {
      setBuyPending(true)
    } else {
      setBuyPending(false)
      setSellPending(false)
    }
  }, [pending])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!wallet.connected) {
      setShowWalletModal(true)
      return
    }
    await onSubmit(e, isBuy, amount)
    setAmount()
  }

  const handleChange = (e) => {
    if (/^\d+(\.\d{0,4})?$|^(\.\d{0,4})?$|^(?![\s\S])/.test(e.target.value)) {
      setAmount(e.target.value)
    } else {
      e.target.value = amount
    }
  }

  return (
    <StyledForm
      onSubmit={handleSubmit}
      className={classes.buySellForm}
      autoComplete="off"
    >
      <InputWrapper>
        <Input
          id="buy-sell__input"
          type="input"
          name="amount"
          className={`${classes.buySellFormInputLabel}`}
          onChange={(e) => handleChange(e)}
          disableUnderline={true}
          placeholder={`Enter price in ${
            NinaSdk.utils.isUsdc(release.paymentMint) ? 'USDC' : 'SOL'
          }`}
          value={amount !== undefined ? amount : ''}
        />
        <Button
          variant="contained"
          type="submit"
          disableRipple={true}
          sx={{ width: '20%' }}
        >
          {isBuy && buyPending && <Dots />}

          {!isBuy && sellPending && <Dots />}
          {isBuy && !buyPending && 'Submit'}
          {!isBuy && !sellPending && 'Submit'}
        </Button>
      </InputWrapper>
      <WalletConnectModal
        inOnboardingFlow={false}
        forceOpen={showWalletModal}
        setForceOpen={setShowWalletModal}
        action={isBuy ? 'buyOffer' : 'sellOffer'}
      />
    </StyledForm>
  )
}

const PREFIX = 'BuySellForm'

const classes = {
  buySellFormInputLabel: `${PREFIX}-buySellFormInputLabel`,
}

const StyledForm = styled('form')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  margin: '0',
  width: '100%',
  marginTop: '10px',
  borderBottom: `1px solid ${theme.palette.greyLight}`,
  backgroundColor: `${theme.palette.white}`,
  fontSize: '14px',

  [`& .${classes.buySellFormInputLabel}`]: {
    fontSize: '2rem',
    width: '73%',
    border: `1px solid ${theme.palette.grey.primary}`,
    '& input': {
      textAlign: 'center !important',
      padding: '0',
      height: '41px',
      '&[type=number]': {
        '-moz-appearance': 'textfield',
      },
      '&::-webkit-outer-spin-button': {
        '-webkit-appearance': 'none',
        margin: 0,
      },
      '&::-webkit-inner-spin-button': {
        '-webkit-appearance': 'none',
        margin: 0,
      },
      '&::placeholder': {
        fontSize: '10px',
        verticalAlign: 'middle',
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      },
    },
  },
}))

const InputWrapper = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
}))

export default withFormik({
  enableReinitialize: true,
  mapPropsToValues: () => {
    return {
      amount: 0.0,
    }
  },
})(BuySellForm)
