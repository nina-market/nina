const anchor = require('@project-serum/anchor')
const {
  createNameRegistry,
  getHashedName,
  getNameAccountKey,
  NameRegistryState,
  createInstruction,
  deleteInstruction,
  updateInstruction,
  Numberu32,
  Numberu64,
} = require('@bonfida/spl-name-service')
const { deserializeUnchecked, serialize } = require('borsh')
const Web3 = require('web3')
const axios = require('axios')
const { logEvent } = require('@nina-protocol/nina-internal-sdk/src/utils/event')

const NINA_ID = new anchor.web3.PublicKey(
  'idHukURpSwMbvcRER9pN97tBSsH4pdLSUhnHYwHftd5'
)
const NINA_ID_ETH_TLD = new anchor.web3.PublicKey(
  '9yQ5NdLpFdALfRjjfBLCQiddvMekwRbCtuSYDCi4mpFc'
)
const NINA_ID_IG_TLD = new anchor.web3.PublicKey(
  '7JVHPSJdVBNRgYdY3ibP33YksBzjpuBVasLj91Jj9jQA'
)
const NINA_ID_SC_TLD = new anchor.web3.PublicKey(
  'MguVXe9Z18YDWxm3AZkSdiuRiEJ1UzvEyevFAxycsjw'
)
const NINA_ID_TW_TLD = new anchor.web3.PublicKey(
  '6nPJTCeFnp3QiLBDtPPkZqMkW3KccVgr1izLTF1Lq7VL'
)
const NAME_PROGRAM_ID = new anchor.web3.PublicKey(
  'namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX'
)

const LAMPORTS_FOR_REVERSE_REGISTRY = 1433760
const LAMPORTS_FOR_NAME_ACCOUNT = 6657718

const web3 = new Web3(process.env.ETH_CLUSTER_URL)

class ReverseEthAddressRegistryState {
  static schema = new Map([
    [
      ReverseEthAddressRegistryState,
      {
        kind: 'struct',
        fields: [
          ['ethAddressRegistryKey', [32]],
          ['ethAddress', 'string'],
        ],
      },
    ],
  ])

  constructor(obj) {
    this.ethAddressRegistryKey = obj.ethAddressRegistryKey
    this.ethAddress = obj.ethAddress
  }

  static retrieve = async (connection, reverseEthAddressAccountKey) => {
    const reverseEthAddressAccount = await connection.getAccountInfo(
      reverseEthAddressAccountKey,
      'processed'
    )

    if (!reverseEthAddressAccountKey) {
      throw new Error('Invalid reverse Eth Address account provided')
    }

    const res = deserializeUnchecked(
      this.schema,
      ReverseEthAddressRegistryState,
      reverseEthAddressAccount.data.slice(NameRegistryState.HEADER_LEN)
    )

    return res
  }

  static createLookupInstructions = async (ethAddress, publicKey) => {
    const nameAccountKey = await getNameAccountKey(
      await getHashedName(ethAddress),
      NINA_ID,
      NINA_ID_ETH_TLD
    )
    const hashedVerifiedPubkey = await getHashedName(publicKey.toString())
    const reverseRegistryKey = await getNameAccountKey(
      hashedVerifiedPubkey,
      NINA_ID,
      NINA_ID_ETH_TLD
    )

    let ReverseEthAddressRegistryStateBuff = serialize(
      ReverseEthAddressRegistryState.schema,
      new ReverseEthAddressRegistryState({
        ethAddressRegistryKey: nameAccountKey.toBytes(),
        ethAddress,
      })
    )

    const createIx = createInstruction(
      NAME_PROGRAM_ID,
      anchor.web3.SystemProgram.programId,
      reverseRegistryKey,
      publicKey,
      publicKey,
      hashedVerifiedPubkey,
      new Numberu64(LAMPORTS_FOR_REVERSE_REGISTRY * 2),
      new Numberu32(ReverseEthAddressRegistryStateBuff.length),
      NINA_ID,
      NINA_ID_ETH_TLD,
      NINA_ID
    )
    const reverseRegistryIx = updateInstruction(
      NAME_PROGRAM_ID,
      reverseRegistryKey,
      new Numberu32(0),
      Buffer.from(ReverseEthAddressRegistryStateBuff),
      NINA_ID,
      NINA_ID_ETH_TLD
    )
    return [createIx, reverseRegistryIx]
  }
}

class ReverseSoundcloudRegistryState {
  static schema = new Map([
    [
      ReverseSoundcloudRegistryState,
      {
        kind: 'struct',
        fields: [
          ['soundcloudRegistryKey', [32]],
          ['soundcloudHandle', 'string'],
        ],
      },
    ],
  ])
  constructor(obj) {
    this.soundcloudRegistryKey = obj.soundcloudRegistryKey
    this.soundcloudHandle = obj.soundcloudHandle
  }

