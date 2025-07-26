"use client";

import { 
  DynamicContextProvider, 
} from "@dynamic-labs/sdk-react-core"; 
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector"; 
import { createConfig, WagmiProvider } from "wagmi"; 
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; 
import { http } from "viem"; 
import { mainnet, sepolia } from "viem/chains"; 
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum"; 
import { SuiWalletConnectors } from "@dynamic-labs/sui"; 

const config = createConfig({ 
  chains: [mainnet, sepolia], 
  multiInjectedProviderDiscovery: false, 
  transports: { 
    [mainnet.id]: http(), 
    [sepolia.id]: http(),
  }, 
}); 

const queryClient = new QueryClient(); 

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) { 
  return ( 
    <DynamicContextProvider 
      settings={{ 
        // Find your environment id at https://app.dynamic.xyz/dashboard/developer
        environmentId: "f6cec077-bffe-4c12-9008-0862a05b9bf0", 
        walletConnectors: [EthereumWalletConnectors, SuiWalletConnectors], 
        initialAuthenticationMode: "connect-only",
        bridgeChains : [{
            chain: "EVM",
        //   chainId: mainnet.id,

        }, {
            chain : "SUI",
        //   chainId: sui.id,
        }],

      }} 
    > 
      <WagmiProvider config={config}> 
        <QueryClientProvider client={queryClient}> 
          <DynamicWagmiConnector> 
            {children}
          </DynamicWagmiConnector> 
        </QueryClientProvider> 
      </WagmiProvider> 
    </DynamicContextProvider> 
  ); 
}