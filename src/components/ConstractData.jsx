import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi'
import {
  sepolia
} from 'wagmi/chains'


// 合约地址 
const CONTRACT_ADDRESS = "0x126809FCe8dE3B771ACf22dECAC79edFec82EB42"
// 合约ABI
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "DataRetrieved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "oldValue",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "newValue",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "DataStored",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "get",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractInfo",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "retrieve",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_data",
        "type": "uint256"
      }
    ],
    "name": "store",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

//theGraph 子图地址
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/119072/my-get-chain-data-thegraph/v0.0.1'

// 合约请求
const GET_ALL_TRANSACTIONS = `
  query GetAllTransactions($first: Int = 50) {
    dataStoreds(first: $first, orderBy: timestamp, orderDirection: desc) {
      id
      user
      oldValue
      newValue
      timestamp
      blockNumber
      blockTimestamp
      transactionHash
    }
    dataRetrieveds(first: $first, orderBy: timestamp, orderDirection: desc) {
      id
      user
      value
      timestamp
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;
const GET_USER_TRANSACTIONS = `
  query GetUserTransactions($user: String!, $first: Int = 50) {
    dataStoreds(
      where: { user: $user }
      first: $first
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      user
      oldValue
      newValue
      timestamp
      blockNumber
      blockTimestamp
      transactionHash
    }
    dataRetrieveds(
      where: { user: $user }
      first: $first
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      user
      value
      timestamp
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;


export const ConstractData = () => {
  const { address, isConnected } = useAccount()
  const [contract, setContract] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [storedValue, setStoredValue] = useState('0')
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [contractInfo, setContractInfo] = useState({ owner: '', value: '', timestamp: '' })

  // 获取合约实例
  const getContract = async () => {
    if (!isConnected) {
      throw new Error("请先连接钱包")
    }

    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
    setContract(contractInstance)

    // 获取当前存储的值
    await getCurrentValue(contractInstance);
    // 获取当前账户智能合约信息
    await getContractInfo(contractInstance);

  }

  useEffect(() => {
    if (address) {
      getContract()
    }
    fetchTransactions(address)
  }, [address])


  // 获取当前网络链ID
  const getCurrentChainId = async () => {
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        const chainIdNumber = parseInt(chainId, 16)
        return chainIdNumber
      } catch (error) {
        console.error('获取链ID失败:', error)
        return null
      }
    }
    return null
  }


  const fetchTransactions = async (userAddress = null) => {
    try {

      const currentChainId = await getCurrentChainId() // 获取当前网络id 
      // 当前只在sepolia网络上有合约，其他网络暂不支持
      if (currentChainId !== sepolia.id) {
        setTransactions([])
        return
      }

      const query = userAddress ? GET_USER_TRANSACTIONS : GET_ALL_TRANSACTIONS;
      const variables = userAddress ? { user: userAddress.toLowerCase(), first: 50 } : { first: 50 };

      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      console.log('GraphQL response:', response);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('GraphQL data:', data);

      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      const storeEvents = (data.data.dataStoreds || []).map(event => ({
        ...event,
        type: 'store',
      }));

      const retrieveEvents = (data.data.dataRetrieveds || []).map(event => ({
        ...event,
        type: 'retrieve',
      }));

      // 合并并按时间戳排序
      const allTransactions = [...storeEvents, ...retrieveEvents]
        .sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));

      console.log('处理后的交易数据:', allTransactions);

      // 更新状态
      setTransactions(allTransactions.length > 0 ? allTransactions : []);

      return allTransactions;
    } catch (error) {
      console.error('获取交易数据失败:', error);
      setTransactions([]);
    }
  };


  // 获取当前存储值
  const getCurrentValue = async (contractInstance) => {
    try {
      if (contractInstance) {
        const value = await contractInstance.get();
        setStoredValue(value.toString());
      }
    } catch (error) {
      console.error('获取当前值失败:', error);
    }
  };

  // 获取合约信息
  const getContractInfo = async (contractInstance) => {
    try {
      if (contractInstance) {
        const [owner, value, timestamp] = await contractInstance.getContractInfo();
        setContractInfo({
          owner: owner,
          value: value.toString(),
          timestamp: new Date(Number(timestamp) * 1000).toLocaleString()
        });
      }
    } catch (error) {
      console.error('获取合约信息失败:', error);
    }
  };

  // 存储数据
  const storeData = async () => {
    if (!contract || !inputValue) {
      alert('请连接钱包并输入有效数值');
      return;
    }

    try {
      setLoading(true);
      const tx = await contract.store(ethers.parseUnits(inputValue, 0));

      // 等待交易确认
      const receipt = await tx.wait();

      alert('数据存储成功!');

      // 更新当前值
      await getCurrentValue(contract);
      await getContractInfo(contract);

      //置空输入框数据
      setInputValue('');

    } catch (error) {
      console.error('存储失败:', error);
      alert('存储失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 检索数据（触发事件）
  const retrieveData = async () => {
    if (!contract) {
      alert('请先连接钱包');
      return;
    }

    try {
      setLoading(true);
      const tx = await contract.retrieve();
      const receipt = await tx.wait();

      alert(`检索到的数据: ${storedValue}`);

      //TODO:更新数据

    } catch (error) {
      console.error('检索失败:', error);
      alert('检索失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 格式化时间戳
  const formatTimestamp = (timestamp) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString('zh-CN');
  };

  // 截短地址
  const shortenAddress = (address) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  };

  return (
    <div>
      <div>
        <h3>通过合约存储数据</h3>
        <div>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入要存储的数字"
            disabled={loading || !address}
          />
          <button
            onClick={storeData}
            disabled={loading || !address || !inputValue}
          >
            {loading ? '处理中...' : '存储数据'}
          </button>
        </div>
      </div>
      <hr />
      {/* 检索数据 */}
      <div>
        <h3>检索数据</h3>
        <div>
          <p>
            当前存储的值:{storedValue}
          </p>
          <button
            onClick={retrieveData}
            disabled={loading || !address}
          >
            {loading ? '处理中...' : '检索数据（触发事件）'}
          </button>
        </div>
      </div>

      <hr />
      {/* 合约信息区域 */}
      {address && (
        <div>
          <h3>合约信息</h3>
          <div>
            <div>
              合约拥有者:{shortenAddress(contractInfo.owner)}
            </div>
            <div>
              当前存储值:{storedValue}
            </div>
            <div>
              最后更新:{contractInfo.timestamp}
            </div>
          </div>
        </div>
      )}
      <hr />
      {/* 交易记录区域 */}
      <div>
        <h3>交易记录</h3>
        <table>
          <thead>
            <tr>
              <th>交易哈希</th>
              <th>用户</th>
              <th>类型</th>
              <th>数据</th>
              <th>时间</th>
              <th>区块高度</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>
                  {tx.transactionHash.slice(0, 10)}...{tx.transactionHash.slice(-8)}
                </td>
                <td>
                  {tx.user}
                </td>
                <td>
                  {tx.type === 'store' ? '存储' : '检索'}
                </td>
                <td>
                  {tx.value}
                </td>
                <td>
                  {formatTimestamp(tx.timestamp)}
                </td>
                <td>
                  {tx.blockNumber}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transactions.length === 0 && (
        <div>
          暂无交易记录
        </div>
      )}
    </div>
  );
}