  static retrieve = async (connection, reverseSoundcloudAccountKey) => {
    const reverseSoundcloudAddressAccount = await connection.getAccountInfo(
      reverseSoundcloudAccountKey,
      'processed'
    )

    if (!reverseSoundcloudAddressAccount) {
      throw new Error('Invalid reverse Soundcloud handle account provided')
    }

    const res = deserializeUnchecked(
      this.schema,
      ReverseSoundcloudRegistryState,
      reverseSoundcloudAddressAccount.data.slice(NameRegistryState.HEADER_LEN)
    )

    return res
  }

  static createLookupInstructions = async (soundcloudHandle, publicKey) => {
    const nameAccountKey = await getNameAccountKey(
      await getHashedName(soundcloudHandle),
      NINA_ID,
      NINA_ID_SC_TLD
    )
    const hashedVerifiedPubkey = await getHashedName(publicKey.toString())
    const reverseRegistryKey = await getNameAccountKey(
      hashedVerifiedPubkey,
      NINA_ID,
      NINA_ID_SC_TLD
    )

    let ReverseSoundcloudRegistryStateBuff = serialize(
      ReverseSoundcloudRegistryState.schema,
      new ReverseSoundcloudRegistryState({
        soundcloudRegistryKey: nameAccountKey.toBytes(),
        soundcloudHandle,
      })
    )

    const createIx = createInstruction(
      NAME_PROGRAM_ID,
      anchor.web3.SystemProgram.programId,
      reverseRegistryKey,
      publicKey,
      publicKey,
      hashedVerifiedPubkey,
      new Numberu64(LAMPORTS_FOR_REVERSE_REGISTRY * 2),
      new Numberu32(ReverseSoundcloudRegistryStateBuff.length),
      NINA_ID,
      NINA_ID_SC_TLD,
      NINA_ID
    )
    const reverseRegistryIx = updateInstruction(
      NAME_PROGRAM_ID,
      reverseRegistryKey,
      new Numberu32(0),
      Buffer.from(ReverseSoundcloudRegistryStateBuff),
      NINA_ID,
      NINA_ID_SC_TLD
    )
    return [createIx, reverseRegistryIx]
  }
}

class ReverseTwitterRegistryState {
  static schema = new Map([
    [
      ReverseTwitterRegistryState,
      {
        kind: 'struct',
        fields: [
          ['twitterRegistryKey', [32]],
          ['twitterHandle', 'string'],
        ],
      },
    ],
  ])
  constructor(obj) {
    this.twitterRegistryKey = obj.twitterRegistryKey
    this.twitterHandle = obj.twitterHandle
  }

  static retrieve = async (connection, reverseTwitterAccountKey) => {
    const reverseTwitterAddressAccount = await connection.getAccountInfo(
      reverseTwitterAccountKey,
      'processed'
    )

    if (!reverseTwitterAddressAccount) {
      throw new Error('Invalid reverse Twitter Handle account provided')
    }

    const res = deserializeUnchecked(
      this.schema,
      ReverseTwitterRegistryState,
      reverseTwitterAddressAccount.data.slice(NameRegistryState.HEADER_LEN)
    )

    return res
  }

  static createLookupInstructions = async (twitterHandle, publicKey) => {
    const nameAccountKey = await getNameAccountKey(
      await getHashedName(twitterHandle),
      NINA_ID,
      NINA_ID_TW_TLD
    )
    const hashedVerifiedPubkey = await getHashedName(publicKey.toString())
    const reverseRegistryKey = await getNameAccountKey(
      hashedVerifiedPubkey,
      NINA_ID,
      NINA_ID_TW_TLD
    )

    let ReverseTwitterRegistryStateBuff = serialize(
      ReverseTwitterRegistryState.schema,
      new ReverseTwitterRegistryState({
        twitterRegistryKey: nameAccountKey.toBytes(),
        twitterHandle,
      })
    )

    const createIx = createInstruction(
      NAME_PROGRAM_ID,
      anchor.web3.SystemProgram.programId,
      reverseRegistryKey,
      publicKey,
      publicKey,
      hashedVerifiedPubkey,
      new Numberu64(LAMPORTS_FOR_REVERSE_REGISTRY * 2),
      new Numberu32(ReverseTwitterRegistryStateBuff.length),
      NINA_ID,
      NINA_ID_TW_TLD,
      NINA_ID
    )
    const reverseRegistryIx = updateInstruction(
      NAME_PROGRAM_ID,
      reverseRegistryKey,
      new Numberu32(0),
      Buffer.from(ReverseTwitterRegistryStateBuff),
      NINA_ID,
      NINA_ID_TW_TLD
    )
    return [createIx, reverseRegistryIx]
  }
}

