export const initialFrame = {
  buttons: [
    {
      label: "Base",
      action: "post",
    },
    {
      label: "Optimism",
      action: "post",
    },
    {
      label: "Polygon",
      action: "post",
    },
    {
      label: "Solana",
      action: "post",
    },
  ],
  image: {
    src: `${process.env.NEXT_PUBLIC_URL}/nft.jpg`,
    aspectRatio: "1:1",
  },
  input: {
    text: "Enter email or wallet address",
  },
  postUrl: `${process.env.NEXT_PUBLIC_URL}/api/frame`,
};

export const inputError = {
  image: {
    src: `${process.env.NEXT_PUBLIC_URL}/input-error.jpg`,
    aspectRatio: "1:1",
  },
  ogTitle: "Error",
  buttons: [
    {
      label: "Restart",
      action: "post",
    },
  ],
  postUrl: `${process.env.NEXT_PUBLIC_URL}/api/frame?action=reload`,
};

export const mintingError = {
  image: {
    src: `${process.env.NEXT_PUBLIC_URL}/minting-error.jpg`,
    aspectRatio: "1:1",
  },
  ogTitle: "Error",
  buttons: [
    {
      label: "Restart",
      action: "post",
    },
  ],
  postUrl: `${process.env.NEXT_PUBLIC_URL}/api/frame?action=reload`,
};

export const unknownError = {
  image: {
    src: `${process.env.NEXT_PUBLIC_URL}/error.jpg`,
    aspectRatio: "1:1",
  },
  ogTitle: "Error",
  buttons: [
    {
      label: "Restart",
      action: "post",
    },
  ],
  postUrl: `${process.env.NEXT_PUBLIC_URL}/api/frame?action=reload`,
};

export const getInitialSuccess = (isEmail: boolean, env: string, data: any) => {
  const action = isEmail ? "reload" : "refresh";
  const buttons = isEmail
    ? [
        {
          label: "View your NFT on Crossmint",
          action: "link",
          target: `https://${env}.crossmint.com/user/collection`,
        },

        {
          label: "Restart",
          action: "post",
        },
      ]
    : [
        {
          label: "Refresh for minting status",
        },
      ];

  return {
    image: {
      src: `${process.env.NEXT_PUBLIC_URL}/success.jpg`,
      aspectRatio: "1:1",
    },
    buttons,
    postUrl: `${process.env.NEXT_PUBLIC_URL}/api/frame?action=${action}&actionId=${data.actionId}`,
  };
};
export const getPendingFrame = (action: string, actionId: string) => {
  return {
    buttons: [
      {
        label: "Refresh",
        action: "post",
      },
      {
        label: "Restart",
        action: "post",
      },
    ],
    image: {
      src: `${process.env.NEXT_PUBLIC_URL}/pending.jpg`,
      aspectRatio: "1:1",
    },
    postUrl: `${process.env.NEXT_PUBLIC_URL}/api/frame?action=${action}&actionId=${actionId}`,
  };
};

export const getSuccessFrame = (data: any) => {
  let scannerUrl = getScannerUrl(data);

  console.log("success frame utils: ", scannerUrl);
  return {
    buttons: [
      {
        label: "View Transaction",
        action: "link",
        target: `${scannerUrl}`,
      },
      {
        label: "Restart",
        action: "post",
      },
    ],
    image: {
      src: `${process.env.NEXT_PUBLIC_URL}/success.jpg`,
      aspectRatio: "1:1",
    },
    postUrl: `${process.env.NEXT_PUBLIC_URL}/api/frame?action=reload`,
  };
};

const getScannerUrl = (data: any) => {
  const env = process.env.CROSSMINT_ENV;
  const { txId, chain } = data.data;

  switch (chain) {
    case "base-sepolia":
      return `https://sepolia.basescan.org/tx/${txId}`;
    case "base":
      return `https://basescan.org/tx/${txId}`;
    case "optimism-sepolia":
      return `https://sepolia-optimism.etherscan.io/tx/${txId}`;
    case "optimism":
      return `https://optimistic.etherscan.io/tx/${txId}`;
    case "polygon":
      return env === "staging"
        ? `https://mumbai.polygonscan.com/tx/${txId}`
        : `https://polygonscan.com/tx/${txId}`;
    case "solana":
      return env === "staging"
        ? `https://xray.helius.xyz/tx/${txId}?network=devnet`
        : `https://xray.helius.xyz/tx/${txId}?network=mainnet`;
  }
};
