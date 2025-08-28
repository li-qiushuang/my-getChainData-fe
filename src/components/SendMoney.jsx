import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { DataTable } from './DataTable'
import { ethers } from 'ethers';
import './EthereumTransfer.css';
import { parseTransaction } from 'viem';

export const SendMoney = () => {
  const [step, setStep] = useState(1); // 1: 表单, 2: 确认, 3: 完成
  const [formData, setFormData] = useState({
    toAddress: '',
    amount: '',
    data: ''
  });
  const [errors, setErrors] = useState({});
  const [transactionHash, setTransactionHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { address, isConnected } = useAccount();



  const validateForm = () => {
    const newErrors = {};

    // 地址验证（简单版本）
    if (!formData.toAddress) {
      newErrors.toAddress = '收款地址不能为空';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.toAddress)) {
      newErrors.toAddress = '请输入有效的以太坊地址';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setStep(2); // 转到确认步骤
    }
  };

  const handleConfirm = async () => {
    if (!isConnected) {
      alert('请先连接钱包');
      return;
    }

    setIsLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const amountInWei = formData.amount ? ethers.parseEther(formData.amount) : BigInt(0);

      const hexData = ethers.hexlify(ethers.toUtf8Bytes(formData.data));

      const tx = await signer.sendTransaction({
        to: formData.toAddress,
        value: amountInWei,
        data: hexData
      });

      console.log('转账交易的tx', tx);

      const receipt = await tx.wait();
      console.log('交易的hash', tx.hash, receipt) //TODO:确认这里一定能拿到tx.hash吗？
      //拿到hash
      setTransactionHash(tx.hash);
      setStep(3);

    } catch (error) {
      console.log(error, 'error----')
      //TODO:完善错误提示信息
      alert(`交易失败`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setStep(1);
  };

  const handleNewTransfer = () => {
    setFormData({
      toAddress: '',
      amount: '',
      data: ''
    });
    setStep(1);
  };

  return (
    <div className="ethereum-transfer">
      <div className="transfer-card">
        <h2>以太坊转账</h2>

        {step === 1 && (
          <form onSubmit={handleSubmit} className="transfer-form">
            <div className="form-group">
              <label htmlFor="toAddress">收款地址</label>
              <input
                type="text"
                id="toAddress"
                name="toAddress"
                value={formData.toAddress}
                onChange={handleInputChange}
                placeholder="0x..."
                className={errors.toAddress ? 'error' : ''}
                disabled={isLoading || !address}
              />
              {errors.toAddress && <span className="error-message">{errors.toAddress}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="amount">金额 (ETH)</label>
              <input
                type="text"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.0"
                className={errors.amount ? 'error' : ''}
                disabled={isLoading || !address}
              />
              {errors.amount && <span className="error-message">{errors.amount}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="data">
                Data <span className="optional">(可选)</span>
                <span className="tooltip">ℹ️
                  <span className="tooltip-text">用于合约交互的附加数据，必须是十六进制格式</span>
                </span>
              </label>
              <textarea
                id="data"
                name="data"
                value={formData.data}
                onChange={handleInputChange}
                placeholder="0x..."
                rows="3"
                className={errors.data ? 'error' : ''}
                disabled={isLoading || !address}
              />
              {errors.data && <span className="error-message">{errors.data}</span>}
            </div>

            <button type="submit" className="btn-next" disabled={isLoading || !address}>下一步</button>
          </form>
        )}

        {step === 2 && (
          <div className="confirmation">
            <h3>确认交易</h3>
            <div className="confirmation-details">
              <div className="detail-row">
                <span className="label">收款地址:</span>
                <span className="value">{formData.toAddress}</span>
              </div>
              <div className="detail-row">
                <span className="label">金额:</span>
                <span className="value">{formData.amount} ETH</span>
              </div>
              {formData.data && (
                <div className="detail-row">
                  <span className="label">Data:</span>
                  <span className="value data-value">{formData.data}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="label">预估矿工费:</span>
                <span className="value">0.0012 ETH</span>
              </div>
              <div className="detail-row total">
                <span className="label">总计:</span>
                <span className="value">{(parseFloat(formData.amount || 0) + 0.0012).toFixed(4)} ETH</span>
              </div>
            </div>

            <div className="button-group">
              <button onClick={handleEdit} className="btn-edit" disabled={isLoading}>编辑</button>
              <button onClick={handleConfirm} disabled={isLoading} className="btn-confirm">{isLoading ? '处理中...' : '确认交易'}</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="completion">
            <div className="success-icon">✓</div>
            <h3>交易已提交</h3>
            <p>您的交易已成功提交到网络，等待确认。</p>
            <div className="transaction-hash">
              <span>交易哈希:</span>
              <span className="hash">{transactionHash}</span>
            </div>
            <button onClick={handleNewTransfer} className="btn-new">新交易</button>
          </div>
        )}
      </div>
      {isConnected && (<div className="transfer-card">
        <DataTable />
      </div>)}

    </div>
  );
}