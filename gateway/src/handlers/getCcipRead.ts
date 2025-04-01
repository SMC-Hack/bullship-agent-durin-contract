import { type Hex, parseAbi, serializeSignature } from 'viem'
import { sign } from 'viem/accounts'
import {
  concat,
  decodeFunctionData,
  encodeAbiParameters,
  encodePacked,
  isAddress,
  isHex,
  keccak256,
  toHex,
} from 'viem/utils'
import { z } from 'zod'

import { handleQuery } from '../ccip-read/query'
import { dnsDecodeName, resolverAbi } from '../ccip-read/utils'

const schema = z.object({
  sender: z.string().refine((data) => isAddress(data)),
  data: z.string().refine((data) => isHex(data)),
})

// Implements EIP-3668
// https://eips.ethereum.org/EIPS/eip-3668
export const getCcipRead = async (req: Bun.BunRequest) => {
  const safeParse = schema.safeParse(req.params)

  if (!safeParse.success) {
    return Response.json(
      {
        message: 'Invalid request',
        error: safeParse.error,
      },
      {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      }
    )
  }

  const { sender, data } = safeParse.data

  const decodedStuffedResolveCall = decodeFunctionData({
    abi: [resolverAbi[1]],
    data: data,
  })

  const { result, ttl } = await handleQuery({
    dnsEncodedName: decodedStuffedResolveCall.args[0],
    encodedResolveCall: decodedStuffedResolveCall.args[1] as Hex,
    targetChainId: decodedStuffedResolveCall.args[2],
    targetRegistryAddress: decodedStuffedResolveCall.args[3],
  })

  console.log(result)

  const validUntil = Math.floor(Date.now() / 1000 + ttl)

  // Specific to `makeSignatureHash()` in the contract https://etherscan.io/address/0xDB34Da70Cfd694190742E94B7f17769Bc3d84D27#code#F2#L14
  const messageHash = keccak256(
    encodePacked(
      ['bytes', 'address', 'uint64', 'bytes32', 'bytes32'],
      [
        '0x1900', // This is hardcoded in the contract (EIP-191).
        sender, // target: The address the signature is for.
        BigInt(validUntil), // expires: The timestamp at which the response becomes invalid.
        keccak256(data), // request: The original request that was sent.
        keccak256(result), // result: The `result` field of the response (not including the signature part).
      ]
    )
  )

  console.log({ messageHash })

  const sig = await sign({
    hash: messageHash,
    privateKey: process.env.SIGNER_PRIVATE_KEY as Hex,
  })

  // An ABI encoded tuple of `(bytes result, uint64 expires, bytes sig)`, where
  // `result` is the data to return to the caller, and
  // `sig` is the (r,s,v) encoded message signature.
  // Specific to `verify()` in the contract https://etherscan.io/address/0xDB34Da70Cfd694190742E94B7f17769Bc3d84D27#code#F2#L14
  const encodedResponse = encodeAbiParameters(
    [
      { name: 'result', type: 'bytes' },
      { name: 'expires', type: 'uint64' },
      { name: 'sig', type: 'bytes' },
    ],
    [result, BigInt(validUntil), serializeSignature(sig)]
  )

  // "0x-prefixed hex string containing the result data."
  return Response.json(
    { data: encodedResponse },
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    }
  )
}
