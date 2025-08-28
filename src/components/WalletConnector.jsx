import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { mainnet, base, sepolia } from 'wagmi/chains'
import { useEffect, useState, useCallback } from 'react'

export const WalletConnector = () => {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [currentChainId, setCurrentChainId] = useState(null)

  // 预定义常见链配置
  const commonChains = [
    { id: mainnet.id, name: '以太坊主网' },
    { id: base.id, name: 'Base' },
    { id: sepolia.id, name: 'Sepolia测试网' },
    {
      id: 9999,
      name: '我自定义的一个链',
      nativeCurrency: { name: 'xiaoli', symbol: 'liduoduo', decimals: 18 }
    },
  ]

  // 使用useCallback缓存函数
  const getChainName = useCallback((chainId) => {
    const chain = commonChains.find(c => c.id === chainId)
    return chain ? chain.name : `未知网络 (ID: ${chainId})`
  }, [commonChains])

  // 更新网络状态的函数
  const updateNetworkState = useCallback((chainId) => {
    const name = getChainName(chainId)
    console.log('更新网络状态:', chainId, name)
    setCurrentChainId(chainId)
  }, [getChainName])

  // 初始化获取当前链ID
  useEffect(() => {
    const getInitialChainId = async () => {
      if (window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' })
          const chainIdNumber = parseInt(chainId, 16)
          updateNetworkState(chainIdNumber)
        } catch (error) {
          console.error('获取链ID失败:', error)
        }
      }
    }

    getInitialChainId()
  }, [updateNetworkState])

  // 监听MetaMask网络变化
  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = (chainIdHex) => {
        const chainId = parseInt(chainIdHex, 16)
        console.log('网络已切换至:', chainId)
        updateNetworkState(chainId)
      }

      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [updateNetworkState])

  // 切换网络函数 - 修复版本
  const switchNetwork = async (chainId) => {
    try {
      if (window.ethereum && window.ethereum.request) {
        console.log('开始切换网络到:', chainId)

        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        })

        // 使用函数式更新确保状态正确设置
        setCurrentChainId(prev => {
          console.log('设置chainId:', chainId)
          return chainId
        })



        console.log('网络切换完成，状态已更新')
      }
    } catch (error) {
      console.error('切换网络失败:', error)
    }
  }


  if (isConnected) {
    return (
      <div className="wallet-connector">
        <span className="wallet-address">{address}</span>

        {/* 显示当前网络 */}
        {/* <div className="current-network">
          当前网络: {currentChainName || '获取中...'}
        </div>  */}

        {/* 网络切换下拉菜单 */}
        <div className="network-switcher">
          <label htmlFor="network-select">切换网络: </label>
          <select
            id="network-select"
            value={currentChainId || ''}
            onChange={(e) => switchNetwork(Number(e.target.value))}
            className="network-select"
          >
            <option value="">选择网络</option>
            {commonChains.map((network) => (
              <option key={network.id} value={network.id}>
                {network.name}
              </option>
            ))}
          </select>
        </div>

        <button onClick={() => disconnect()} className="disconnect-btn">
          断开连接
        </button>
      </div>
    )
  }

  return (
    <div className="wallet-connector">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          className="connect-btn"
        >
          连接{connector.name}
        </button>
      ))}
    </div>
  )
}