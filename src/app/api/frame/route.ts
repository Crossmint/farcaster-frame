import {
  FrameRequest,
  getFrameMessage,
  getFrameHtmlResponse,
} from "@coinbase/onchainkit";
import { NextRequest, NextResponse } from "next/server";
import { getDomainKeySync, NameRegistryState } from "@bonfida/spl-name-service";
import { Connection, PublicKey } from "@solana/web3.js";
import { publicClient } from "@utils/viemClient";
import { normalize } from "viem/ens";
import { isAddress } from "viem";
import {
  initialFrame,
  inputError,
  mintingError,
  unknownError,
  getInitialSuccess,
  getPendingFrame,
  getSuccessFrame,
} from "@utils/frames";

export async function POST(req: NextRequest): Promise<Response> {
  const env = process.env.CROSSMINT_ENV || "staging";
  const searchParams = req.nextUrl.searchParams;
  const action: any = searchParams.get("action");

  // handle possible frame outcomes
  if (action === "reload") {
    // reloads initial frame
    return new NextResponse(getFrameHtmlResponse(initialFrame as any));
  } else if (action === "refresh") {
    // used to poll for txId when minting to wallet (not email)
    const actionId: any = searchParams.get("actionId");
    const data = await getActionStatus(env, actionId);

    if (data.status === "pending") {
      // still waiting for transaction to complete
      return new NextResponse(
        getFrameHtmlResponse(getPendingFrame(action, actionId) as any)
      );
    } else if (data.status === "succeeded") {
      // success with txId
      return new NextResponse(
        getFrameHtmlResponse(getSuccessFrame(data) as any)
      );
    }
  }

  try {
    const body: FrameRequest = await req.json();

    // use validated info instead of untrusted data
    const { message } = await getFrameMessage(body, {
      neynarApiKey: process.env.NEYNAR_API_KEY,
    });

    const input = message?.input || "";
    const btnIdx = message?.button || 0;

    const { recipientStr, collectionId, templateId, isEmail, isSolana } =
      await getMintingInfo(input, btnIdx);

    let mintBody: any = {
      recipient: recipientStr,
      templateId: templateId,
    };

    if (isSolana) {
      mintBody.compressed = true;
    }

    const data = await mintNFT(env, collectionId, mintBody);

    // const data = {
    //   error: true,
    //   message: "mock failure",
    // };

    if (data.error) {
      throw new Error(`Minting Error: ${data.message}`);
    }

    return new NextResponse(
      getFrameHtmlResponse(getInitialSuccess(isEmail, env, data) as any)
    );
  } catch (error) {
    return handleError(error);
  }
}

const handleError = (err: unknown) => {
  const error = err instanceof Error ? err.message : "";

  console.log(error);

  switch (true) {
    case error.startsWith("Input Error"):
      return new NextResponse(getFrameHtmlResponse(inputError as any));
    case error.startsWith("Minting Error"):
      return new NextResponse(getFrameHtmlResponse(mintingError as any));
    default:
      return new NextResponse(getFrameHtmlResponse(unknownError as any));
  }
};

const mintNFT = async (env: string, collectionId: string, mintBody: any) => {
  const crossmintURL = `https://${env}.crossmint.com/api/2022-06-09/collections/${collectionId}/nfts`;
  const crossmintOptions = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-api-key": process.env.CROSSMINT_API_KEY!,
    },
    body: JSON.stringify(mintBody),
  };

  const response = await fetch(crossmintURL, crossmintOptions);
  return await response.json();
};

const getActionStatus = async (env: string, actionId: string) => {
  const crossmintURL = `https://${env}.crossmint.com/api/2022-06-09/actions/${actionId}`;
  const crossmintOptions = {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-api-key": process.env.CROSSMINT_API_KEY!,
    },
  };

  const response = await fetch(crossmintURL, crossmintOptions);
  return await response.json();
};

const getChain = (btnIdx: number) => {
  switch (btnIdx) {
    case 1:
      return "base";
    case 2:
      return "optimism";
    case 3:
      return "polygon";
    case 4:
      return "solana";
    default:
      throw new Error("No chain matching the clicked button");
  }
};

const getMintingInfo = async (address: string, btnIdx: number) => {
  const chain = getChain(btnIdx);
  const { recipient, isEmail, isSolana } = await parseAddress(address);

  if (!isEmail && !isSolana && chain === "solana") {
    console.log("not solana and chain is solana");
    throw new Error(
      "Input Error: You must pass a valid email, .sol, or solana wallet address to mint on Solana"
    );
  } else if (isSolana && chain !== "solana") {
    console.log("is solana and chain is not solana");
    throw new Error(
      `Input Error: You must pass a valid email, .eth, or ${chain} wallet address to mint on ${chain}`
    );
  }

  const recipientStr = isEmail
    ? `email:${recipient}:${chain}`
    : `${chain}:${recipient}`;
  const { collectionId, templateId } = getCollectionInfo(chain);

  return {
    recipientStr,
    collectionId,
    templateId,
    isEmail,
    isSolana,
  };
};

const getCollectionInfo = (chain: string) => {
  let collectionId, templateId;

  switch (chain) {
    case "base":
      collectionId = process.env.CROSSMINT_COLLECTION_BASE;
      templateId = process.env.CROSSMINT_TEMPLATE_BASE;
      break;
    case "optimism":
      collectionId = process.env.CROSSMINT_COLLECTION_OPTIMISM;
      templateId = process.env.CROSSMINT_TEMPLATE_OPTIMISM;
      break;
    case "polygon":
      collectionId = process.env.CROSSMINT_COLLECTION_POLYGON;
      templateId = process.env.CROSSMINT_TEMPLATE_POLYGON;
      break;
    case "solana":
      collectionId = process.env.CROSSMINT_COLLECTION_SOLANA;
      templateId = process.env.CROSSMINT_TEMPLATE_SOLANA;
      break;
  }

  return { collectionId: collectionId || "", templateId };
};

const parseAddress = async (address: string) => {
  let recipient;
  let isEmail = false;
  let isSolana = false;

  switch (true) {
    case validateEmail(address):
      recipient = address;
      isEmail = true;
      break;
    case address.endsWith(".eth"):
      recipient = await parseENS(address);
      break;
    case address.endsWith(".sol"):
      recipient = await parseSOL(address);
      isSolana = true;
      break;
    case isAddress(address): // check for valid ethereum address
      recipient = address;
      break;
    case isSolanaAddress(address):
      recipient = address;
      isSolana = true;
      break;
    default:
      // invalid address, recipient will be returned as empty string
      break;
  }

  if (!recipient) {
    console.log(`recipient: ${recipient} / address: ${address}`);
    throw new Error(
      `Input Error: The \`recipient\` is empty after evaluation. Address sent: ${address}`
    );
  }

  return {
    recipient,
    isEmail,
    isSolana,
  };
};

const parseENS = async (address: string) => {
  const ensAddress = await publicClient.getEnsAddress({
    name: normalize(address),
  });

  return ensAddress || "";
};

const parseSOL = async (address: string) => {
  const { pubkey } = getDomainKeySync(address);
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const { registry } = await NameRegistryState.retrieve(connection, pubkey);

  const pubKey = new PublicKey(registry.owner);
  return pubKey.toBase58();
};

const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const isSolanaAddress = (address: string) => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};

export const dynamic = "force-dynamic";
