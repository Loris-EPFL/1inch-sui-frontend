"use client";

import { useDynamicContext, useUserWallets } from '@dynamic-labs/sdk-react-core';
import { Wallet } from '@dynamic-labs/sdk-react-core';

export function WalletAddresses() {
  const { user, bridgeChains } = useDynamicContext();
  const userWallets = useUserWallets();

  // Filter wallets by chain
  const evmWallets = userWallets?.filter((wallet: Wallet) => 
    wallet.chain === 'EVM'
  ) || [];
  
  const suiWallets = userWallets?.filter((wallet: Wallet) => 
    wallet.chain === 'SUI'
  ) || [];

  // Check if user has wallets from all required bridge chains
  const isFullyConnected = bridgeChains ? bridgeChains.every(bridgeChain => 
    userWallets?.some((wallet: Wallet) => wallet.chain === bridgeChain.chain)
  ) : false;

  if (!userWallets || userWallets.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 border rounded-lg bg-card">
        <h3 className="text-lg font-semibold mb-4">Connected Wallets</h3>
        <p className="text-muted-foreground">No wallets connected. Please connect your wallet to see addresses.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4">Connected Wallets</h3>
      
      <div className="space-y-4">
        {/* EVM Wallets */}
        {evmWallets.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-md font-medium text-primary">EVM Wallets</h4>
            {evmWallets.map((wallet: Wallet, index: number) => (
              <div key={`evm-${index}`} className="p-3 bg-muted rounded-md">
                <p className="text-sm font-mono break-all">
                  <span className="text-muted-foreground">Address:</span> {wallet.address}
                </p>
                {wallet.connector && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Connector: {wallet.connector.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sui Wallets */}
        {suiWallets.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-md font-medium text-primary">Sui Wallets</h4>
            {suiWallets.map((wallet: Wallet, index: number) => (
              <div key={`sui-${index}`} className="p-3 bg-muted rounded-md">
                <p className="text-sm font-mono break-all">
                  <span className="text-muted-foreground">Address:</span> {wallet.address}
                </p>
                {wallet.connector && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Connector: {wallet.connector.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Connection Status */}
        <div className="pt-4 border-t">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isFullyConnected ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
            <span className="text-sm text-muted-foreground">
              {isFullyConnected 
                ? 'Fully connected to all required chains' 
                : 'Connect wallets from both chains for full functionality'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}