class ReverseInstagramRegistryState {
  static schema = new Map([
    [
      ReverseInstagramRegistryState,
      {
        kind: 'struct',
        fields: [
          ['instagramRegistryKey', [32]],
          ['instagramHandle', 'string'],
        ],
      },
    ],
  ])
  constructor(obj) {
    this.instagramRegistryKey = obj.instagramRegistryKey
    this.instagramHandle = obj.instagramHandle
  }

  static retrieve = async (connection, reverseInstagramAccountKey) => {
    const reverseInstagramAddressAccount = await connection.getAccountInfo(
      reverseInstagramAccountKey,
      'processed'
    )

    if (!reverseInstagramAddressAccount) {
      throw new Error('Invalid reverse Instagram Handle account provided')
    }

    const res = deserializeUnchecked(
      this.schema,
      ReverseInstagramRegistryState,
      reverseInstagramAddressAccount.data.slice(NameRegistryState.HEADER_LEN)
    )

    return res
  }

  static createLookupInstructions = async (instagramHandle, publicKey) => {
    const nameAccountKey = await getNameAccountKey(
      await getHashedName(instagramHandle),
      NINA_ID,
      NINA_ID_IG_TLD
    )
    const hashedVerifiedPubkey = await getHashedName(publicKey.toString())
    const reverseRegistryKey = await getNameAccountKey(
      hashedVerifiedPubkey,
      NINA_ID,
      NINA_ID_IG_TLD
    )

    let ReverseInstagramRegistryStateBuff = serialize(
      ReverseInstagramRegistryState.schema,
      new ReverseInstagramRegistryState({
        instagramRegistryKey: nameAccountKey.toBytes(),
        instagramHandle,
      })
    )

    const createIx = createInstruction(
      NAME_PROGRAM_ID,
      anchor.web3.SystemProgram.programId,
      reverseRegistryKey,
      publicKey,
      publicKey,
      hashedVerifiedPubkey,
      new Numberu64(LAMPORTS_FOR_REVERSE_REGISTRY * 2),
      new Numberu32(ReverseInstagramRegistryStateBuff.length),
      NINA_ID,
      NINA_ID_IG_TLD,
      NINA_ID
    )
    const reverseRegistryIx = updateInstruction(
      NAME_PROGRAM_ID,
      reverseRegistryKey,
      new Numberu32(0),
      Buffer.from(ReverseInstagramRegistryStateBuff),
      NINA_ID,
      NINA_ID_IG_TLD
    )
    return [createIx, reverseRegistryIx]
  }
}

const verifyEthereum = async (
  provider,
  ethAddress,
  publicKey,
  signTransaction
) => {
  try {
    logEvent('connection_eth_initiated', 'engagement', {
      ethAddress,
      wallet: provider.wallet.publicKey.toBase58(),
    })
    // Sign An Ethereum Message Containing the Solana Public Key
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [ethAddress, web3.utils.sha3(publicKey.toBase58())],
    })

    // Create Name Account Registry
    const ix = await createNameRegistry(
      provider.connection,
      ethAddress,
      96,
      publicKey,
      publicKey,
      LAMPORTS_FOR_NAME_ACCOUNT,
      NINA_ID,
      NINA_ID_ETH_TLD
    )

    // Create Reverse Lookup Account Registry
    const [createIx, reverseRegistryIx] =
      await ReverseEthAddressRegistryState.createLookupInstructions(
        ethAddress,
        publicKey
      )

    // Build and Sign Transaction
    const tx = new anchor.web3.Transaction({
      recentBlockhash: (await provider.connection.getLatestBlockhash())
        .blockhash,
      feePayer: publicKey,
    })
    tx.add(ix, createIx, reverseRegistryIx)
    await signTransaction(tx)

    // Send Transaction To Server To Verify Signatures
    const response = await axios.post(
      `${process.env.NINA_IDENTITY_ENDPOINT}/eth`,
      {
        ethAddress,
        ethSignature: signature,
        tx: tx.serialize({ verifySignatures: false }).toString('base64'),
        solPublicKey: publicKey.toBase58(),
      }
    )
    logEvent('connection_eth_success', 'engagement', {
      ethAddress,
      wallet: provider.wallet.publicKey.toBase58(),
    })
    return true
  } catch (error) {
    console.log('error: ', error)
    logEvent('connection_eth_failure', 'engagement', {
      ethAddress,
      wallet: provider.wallet.publicKey.toBase58(),
    })
    return false
  }
}

