export const ninaErrorHandler = (error, errorString) => {
  console.warn(error)

  let msg
  if (
    error.toString().includes('0x1') ||
    error.toString().includes(`Cannot read property 'pubkey' of undefined`)
  ) {
    msg = 'Transaction failed: Insufficient funds.'
  } else if (error.toString().includes('Signature request denied')) {
    msg = 'Transaction cancelled.'
  } else if (error.msg) {
    msg = `Transaction failed: ${error.msg}`
  } else if (errorString) {
    msg = errorString
  }

  if (msg) {
    return {
      success: false,
      msg,
    }
  }

  return undefined
}