# haven-recover

Move the money in your Haven account with your Owner key and an open tool, at
any time, without the Haven app: you don't need Haven's servers, its API or
its sponsored gas. Haven being offline is one reason to use it; wanting your
money somewhere else is just as good a reason.

This script works with your account's **public balance**: the tokens your
Starknet address holds outside the privacy pool. It checks your Owner key,
shows that balance and sends it to another wallet. The Owner key never leaves
your machine: the script signs locally and sends only ordinary Starknet
JSON-RPC calls to the node you choose.

You get the items it needs in the Haven app under **Account › Security ›
Recovery keys**:

| Item | Used for |
| --- | --- |
| Starknet address | the account the script acts for |
| Owner key | signs the transfer (secret) |

## If your money is shielded

Shielded money sits in the privacy pool, not in your public balance. Taking
the shielded balance out without the app has no public tool yet: use
**Withdraw** in the app and send it to your account's own Starknet address.
It then becomes public balance, and this script moves it.

## Install

You need Node.js 22 or newer. From this folder (`recovery-tool/` of the
haven-doc repository):

```bash
npm install          # one public dependency: starknet.js
```

`dist/haven-recover.mjs` is the whole script in one file of about 300 lines,
built from Haven's code. Read it before you trust it with your key.

## Run

Put the key in the environment so it stays out of your shell history:

```bash
read -rs HAVEN_OWNER_KEY && export HAVEN_OWNER_KEY
export HAVEN_ADDRESS=0x…           # Starknet address
export STARKNET_RPC=https://…      # any Starknet JSON-RPC 0.10 node
```

Then:

```bash
node dist/haven-recover.mjs keys       # checks the key; prints the owner public key and next nonce
node dist/haven-recover.mjs balance    # public STRK, ETH, USDC, USDT and WBTC
node dist/haven-recover.mjs transfer \
  --token 0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb \
  --amount 1000000 \
  --to 0x<your other wallet>
```

Every command first checks that the account at the address lists your Owner
key as its owner, and stops before it reads or sends anything if it doesn't.

`transfer` pays the network fee in STRK from the same account, so keep a
little STRK there. Amounts are base units: USDC and USDT have 6 decimals,
STRK and ETH 18, WBTC 8. Mainnet token addresses:

| Token | Address |
| --- | --- |
| STRK | `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d` |
| ETH | `0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7` |
| USDC | `0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb` |
| USDT | `0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8` |
| WBTC | `0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac` |

## Other tools

Any Starknet tool that signs for an Argent account with a private key can
move the same balance. With starkli 0.4.2 it takes an account file written
by hand and an explicit nonce and gas; the steps are in the guide,
[Move your balance with your Owner key](../recovery-keys.md#move-your-balance-with-your-owner-key).
`keys` prints the owner public key and the next nonce those steps need.

## How it is tested

Haven tests the script against its local Starknet stack (a devnet with Haven's
contracts deployed), never against a public network: an account deployed from
a fresh Owner key, then `keys`, `balance` and `transfer` to a fresh address,
plus the starkli steps of the guide. The source and the tests live in Haven's
application repository (`packages/starknet/recovery-cli`).

## License

Apache-2.0, see [LICENSE](LICENSE). Its one dependency is listed in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
