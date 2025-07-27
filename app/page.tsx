"use client";

import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { WalletAddresses } from "@/components/wallet-addresses";
import { CrossChainSwap } from "@/components/cross-chain-swap";


export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Cross-Chain Swaps
            </h1>
            <h2 className="text-xl text-muted-foreground sm:text-2xl">
              Powered by 1inch x Sui
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Seamlessly swap tokens between Ethereum and Sui networks with the best rates and lowest fees.
            </p>
           
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mt-16">
            <div className="flex flex-col items-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Lightning Fast</h3>
              <p className="text-muted-foreground text-center">
                Execute cross-chain swaps in seconds with optimized routing
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Secure</h3>
              <p className="text-muted-foreground text-center">
                Built with industry-leading security practices and audited smart contracts
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4 p-6 rounded-lg border bg-card">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Best Rates</h3>
              <p className="text-muted-foreground text-center">
                Get the most competitive rates through 1inch's advanced aggregation
              </p>
            </div>
          </div>
          
          {/* Wallet Addresses Section */}
          <div className="mt-16">
            <WalletAddresses />
          </div>
          
          {/* Cross-Chain Swap Section */}
          <div className="mt-16">
            <CrossChainSwap />
          </div>
        </div>
       </main>
    </div>
  );
}
