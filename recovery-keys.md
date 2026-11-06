# Recovery keys

You opened this page from "How to use these keys" in the Haven app (Account › Security › Recovery keys). It explains what each recovery key is, how to keep them safe, and how to use them to reach your money if Haven is ever offline.

## What the screen gives you

| Item | What it is | Secret? |
| --- | --- | --- |
| Starknet address | Your Haven account on Starknet. | No |
| Owner key | The Stark private key that signs for the account (one owner, no guardian). | Yes: anyone with it can move your money |
| Viewing key | The key that finds and reads your shielded notes in the privacy pool. | Yes: anyone with it can see your shielded balance |
| Account class | The account contract class hash (Argent v0.5). Tools need it to import the account. | No |
| Privacy pool | The StarkWare privacy pool contract that holds your shielded balance. | No |

The app derives both keys on your device right after you confirm with your passkey. Haven never receives them and never stores them, so Haven can't give them back if you lose them.

## Keep them safe

- Write them down offline. Don't keep them in a photo, a chat or a cloud note.
- Clear your clipboard after you paste them somewhere safe.
- Haven support will never ask for your keys. Anyone who asks is trying to take your money.

## Move your public balance without Haven

Your public balance sits in your Starknet account. Any Starknet tool that accepts a private key can sign for it. With [starkli](https://book.starkli.rs) 0.4.2:

1. Print your account's owner public key and next nonce with [haven-recover](recovery-tool/): from its folder, `node dist/haven-recover.mjs keys` (setup in its [README](recovery-tool/README.md)). starkli can't read a Haven account from the chain by itself (`starkli account fetch` doesn't know the Argent v0.5 class), so you describe it by hand in the next step.
2. Save this as `haven-account.json`, with your owner public key and Starknet address (no secret involved):

   ```json
   {
     "version": 1,
     "variant": { "type": "argent", "version": 1, "owner": "<owner public key>", "guardian": "0x0" },
     "deployment": {
       "status": "deployed",
       "class_hash": "0x073414441639dcd11d1846f287650a00c60c416b9d3ba45d31c651672125b2c2",
       "address": "<Starknet address>"
     }
   }
   ```

3. Send a token to another wallet, signing with your Owner key. starkli can't estimate the fee on current Starknet nodes, so give it the account's next nonce and the gas yourself:

   ```bash
   starkli invoke --rpc <Starknet RPC> --account haven-account.json --private-key <Owner key> \
     --nonce <next nonce> \
     --l1-gas 0 --l1-gas-price-raw <l1 gas price> \
     --l2-gas 2000000 --l2-gas-price-raw <l2 gas price> \
     --l1-data-gas 1000 --l1-data-gas-price-raw <l1 data gas price> \
     <token contract> transfer <destination> u256:<amount in base units>
   ```

   `keys` printed the next nonce. Take the three gas prices from the latest block on an explorer and set them a little higher.

The account pays gas in STRK, so it needs a little STRK before step 3. Haven's sponsored gas is not available without Haven.

Wallets such as Ready (Argent) and Braavos may also import an account by address and private key; check the wallet's own documentation, because support varies by version.

## Your shielded balance

Your shielded notes live in the privacy pool, and only your Viewing key can find them. With the Viewing key and the Owner key you can list your notes straight from the pool contract and withdraw them through an open prover. Haven's open recovery tool, [`haven-recover`](recovery-tool/), lists that balance and the deposits still waiting at your receiving addresses using only these two keys, your address, the pool address and any Starknet node; to withdraw, it needs a Starknet transaction prover (StarkWare's open prover, run by you or a provider) and a little STRK in your account for gas.

Two things to know before you count on it:

- **Withdrawing needs a prover and STRK.** The pool only accepts a withdrawal that comes with a proof, and there is no free public service that makes one. You can run StarkWare's open prover on your own machine (it needs a large one, about 24 GB of memory) or use a provider that runs it. Your account also pays the network fee and the pool's fee in STRK, so keep a few STRK in it.
- **Deposits still on their way show up, but can't be moved yet.** Money sent to a Haven receiving address that never reached the pool is still yours, and the tool shows where it is and how much. Bringing it into the pool requires a check that only StarkWare's screening service signs, so until that service is open to individuals the tool can show it but not move it.

## What the keys can't recover

- The card balance. It stays in dollars with the card issuer and is not on Starknet, so no key moves it. Withdraw it to your Haven balance while you use Haven.
- Your Haven history. Anything you move outside Haven won't show in the app, and Haven can't explain those movements.

## If you use e-mail or Google to sign in

Recovery keys are not available yet for accounts that sign in with e-mail or Google. These accounts need an additional security check before the app can show the keys, and the screen tells you so instead of showing them.
