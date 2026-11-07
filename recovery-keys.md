# Recovery keys

You opened this page from "How to use these keys" in the Haven app (Account › Security › Recovery keys). Your recovery keys let you move your own money with open tools, at any time, without the Haven app. Haven being offline is one example of when you'd use them; you don't need a reason. This page explains what each key is, how to keep them safe, and how to move your money with them.

## What the screen gives you

| Item | What it is | Secret? |
| --- | --- | --- |
| Starknet address | Your Haven account on Starknet. | No |
| Owner key | The Stark private key that signs for the account (one owner, no guardian). | Yes: anyone with it can move your money |
| Viewing key | The key that finds and reads your shielded balance in the privacy pool. | Yes: anyone with it can see your shielded balance |
| Account class | The account contract class hash (Argent v0.5). Tools need it to import the account. | No |
| Privacy pool | The StarkWare privacy pool contract that holds your shielded balance. | No |

The app derives both keys on your device right after you confirm with your passkey. Haven never receives them and never stores them, so Haven can't give them back if you lose them.

## Keep them safe

- Write them down offline. Don't keep them in a photo, a chat or a cloud note.
- Clear your clipboard after you paste them somewhere safe.
- Haven support will never ask for your keys. Anyone who asks is trying to take your money.

## The simplest path

1. **If your balance is shielded, withdraw it in the app first.** Use **Withdraw** and send it to your account's own Starknet address (the one on the Recovery keys screen). It becomes public balance in your account.
2. **Move that public balance with your Owner key**, using any tool you like: the open script below, or starkli.

Taking the shielded balance out without the app has no public tool yet; use Withdraw in the app.

## Move your balance with your Owner key

Your public balance sits in your Starknet account, and the Owner key signs for it. The account pays the network fee in STRK, so keep a little STRK in it. Haven's sponsored gas only works inside the app.

### With the open script

[`haven-recover`](recovery-tool/) is a short open script (one readable file) that needs only your Starknet address, your Owner key and any Starknet node. It checks the key, shows your public balance and sends it to another wallet:

```bash
node dist/haven-recover.mjs keys
node dist/haven-recover.mjs balance
node dist/haven-recover.mjs transfer --token <token contract> --amount <amount in base units> --to <destination>
```

Setup and token addresses are in its [README](recovery-tool/README.md).

### With starkli

With [starkli](https://book.starkli.rs) 0.4.2:

1. Print your account's owner public key and next nonce with `node dist/haven-recover.mjs keys` (see above). starkli can't read a Haven account from the chain by itself (`starkli account fetch` doesn't know the Argent v0.5 class), so you describe it by hand in the next step.
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

Wallets such as Ready (Argent) and Braavos may also import an account by address and private key; check the wallet's own documentation, because support varies by version.

## What the keys can't recover

- The card balance. It stays in dollars with the card issuer and is not on Starknet, so no key moves it. Withdraw it to your Haven balance while you use Haven.
- Your Haven history. Anything you move outside Haven won't show in the app, and Haven can't explain those movements.

## If you use e-mail or Google to sign in

Recovery keys are not available yet for accounts that sign in with e-mail or Google. These accounts need an additional security check before the app can show the keys, and the screen tells you so instead of showing them.

---

<sub>A deposit sent from another network that never finished arriving in Haven stays at its Haven receiving address and is still yours. The keys can find it, but no public tool moves it yet.</sub>
