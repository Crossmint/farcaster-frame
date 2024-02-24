import { getFrameMetadata } from "@coinbase/onchainkit";
import type { Metadata } from "next";
import { initialFrame } from "@utils/frames";

const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL;

const frameMetadata = getFrameMetadata(initialFrame as any);

export const metadata: Metadata = {
  title: "Mint this NFT",
  description: "Vote for your favorite chain by minting this NFT",
  openGraph: {
    title: "Mint this NFT",
    description: "Vote for your favorite chain by minting this NFT",
    images: [`${NEXT_PUBLIC_URL}/nft.jpg`],
  },
  other: {
    ...frameMetadata,
  },
};

export default function Page() {
  return (
    <>
      <h1>Mint an NFT</h1>
    </>
  );
}
