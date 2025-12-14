import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";

// Your Thirdweb client ID
const clientId = '906a1191b74f2e8725ae9970adeabe1fjqktxW6-OjZkRFQMjmYN5pxj_RdeK1Mpvy_VTi-ebpDmYISrGHbHGaD41MoN7YJ1x7MTPWb_Kgh4l6e92Wtp3Q';

if (!clientId) {
  throw new Error('Missing Thirdweb client ID');
}

export const client = createThirdwebClient({
  clientId,
});

// Story Aeneid testnet configuration
export const storyAeneidTestnet = defineChain({
  id: 1315,
  name: 'Story Aeneid Testnet',
  rpc: 'https://aeneid.storyrpc.io',
  nativeCurrency: {
    name: 'IP',
    symbol: 'IP',
    decimals: 18,
  },
  blockExplorers: {
    default: {
      name: 'Story Scan',
      url: 'https://aeneid.storyscan.xyz',
    },
  },
});

export const chain = storyAeneidTestnet;