const verifySoundcloud = async (
  provider,
  soundcloudHandle,
  publicKey,
  signTransaction,
  soundcloudToken
) => {
  try {
    logEvent('connection_sc_initiated', 'engagement', {
      soundcloudHandle,
      wallet: provider.wallet.publicKey.toBase58(),
    })

    // Create Name Account Registry
    const ix = await createNameRegistry(
      provider.connection,
      soundcloudHandle,
      96,
      publicKey,
      publicKey,
      LAMPORTS_FOR_NAME_ACCOUNT,
      NINA_ID,
      NINA_ID_SC_TLD
    )

    // Create Reverse Lookup Account Registry
    const [createIx, reverseRegistryIx] =
      await ReverseSoundcloudRegistryState.createLookupInstructions(
        soundcloudHandle,
        publicKey
      )

    // Build and Sign Transaction
    const tx = new anchor.web3.Transaction({
      recentBlockhash: (await provider.connection.getLatestBlockhash())
        .blockhash,
      feePayer: publicKey,
    })
    tx.add(ix, createIx, reverseRegistryIx)
    await signTransaction(tx)
    // Send Transaction To Server To Verify Signatures
    const response = await axios.post(
      `${process.env.NINA_IDENTITY_ENDPOINT}/sc/register`,
      {
        handle: soundcloudHandle,
        token: soundcloudToken,
        tx: tx.serialize({ verifySignatures: false }).toString('base64'),
        publicKey: publicKey.toBase58(),
      }
    )
    logEvent('connection_sc_success', 'engagement', {
      soundcloudHandle,
      wallet: provider.wallet.publicKey.toBase58(),
    })

    return true
  } catch (error) {
    console.log('error: ', error)
    logEvent('connection_sc_failure', 'engagement', {
      soundcloudHandle,
      wallet: provider.wallet.publicKey.toBase58(),
    })

    return false
  }
}

const verifyTwitter = async (
  provider,
  twitterHandle,
  twitterToken,
  publicKey,
  signTransaction
) => {
  try {
    logEvent('connection_tw_initiated', 'engagement', {
      twitterHandle,
      wallet: provider.wallet.publicKey.toBase58(),
    })

    // Create Name Account Registry
    const ix = await createNameRegistry(
      provider.connection,
      twitterHandle,
      96,
      publicKey,
      publicKey,
      LAMPORTS_FOR_NAME_ACCOUNT,
      NINA_ID,
      NINA_ID_TW_TLD
    )
    // Create Reverse Lookup Account Registry
    const [createIx, reverseRegistryIx] =
      await ReverseTwitterRegistryState.createLookupInstructions(
        twitterHandle,
        publicKey
      )
    // Build and Sign Transaction
    const tx = new anchor.web3.Transaction({
      recentBlockhash: (await provider.connection.getLatestBlockhash())
        .blockhash,
      feePayer: publicKey,
    })
    tx.add(ix, createIx, reverseRegistryIx)
    await signTransaction(tx)

    // Send Transaction To Server To Verify Signatures
    const response = await axios.post(
      `${process.env.NINA_IDENTITY_ENDPOINT}/tw/register`,
      {
        handle: twitterHandle,
        token: twitterToken,
        tx: tx.serialize({ verifySignatures: false }).toString('base64'),
        publicKey: publicKey.toBase58(),
      }
    )
    logEvent('connection_tw_success', 'engagement', {
      twitterHandle,
      wallet: provider.wallet.publicKey.toBase58(),
    })

    return true
  } catch (error) {
    console.log('error: ', error)
    logEvent('connection_tw_failure', 'engagement', {
      twitterHandle,
      wallet: provider.wallet.publicKey.toBase58(),
    })

    return false
  }
}

