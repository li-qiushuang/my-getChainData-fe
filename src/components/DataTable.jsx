import React, { useState, useEffect } from 'react';
import { useAccount, useSendTransaction } from 'wagmi';
import './../../App.css'


export const DataTable = () => {
  const { address, isConnected } = useAccount();
  const [account, setAccount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);


  // 获取交易信息
  const fetchTransactions = async (address) => {
    if (!address) return;

    setLoading(true);

    try {
      // 使用Etherscan API获取Sepolia测试网交易
      const apiKey = import.meta.env.VITE_ETHERSCAN_API_KEY

      console.log('address', address)
      const response = await fetch(
        `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`
      );

      if (!response.ok) {
        throw new Error('获取交易数据失败');
      }

      const data = await response.json();

      if (data.status === '1') {
        console.log(data.result)
        setTransactions(data.result);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      setError(err.message);
      // 如果API调用失败，使用模拟数据 
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // 当账户改变时获取交易
  useEffect(() => {
    if (address) {
      fetchTransactions(address);
    }
  }, [address]);

  // 格式化Wei为ETH
  const formatEther = (wei) => {
    const eth = parseInt(wei) / Math.pow(10, 18);
    return eth.toFixed(6);
  };

  // 格式化时间戳
  const formatTimestamp = (timestamp) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString('zh-CN');
  };

  // 格式化地址（显示前6位和后4位）
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 格式化交易哈希
  const formatHash = (hash) => {
    if (!hash) return '';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <div>
      <div>
        <div>
          <h1 className="mb-4 p-2 bg-gray-100 rounded">
            该账户下的交易记录
          </h1>

          <div>
            <span >当前账户:</span>
            <span>
              {address}
            </span>
            <button
              onClick={() => fetchTransactions(address)}
              disabled={loading}
            >
              {loading ? '获取中...' : '刷新'}
            </button>
          </div>
        </div>

        {loading ? (
          <div >
            <span>加载中...</span>
          </div>
        ) : (
          <div>
            <table className="table-auto">
              <thead>
                <tr>
                  <th> 交易哈希 </th>
                  <th>  区块号 </th>
                  <th> 时间 </th>
                  <th>  发送方 </th>
                  <th> 接收方 </th>
                  <th> 金额 (ETH) </th>
                  <th>  Gas费用 </th>
                  <th> 类型 </th>
                </tr>
              </thead>
              <tbody >
                {transactions.length === 0 ? (
                  <tr>
                    <td>
                      {account ? '暂无交易记录' : '请先连接钱包'}
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx, index) => (
                    <tr key={tx.hash || index}>
                      <td>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                          target="_blank"
                        > {formatHash(tx.hash)} </a>
                      </td>
                      <td> {tx.blockNumber} </td>
                      <td> {formatTimestamp(tx.timeStamp)} </td>
                      <td> <span> {formatAddress(tx.from)} </span> </td>
                      <td> <span> {formatAddress(tx.to)} </span> </td>
                      <td> {formatEther(tx.value)} </td>
                      <td> {((parseInt(tx.gas) * parseInt(tx.gasPrice)) / Math.pow(10, 18)).toFixed(6)} </td>
                      <td> <span> {tx.from.toLowerCase() === account.toLowerCase() ? '发送' : '接收'} </span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {transactions.length > 0 && (
        <div>
          <p>
            显示最近 {transactions.length} 条交易记录
          </p>
        </div>
      )}
    </div>
  );
};

