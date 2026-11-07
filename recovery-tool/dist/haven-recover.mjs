#!/usr/bin/env node
// haven-recover: built from Haven's monorepo (packages/starknet/recovery-cli).
// Bundled packages and their licenses: THIRD_PARTY_NOTICES.md.
import { createRequire as __haven_createRequire } from "node:module";
const require = __haven_createRequire(import.meta.url);

// src/public-cli.ts
import { parseArgs } from "node:util";

// ../client/src/felt.ts
function normalizeFelt(value) {
  const asBigInt = typeof value === "bigint" ? value : BigInt(value);
  return `0x${asBigInt.toString(16).padStart(64, "0")}`;
}
var U128_MASK = (1n << 128n) - 1n;
function u256Calldata(amount) {
  if (amount < 0n) {
    throw new RangeError("a u256 amount cannot be negative");
  }
  return [normalizeFelt(amount & U128_MASK), normalizeFelt(amount >> 128n)];
}

// ../account/src/address.ts
import { CairoOption, CairoOptionVariant, CallData, hash as hash2 } from "starknet";

// ../account/src/argent-signer.ts
import { CairoCustomEnum, hash, shortString } from "starknet";
var STARKNET_SIGNER_LABEL = "Starknet Signer";
function signerEnum(variant) {
  return new CairoCustomEnum({
    Starknet: variant.Starknet,
    Secp256k1: void 0,
    Secp256r1: void 0,
    Eip191: void 0,
    Webauthn: void 0
  });
}
function computeStarknetSignerGuid(publicKey) {
  return hash.computePoseidonHash(
    shortString.encodeShortString(STARKNET_SIGNER_LABEL),
    publicKey
  );
}

// ../account/src/exported-owner-signer.ts
import { ec as ec2, num as num2, Signer } from "starknet";

// ../account/src/argent-signature.ts
import { CallData as CallData2 } from "starknet";
function toAccountSignature(...signerSignatures) {
  return [String(signerSignatures.length), ...signerSignatures.flat()];
}
function encodeStarknetSignerSignature(input) {
  return CallData2.compile([
    signerEnum({
      Starknet: { signer: input.publicKey, r: input.r, s: input.s }
    })
  ]);
}

// ../account/src/keys.ts
import { ec, num } from "starknet";
var STARK_CURVE_ORDER = ec.starkCurve.CURVE.n;
function ownerPublicKey(ownerKey) {
  return ec.starkCurve.getStarkKey(num.toHex(ownerKey));
}