const deleteTwitterVerification = async (
  provider,
  twitterHandle,
  publicKey,
  signTransaction,
  sendTransaction
) => {
  try {
    const hashedTwitterHandle = await getHashedName(twitterHandle)
    const twitterHandleRegistryKey = await getNameAccountKey(
      hashedTwitterHandle,
      NINA_ID,
      NINA_ID_TW_TLD
    )

    const hashedVerifiedPubkey = await getHashedName(publicKey.toString())
    const reverseRegistryKey = await getNameAccountKey(
      hashedVerifiedPubkey,
      NINA_ID,
      NINA_ID_TW_TLD
    )

    const instructions = [
      // Delete the user facing registry
      deleteInstruction(
        NAME_PROGRAM_ID,
        twitterHandleRegistryKey,
        publicKey,
        publicKey
      ),
      // Delete the reverse registry
      deleteInstruction(
        NAME_PROGRAM_ID,
        reverseRegistryKey,
        publicKey,
        publicKey
      ),
    ]
    console.log('instructinos: ', instructions)
    // Build and Sign Transaction
    const tx = new anchor.web3.Transaction({
      recentBlockhash: (await provider.connection.getLatestBlockhash())
        .blockhash,
      feePayer: publicKey,
    })
    tx.add(...instructions)
    await signTransaction(tx)
    await sendTransaction(tx, provider.connection)
    // const response = await axios.post(
    //   `${process.env.NINA_IDENTITY_ENDPOINT}/tw/unregister`,
    //   {
    //     tx: tx.serialize({ verifySignatures: false }).toString('base64'),
    //   }
    // )

    return true
  } catch (error) {
    console.log('error: ', error)

    return false
  }
}

const deleteEthereumVerification = async (
  provider,
  ethAddress,
  publicKey,
  signTransaction,
  sendTransaction
) => {
  try {
    const hashedEthAddress = await getHashedName(ethAddress)
    const ethAddressRegistryKey = await getNameAccountKey(
      hashedEthAddress,
      NINA_ID,
      NINA_ID_ETH_TLD
    )

    const hashedVerifiedPubkey = await getHashedName(publicKey.toString())
    const reverseRegistryKey = await getNameAccountKey(
      hashedVerifiedPubkey,
      NINA_ID,
      NINA_ID_ETH_TLD
    )

    const instructions = [
      // Delete the user facing registry
      deleteInstruction(
        NAME_PROGRAM_ID,
        ethAddressRegistryKey,
        publicKey,
        publicKey
      ),
      // Delete the reverse registry
      deleteInstruction(
        NAME_PROGRAM_ID,
        reverseRegistryKey,
        publicKey,
        publicKey
      ),
    ]
    console.log('instructinos: ', instructions)
    // Build and Sign Transaction
    const tx = new anchor.web3.Transaction({
      recentBlockhash: (await provider.connection.getLatestBlockhash())
        .blockhash,
      feePayer: publicKey,
    })
    tx.add(...instructions)
    await signTransaction(tx)
    await sendTransaction(tx, provider.connection)
    // const response = await axios.post(
    //   `${process.env.NINA_IDENTITY_ENDPOINT}/tw/unregister`,
    //   {
    //     tx: tx.serialize({ verifySignatures: false }).toString('base64'),
    //   }
    // )

    return true
  } catch (error) {
    console.log('error: ', error)

    return false
  }
}

const verifyInstagram = async (
  provider,
  instagramUserId,
  instagramHandle,
  publicKey,
  signTransaction,
  token
) => {
  try {
    logEvent('connection_ig_initiated', 'engagement', {
      instagramHandle,
      wallet: provider.wallet.publicKey.toBase58(),
    })

    // Create Name Account Registry
    const ix = await createNameRegistry(
      provider.connection,
      instagramHandle,
      96,
      publicKey,
      publicKey,
      LAMPORTS_FOR_NAME_ACCOUNT,
      NINA_ID,
      NINA_ID_IG_TLD
    )

    // Create Reverse Lookup Account Registry
    const [createIx, reverseRegistryIx] =
      await ReverseInstagramRegistryState.createLookupInstructions(
        instagramHandle,
        publicKey
      )

    // Build and Sign Transaction
    const tx = new anchor.web3.Transaction({
      recentBlockhash: (await provider.connection.getLatestBlockhash())
        .blockhash,
      feePayer: publicKey,
    })
    tx.add(ix, createIx, reverseRegistryIx)
    await signTransaction(tx)

    // Send Transaction To Server To Verify Signatures
    const response = await axios.post(
      `${process.env.NINA_IDENTITY_ENDPOINT}/ig/register`,
      {
        handle: instagramHandle,
        userId: instagramUserId,
        tx: tx.serialize({ verifySignatures: false }).toString('base64'),
        publicKey: publicKey.toBase58(),
        token,
      }
    )
    logEvent('connection_ig_success', 'engagement', {
      instagramHandle,
      wallet: provider.wallet.publicKey.toBase58(),
    })

    return true
  } catch (error) {
    console.log('error: ', error)
    logEvent('connection_ig_failure', 'engagement', {
      instagramHandle,
      wallet: provider.wallet.publicKey.toBase58(),
    })

    return false
  }
}

module.exports = {
  verifyTwitter,
  verifyInstagram,
  verifySoundcloud,
  verifyEthereum,
  deleteTwitterVerification,
  deleteEthereumVerification,
}
