"use client";

import { useState, useEffect } from "react";
import { useDynamicContext, useUserWallets } from "@dynamic-labs/sdk-react-core";
import { parseUnits, keccak256, toHex } from "viem";
import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { Wallet } from '@dynamic-labs/sdk-react-core';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";



// Coin mapping structure
interface CoinInfo {
  name: string;
  address: string;
  decimals: number;
}

interface CoinMapping {
  [key: string]: CoinInfo;
}

const ETHEREUM_COINS: CoinMapping = {
  'USDC': {
    name: 'USDC (Ethereum)',
    address: '0xA0b86a33E6441b8dB4B2a4B61c4b4b6b4b4b4b4b',
    decimals: 6
  },
  'USDT': {
    name: 'USDT (Ethereum)',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6
  },
  'ETH': {
    name: 'ETH (Ethereum)',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18
  }
};

const SUI_COINS: CoinMapping = {
  'USDC': {
    name: 'USDC (Sui)',
    address: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
    decimals: 6
  },
  'USDT': {
    name: 'USDT (Sui)',
    address: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
    decimals: 6
  },
  'SUI': {
    name: 'SUI',
    address: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
    decimals: 9
  }
};

// Types for the order creation
interface OrderParams {
  makingAmount: string;
  takingAmount: string;
  makerAsset: string;
  takerAsset: string;
}

interface Order {
  salt: string;
  makerAsset: string;
  takerAsset: string;
  maker: string;
  receiver: string;
  makingAmount: string;
  takingAmount: string;
  makerTraits: string;
}

interface OrderSubmission {
  order: Order;
  srcChainId: number;
  signature: string;
  extension: string;
  quoteId: string;
  secretHashes: string[];
}

interface CrossChainOrderData {
  orderSubmission: OrderSubmission;
  secret: string;
  orderHash: string;
}