// ../account/src/exported-owner-signer.ts
var ExportedOwnerKeySigner = class extends Signer {
  #ownerKey;
  #publicKey;
  constructor(ownerKey) {
    super("0x1");
    this.#ownerKey = ownerKey;
    this.#publicKey = ownerPublicKey(ownerKey);
  }
  async getPubKey() {
    return this.#publicKey;
  }
  async signRaw(msgHash) {
    const { r, s } = ec2.starkCurve.sign(msgHash, num2.toHex(this.#ownerKey));
    return toAccountSignature(
      encodeStarknetSignerSignature({ publicKey: this.#publicKey, r, s })
    );
  }
};

// ../account/src/owner-signer.ts
import { ec as ec3, num as num3, Signer as Signer2 } from "starknet";

// ../account/src/starknet-account.ts
import { Account } from "starknet";

// src/public-balance.ts
import { Account as Account2, RpcProvider } from "starknet";
var STRK = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
var MAINNET_TOKENS = [
  { symbol: "STRK", token: STRK },
  {
    symbol: "ETH",
    token: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
  },
  {
    symbol: "USDC",
    token: "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb"
  },
  {
    symbol: "USDT",
    token: "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8"
  },
  {
    symbol: "WBTC",
    token: "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac"
  }
];
var RecoveryInputError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "RecoveryInputError";
  }
};
function felt(name, value) {
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(value.trim())) {
    throw new RecoveryInputError(`${name} must be a 0x-prefixed hex felt`);
  }
  return BigInt(value.trim());
}
async function tokenBalance(provider, token, holder) {
  const [low = "0x0", high = "0x0"] = await provider.callContract({
    contractAddress: normalizeFelt(token),
    entrypoint: "balance_of",
    calldata: [normalizeFelt(holder)]
  });
  return BigInt(low) + (BigInt(high) << 128n);
}
var PublicAccountSession = class {
  address;
  provider;
  #ownerKey;
  constructor(keys) {
    this.address = normalizeFelt(felt("address", keys.address));
    this.#ownerKey = felt("Owner key", keys.ownerKey);
    this.provider = new RpcProvider({ nodeUrl: keys.rpcUrl });
  }
  get ownerPublicKey() {
    return ownerPublicKey(this.#ownerKey);
  }
  /** The person's own account, signing with the exported Owner Key. */
  account() {
    return new Account2({
      provider: this.provider,
      address: this.address,
      signer: new ExportedOwnerKeySigner(this.#ownerKey),
      cairoVersion: "1"
    });
  }
  /** Refuses an Owner Key the account at this address does not list as its owner. */
  async verifyOwner() {
    const [isOwner = "0x0"] = await this.provider.callContract({
      contractAddress: this.address,
      entrypoint: "is_owner_guid",
      calldata: [computeStarknetSignerGuid(this.ownerPublicKey)]
    }).catch(() => {
      throw new RecoveryInputError(
        "no account is deployed at this address on this network"
      );
    });
    if (BigInt(isOwner) === 0n) {
      throw new RecoveryInputError(
        "the Owner key is not an owner of this account"
      );
    }
  }
  /** The account's next transaction nonce, for tools that cannot read it themselves. */
  async nonce() {
    return BigInt(
      await this.provider.getNonceForAddress(this.address, "latest")
    );
  }
  /**
   * The public balance of each token, base units; `undefined` for a token
   * this network does not have (a mainnet address on another network).
   */
  async publicBalances(tokens) {
    const balances = [];
    for (const token of tokens) {
      const normalized = normalizeFelt(felt("token", token));
      balances.push({
        token: normalized,
        amount: await tokenBalance(
          this.provider,
          normalized,
          this.address
        ).catch(() => void 0)
      });
    }
    return balances;
  }
  /**
   * Sends `amount` of `token` from the public balance to `recipient`, signed
   * with the Owner Key; the account pays the gas in STRK. Answers once the
   * chain accepts it.
   */
  async transfer(input) {
    const token = normalizeFelt(felt("token", input.token));
    const recipient = normalizeFelt(felt("recipient", input.recipient));
    if (input.amount <= 0n)
      throw new RecoveryInputError("amount must be positive");
    const held = await tokenBalance(this.provider, token, this.address);
    if (held < input.amount) {
      throw new RecoveryInputError(
        `public balance of ${token} is ${held}, less than ${input.amount}`
      );
    }
    const { transaction_hash } = await this.account().execute(
      {
        contractAddress: token,
        entrypoint: "transfer",
        calldata: [recipient, ...u256Calldata(input.amount)]
      },
      { tip: 0n }
    );
    const receipt = await this.provider.waitForTransaction(transaction_hash);
    if (!receipt.isSuccess()) {
      const reason = "revert_reason" in receipt ? String(receipt.revert_reason) : "rejected";
      throw new Error(`the transfer did not go through: ${reason}`);
    }
    return { transactionHash: transaction_hash };
  }
};

// src/public-cli.ts
var USAGE = `haven-recover: your Haven account's public balance, with your Owner key

Usage:
  haven-recover keys      [keys]   check the Owner key, print the owner public key and next nonce
  haven-recover balance   [keys]   [--token 0x\u2026 \u2026]
  haven-recover transfer  [keys]   --token 0x\u2026 --amount <base units> --to 0x\u2026

Keys (Account \u203A Security \u203A Recovery keys in the app), from flags or the
environment; prefer the environment, so they stay out of your shell history:
  --address     HAVEN_ADDRESS     your Starknet address
  --owner-key   HAVEN_OWNER_KEY   Owner key (moves your money; keep it secret)
  --rpc         STARKNET_RPC      any Starknet JSON-RPC 0.10 node

balance lists STRK, ETH, USDC, USDT and WBTC on mainnet unless --token names
others. transfer pays its gas in STRK from the same account. Amounts are base
units (USDC and USDT have 6 decimals, STRK and ETH 18, WBTC 8).
`;
function required(name, value) {
  if (!value) throw new RecoveryInputError(`missing ${name}`);
  return value;
}
async function main(argv, env = process.env, out = console) {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      address: { type: "string" },
      "owner-key": { type: "string" },
      rpc: { type: "string" },
      token: { type: "string", multiple: true },
      amount: { type: "string" },
      to: { type: "string" },
      help: { type: "boolean", short: "h" }
    }
  });
  const [command] = positionals;
  if (values.help || !command) {
    out.log(USAGE);
    return command || values.help ? 0 : 1;
  }
  try {
    const session = new PublicAccountSession({
      address: required("--address", values.address ?? env.HAVEN_ADDRESS),
      ownerKey: required(
        "--owner-key",
        values["owner-key"] ?? env.HAVEN_OWNER_KEY
      ),
      rpcUrl: required("--rpc", values.rpc ?? env.STARKNET_RPC)
    });
    await session.verifyOwner();
    switch (command) {
      case "keys": {
        out.log(`address           ${session.address}`);
        out.log(`owner public key  ${session.ownerPublicKey}`);
        out.log(`next nonce        ${await session.nonce()}`);
        out.log("the Owner key signs for this account");
        return 0;
      }
      case "balance": {
        const named = values.token?.length ? values.token.map((token) => ({ symbol: "", token })) : MAINNET_TOKENS;
        const balances = await session.publicBalances(
          named.map(({ token }) => token)
        );
        balances.forEach(({ token, amount }, index) => {
          const symbol = named[index]?.symbol;
          const label = `${symbol ? `${symbol.padEnd(5)} ` : ""}${token}`;
          out.log(`${label}  ${amount ?? "not a token on this network"}`);
        });
        return 0;
      }
      case "transfer": {
        const { transactionHash } = await session.transfer({
          token: required("--token", values.token?.[0]),
          amount: BigInt(required("--amount", values.amount)),
          recipient: required("--to", values.to)
        });
        out.log(`sent: ${transactionHash}`);
        return 0;
      }
      default:
        out.error(`unknown command: ${command}

${USAGE}`);
        return 1;
    }
  } catch (error) {
    out.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

// bin/haven-recover-public.ts
process.exitCode = await main(process.argv.slice(2));
