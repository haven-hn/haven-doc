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

Your public balance sits in your Starknet account. Any Starknet tool that accepts a private key can sign for it. With [starkli](https://book.starkli.rs):

1. Save the account description (read from the chain, no secret involved):
   `starkli account fetch <Starknet address> --output haven-account.json`
2. Send a token to another wallet, signing with your Owner key:
   `starkli invoke --account haven-account.json --private-key <Owner key> <token contract> transfer <destination> u256:<amount in base units>`

The account pays gas in STRK, so it needs a little STRK before step 2. Haven's sponsored gas is not available without Haven.

Wallets such as Ready (Argent) and Braavos may also import an account by address and private key; check the wallet's own documentation, because support varies by version.

## Your shielded balance

Your shielded notes live in the privacy pool, and only your Viewing key can find them. With the Viewing key and the Owner key you can list your notes straight from the pool contract and withdraw them through an open prover. Haven is publishing an open tool for this; until then, keep both keys and the pool address together.

Deposits that were still on their way to the pool when Haven went offline can be collected the same way: their receiving addresses are computed from your Viewing key.

## What the keys can't recover

- The card balance. It stays in dollars with the card issuer and is not on Starknet, so no key moves it. Withdraw it to your Haven balance while you use Haven.
- Your Haven history. Anything you move outside Haven won't show in the app, and Haven can't explain those movements.

## If you use e-mail or Google to sign in

Recovery keys are not available yet for accounts that sign in with e-mail or Google. These accounts need an additional security check before the app can show the keys, and the screen tells you so instead of showing them.
