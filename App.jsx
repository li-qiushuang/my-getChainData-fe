import { useState } from 'react'
import { WagmiProvider, createConfig, http, injected } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WalletConnector } from './src/components/WalletConnector'
import { SendMoney } from './src/components/SendMoney'
import { ConstractData } from './src/components/ConstractData'
import { UseUSDT } from './src/components/UseUSDT'


import './App.css'

// 创建查询客户端
const queryClient = new QueryClient()

// 配置wagmi - 使用Sepolia测试网
const config = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  // connectors: [],
  transports: {
    [sepolia.id]: http(),
  },
})

function App() {
  const [activeTab, setActiveTab] = useState('redirect')

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="app">
          <header className="app-header">
            <h1>获取链上数据系统</h1>
            <WalletConnector />
          </header>

          <main className="app-main">
            <div className="tab-navigation">
              <button onClick={() => setActiveTab('redirect')}>直接转账</button>
              <button onClick={() => setActiveTab('contract')}>智能合约</button>
              {/* <button onClick={() => setActiveTab('usdt')}>使用USDT</button> */}
            </div>

            <div className="tab-content">
              {activeTab === 'redirect' && <SendMoney />}
              {activeTab === 'contract' && <ConstractData />}
              {/* {activeTab === 'usdt' && <UseUSDT />} */}
            </div>

          </main>

        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )

}

export default App