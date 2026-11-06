# haven-recover

Find and withdraw your Haven shielded balance with your recovery keys, without
any Haven service: no Haven API, no Haven discovery, no Haven paymaster. It
reads the StarkWare privacy pool straight from any Starknet node you choose.

You get the keys in the Haven app under **Account › Security › Recovery keys**:

| Item | Used for |
| --- | --- |
| Starknet address | the account the tool acts for |
| Owner key | signs the withdrawal and pays its gas (secret) |
| Viewing key | finds your shielded balance in the pool (secret) |
| Privacy pool | the pool contract that holds the balance |

## What it does

| Command | What it needs | Works without Haven |
| --- | --- | --- |
| `balance` | address, both keys, pool, an RPC | yes |
| `pending` | the same | yes |
| `unshield` | the same, a prover, STRK for gas | yes, with a prover you can reach (see Limits) |

- **balance** lists your unspent shielded balance per token. It reads the pool
  contract with your Viewing key; nothing leaves your machine except ordinary
  `starknet_call` reads to the node you pick.
- **pending** walks the receive addresses your Viewing key derives (the ones
  Haven gave you for deposits from other networks), in order, until 20 in a
  row hold nothing, and prints each one that still holds a balance.
- **unshield** spends shielded balance back to a public address you pick. It
  builds the pool call, has it proven, and sends it from your own account,
  which pays the gas and the pool's fee in STRK. Any change comes back to you
  as shielded balance.

## Install and run

You need Node.js 22 or newer. From this folder (`recovery-tool/` of the
haven-doc repository):

```bash
npm install          # one public dependency: starknet.js
```

`dist/haven-recover.mjs` is the whole tool in one file. It is built from
Haven's code together with the StarkWare privacy SDK; see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Read it before you trust it
with your keys: everything it sends is a JSON-RPC call to the node you name,
plus, for `unshield`, the pool call to the prover you name.

Put the keys in the environment so they stay out of your shell history:

```bash
read -rs HAVEN_OWNER_KEY && export HAVEN_OWNER_KEY
read -rs HAVEN_VIEWING_KEY && export HAVEN_VIEWING_KEY
export HAVEN_ADDRESS=0x…           # Starknet address
export HAVEN_POOL=0x…              # Privacy pool
export STARKNET_RPC=https://…      # any Starknet JSON-RPC 0.10 node
```

Then:

```bash
node dist/haven-recover.mjs balance
node dist/haven-recover.mjs pending --token 0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb
node dist/haven-recover.mjs unshield \
  --token 0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb \
  --amount 1000000 \
  --to 0x<your other wallet> \
  --prover https://<a starknet_proveTransaction endpoint>
```

Amounts are base units: USDC and USDT have 6 decimals, STRK and ETH 18, WBTC 8.
Mainnet token addresses:

| Token | Address |
| --- | --- |
| STRK | `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d` |
| ETH | `0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7` |
| USDC | `0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb` |
| USDT | `0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8` |
| WBTC | `0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac` |

Before anything else, every command checks that the keys belong together: the
pool must hold your Viewing key's public key for the address, and the account
must list your Owner key as its owner. A wrong key stops the tool before it
reads or sends anything.

## Before you unshield

- **STRK for gas.** Your account pays the transaction itself: the network's gas
  plus the pool's fee (`get_fee_amount` on the pool, in STRK; 4 to 6 STRK in
  October 2026). Send a few STRK to your Starknet address first. Haven's
  sponsored gas is not available without Haven.
- **A prover.** The pool only accepts a withdrawal with a STARK proof of the
  call. The tool sends the call to any service that speaks
  `starknet_proveTransaction` (StarkWare's transaction prover). See Limits.
- **The proof is built 10 blocks behind the head** and expires about 450
  blocks later, so run `unshield` in one go.

## Limits

These are not solved by this tool, and it does not pretend otherwise:

1. **No public mainnet prover.** As of November 2026 StarkWare runs no public
   prover for mainnet. The two ways to get a proof are:
   - run StarkWare's open transaction prover yourself
     ([`starknet_transaction_prover`](https://github.com/starkware-libs/sequencer/tree/main/crates/starknet_transaction_prover),
     image `ghcr.io/starkware-libs/…/transaction-prover`): it needs a machine
     with about 24 GB of RAM and a node that serves `starknet_getStorageProof`
     at least 10 blocks deep, and proves a withdrawal in 15 to 25 seconds;
   - use a hosted relay such as Starkscan's STRK20 prover, which needs an API
     key its operators approve.
   A withdrawal needs no screening attestation, so any of these works for it.
2. **Pending deposits are found, not collected.** `pending` shows what waits
   at your receive addresses. Bringing it into the pool (a Shadow Collect)
   deposits into the pool, and the pool requires a screening attestation that
   only StarkWare's screening service signs. Moving it straight out of the
   receive address also has to go through the pool and its anonymizer. Until
   that service is reachable to individuals, the balance stays visible but
   not movable by this tool.
3. **The card balance** is with the card issuer, in dollars, not on Starknet.
   No key moves it.

## Your public balance

Your Starknet address may also hold public tokens. Any Starknet tool that
signs for an Argent account with a private key can move them. starkli 0.4.2
(the latest release in November 2026) signs correctly for a Haven account, but
it cannot read one from the chain or estimate its fee on current nodes, so it
needs an account file written by hand and explicit gas and nonce. The steps
are in the guide, [Move your public balance without Haven](../recovery-keys.md#move-your-public-balance-without-haven);
`node dist/haven-recover.mjs keys` prints the owner public key and the next
nonce they need.

## How it is tested

Haven tests the tool against its local Starknet stack (a devnet with the
privacy pool deployed), never against a public network: keys produced by the
app's own reveal, an account deployed from them, a shielded deposit, then the
tool lists the balance, finds a funded receive address and unshields to a
fresh address paying its own gas. The local stack proves with a call mock; on
a public network the proof comes from a real prover, and the rest of the path
is the same. The tests and the source live in Haven's application repository
(`packages/starknet/recovery-cli`).

## License

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the packages bundled
into `dist/haven-recover.mjs` and their licenses.