export function CrossChainSwap() {
  const { primaryWallet } = useDynamicContext();
  
  // Chain and coin selection state
  const [isEthToSui, setIsEthToSui] = useState(true); // true = ETH->SUI, false = SUI->ETH
  const [sourceCoin, setSourceCoin] = useState('USDC');
  const [destinationCoin, setDestinationCoin] = useState('USDC');
  const [customDestinationAddress, setCustomDestinationAddress] = useState('');
  const [useCustomDestination, setUseCustomDestination] = useState(false);
  
  const [orderParams, setOrderParams] = useState<OrderParams>({
    makingAmount: "100",
    takingAmount: "99",
    makerAsset: ETHEREUM_COINS['USDC'].address,
    takerAsset: SUI_COINS['USDC'].address
  });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderData, setOrderData] = useState<CrossChainOrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userWallets = useUserWallets();

  // Filter wallets by chain
  const evmWallets = userWallets?.filter((wallet: Wallet) => 
    wallet.chain === 'EVM'
  ) || [];
  
  const suiWallets = userWallets?.filter((wallet: Wallet) => 
    wallet.chain === 'SUI'
  ) || [];
  
  // Get current source and destination coins based on direction
  const sourceCoins = isEthToSui ? ETHEREUM_COINS : SUI_COINS;
  const destinationCoins = isEthToSui ? SUI_COINS : ETHEREUM_COINS;
  
  // Get wallet addresses for default destination
  const getDefaultDestinationAddress = () => {
    if (isEthToSui) {
      return suiWallets[0]?.address || '';
    } else {
      return evmWallets[0]?.address || '';
    }
  };
  
  // Update order params when coins or direction change
  const updateOrderParams = () => {
    const newMakerAsset = sourceCoins[sourceCoin]?.address || '';
    const newTakerAsset = destinationCoins[destinationCoin]?.address || '';
    
    setOrderParams(prev => ({
      ...prev,
      makerAsset: newMakerAsset,
      takerAsset: newTakerAsset
    }));
  };
  
  // Handle chain direction switch
  const handleChainSwitch = () => {
    setIsEthToSui(!isEthToSui);
    // Swap source and destination coins
    const tempCoin = sourceCoin;
    setSourceCoin(destinationCoin);
    setDestinationCoin(tempCoin);
    setCustomDestinationAddress('');
    setUseCustomDestination(false);
  };
  
  // Update order params when coins or direction change
  useEffect(() => {
    updateOrderParams();
  }, [sourceCoin, destinationCoin, isEthToSui]);

  // Generate a random secret (in production, use crypto-secure random)
  const generateSecret = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return '0x' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  // Generate a random salt
  const generateSalt = (): string => {
    return Math.floor(Math.random() * 1000000).toString();
  };

  // Hash a secret to create secret hash
  const hashSecret = (secret: string): string => {
    return keccak256(toHex(secret));
  };

  const createAndSignOrder = async () => {
    if (!primaryWallet) {
      setError("Please connect your wallet first");
      return;
    }

    setIsCreatingOrder(true);
    setError(null);

    try {
      // Get user address
      const userAddress = primaryWallet.address;

      if (!userAddress) {
        throw new Error("Wallet address not available");
      }
      
      // Generate secret and hash it
      const secret = generateSecret();
      const secretHash = hashSecret(secret);
      
      // Create the order object according to the API specification
      const order: Order = {
        salt: generateSalt(),
        makerAsset: orderParams.makerAsset,
        takerAsset: orderParams.takerAsset,
        maker: userAddress,
        receiver: useCustomDestination && customDestinationAddress 
          ? customDestinationAddress 
          : getDefaultDestinationAddress() || userAddress, // Use custom address or default wallet address
        makingAmount: parseUnits(orderParams.makingAmount, 6).toString(), // USDC has 6 decimals
        takingAmount: parseUnits(orderParams.takingAmount, 6).toString(),
        makerTraits: "0"
      };
      
      // Define typed data structure for EIP-712 signing
      const domain = {
        name: '1inch Cross-Chain Order',
        version: '1.0.0',
        chainId: 1, // Ethereum mainnet
        salt: '0',
        verifyingContract: '0x0000000000000000000000000000000000000000',
      };


      //Todo replace address fields by string since they are sui addresses

      const types = {
        Order: [
          { name: 'salt', type: 'string' },
          { name: 'makerAsset', type: 'string' },
          { name: 'takerAsset', type: 'string' },
          { name: 'maker', type: 'string' },
          { name: 'receiver', type: 'string' },
          { name: 'makingAmount', type: 'string' },
          { name: 'takingAmount', type: 'string' },
          { name: 'makerTraits', type: 'string' },
        ],
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'salt', type: 'string' },
          { name: 'verifyingContract', type: 'string' },
        ],
      };

      // Sign the typed data using Dynamic wallet


      // Check if it's an Ethereum wallet
      if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
        throw new Error('This wallet is not an Ethereum wallet');
      }

      // Sign the order using EIP-712 typed data
      const walletClient = await primaryWallet.getWalletClient();
      
      // Update order params before signing
      updateOrderParams();
      
      // Convert order to Record<string, unknown> for proper typing
      const message: Record<string, unknown> = {
        salt: order.salt,
        makerAsset: order.makerAsset,
        takerAsset: order.takerAsset,
        maker: order.maker,
        receiver: order.receiver,
        makingAmount: order.makingAmount,
        takingAmount: order.takingAmount,
        makerTraits: order.makerTraits,
      };
      
      const signature = await walletClient.signTypedData({
        domain,
        types,
        primaryType: 'Order',
        message
      });
      
      if (!signature) {
        throw new Error("Failed to sign message");
      }
      
      // Create order hash (simple hash of the order for tracking)
      const orderHash = keccak256(toHex(JSON.stringify(order)));
      
      // Create the order submission object
      const orderSubmission: OrderSubmission = {
        order,
        srcChainId: 1, // Ethereum mainnet
        signature,
        extension: "0x",
        quoteId: `quote_${Date.now()}`,
        secretHashes: [secretHash]
      };
      
      // Store the order data
      const newOrderData: CrossChainOrderData = {
        orderSubmission,
        secret,
        orderHash
      };
      
      setOrderData(newOrderData);
      
      console.log('Order created and signed:', {
        orderHash,
        signature: orderSubmission.signature,
        secret,
        secretHash
      });
      
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const submitOrderToAPI = async () => {
    if (!orderData) {
      setError("No order data to submit");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Submit to the mock backend API
      const response = await fetch('/api/1inch/relayer/v1.0/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData.orderSubmission)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Order submitted successfully:', result);
      
      // Show success message
      setError(null);
      
    } catch (err) {
      console.error('Error submitting order:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit order to API');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Cross-Chain Swap</CardTitle>
        <CardDescription>
          Swap tokens between Ethereum and Sui networks
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        {/* Chain Direction Switch */}
        <div className="flex items-center justify-between">
          <Label htmlFor="chain-switch" className="text-sm font-medium">
            {isEthToSui ? 'Ethereum → Sui' : 'Sui → Ethereum'}
          </Label>
          <div className="flex items-center space-x-2">
            <span className="text-sm">ETH</span>
            <Switch
              id="chain-switch"
              checked={!isEthToSui}
              onCheckedChange={() => handleChainSwitch()}
            />
            <ArrowUpDown className="h-4 w-4" />
            <span className="text-sm">SUI</span>
          </div>
        </div>

        {/* Source Coin Selection */}
        <div className="space-y-2">
          <Label htmlFor="source-coin">Source Token</Label>
          <Select value={sourceCoin} onValueChange={setSourceCoin}>
            <SelectTrigger>
              <SelectValue placeholder="Select source token" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sourceCoins).map(([name, coin]) => (
                <SelectItem key={name} value={name}>
                  {coin.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Destination Coin Selection */}
        <div className="space-y-2">
          <Label htmlFor="destination-coin">Destination Token</Label>
          <Select value={destinationCoin} onValueChange={setDestinationCoin}>
            <SelectTrigger>
              <SelectValue placeholder="Select destination token" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(destinationCoins).map(([name, coin]) => (
                <SelectItem key={name} value={name}>
                  {coin.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Inputs */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="making-amount">Making Amount</Label>
            <Input
              id="making-amount"
              type="number"
              value={orderParams.makingAmount}
              onChange={(e) => setOrderParams(prev => ({ ...prev, makingAmount: e.target.value }))}
              placeholder="100"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="taking-amount">Taking Amount</Label>
            <Input
              id="taking-amount"
              type="number"
              value={orderParams.takingAmount}
              onChange={(e) => setOrderParams(prev => ({ ...prev, takingAmount: e.target.value }))}
              placeholder="99"
            />
          </div>
        </div>

        {/* Custom Destination Address */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="custom-destination"
              checked={useCustomDestination}
              onCheckedChange={setUseCustomDestination}
            />
            <Label htmlFor="custom-destination">Use custom destination address</Label>
          </div>
          
          {useCustomDestination && (
            <div className="space-y-2">
              <Label htmlFor="destination-address">Destination Address</Label>
              <Input
                id="destination-address"
                type="text"
                value={customDestinationAddress}
                onChange={(e) => setCustomDestinationAddress(e.target.value)}
                placeholder={`Enter ${isEthToSui ? 'Sui' : 'Ethereum'} address`}
              />
            </div>
          )}
        </div>

        {/* Token Addresses Display */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Maker Asset (Source Token Address)</Label>
            <Input
              type="text"
              value={orderParams.makerAsset}
              onChange={(e) => setOrderParams(prev => ({ ...prev, makerAsset: e.target.value }))}
              className="font-mono text-sm"
              placeholder="0x..."
            />
          </div>
          
          <div className="space-y-2">
            <Label>Taker Asset (Destination Token Address)</Label>
            <Input
              type="text"
              value={orderParams.takerAsset}
              onChange={(e) => setOrderParams(prev => ({ ...prev, takerAsset: e.target.value }))}
              className="font-mono text-sm"
              placeholder="0x..."
            />
          </div>
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={createAndSignOrder}
            disabled={!primaryWallet || isCreatingOrder}
            className="w-full"
          >
            {isCreatingOrder ? 'Creating Order...' : 'Create & Sign Order'}
          </Button>
        
          {orderData && (
            <Button
              onClick={submitOrderToAPI}
              disabled={isSubmitting}
              variant="secondary"
              className="w-full"
            >
              {isSubmitting ? 'Submitting to API...' : 'Submit Order to 1inch API'}
            </Button>
          )}
        </div>
        
        {!primaryWallet && (
          <p className="text-sm text-muted-foreground text-center">
            Please connect your wallet to create an order
          </p>
        )}
        
        {orderData && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Order Created Successfully!</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Order Hash:</span>
                <p className="font-mono text-xs break-all text-green-700">{orderData.orderHash}</p>
              </div>
              <div>
                <span className="font-medium">Signature:</span>
                <p className="font-mono text-xs break-all text-green-700">{orderData.orderSubmission.signature}</p>
              </div>
              <div>
                <span className="font-medium">Secret:</span>
                <p className="font-mono text-xs break-all text-green-700">{orderData.secret}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}