import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import './Wallet.scss';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

const Wallet = () => {
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    availableBalance: 0,
    pendingBalance: 0
  });
  const [bankAccount, setBankAccount] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadWallet();
    loadWithdrawals();
  }, []);

  const loadWallet = async () => {
    try {
      const token = Cookies.get('accessToken');
      const response = await axios.get(`${API_BASE_URL}/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEarnings(response.data.earnings || earnings);
      setBankAccount(response.data.bankAccount);
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const loadWithdrawals = async () => {
    try {
      const token = Cookies.get('accessToken');
      const response = await axios.get(`${API_BASE_URL}/wallet/withdrawals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setWithdrawals(response.data.withdrawals || []);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    }
  };

  const handleUpdateBankAccount = () => {
    navigate('/tutor/settings');
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount < 50000) {
      alert('Số tiền tối thiểu: 50,000 VNĐ');
      return;
    }

    if (parseInt(withdrawAmount) > earnings.availableBalance) {
      alert(`Không đủ số dư. Số dư hiện tại: ${earnings.availableBalance.toLocaleString('vi-VN')} VNĐ`);
      return;
    }

    if (!bankAccount) {
      alert('Vui lòng cập nhật thông tin tài khoản ngân hàng trước');
      return;
    }

    setLoading(true);
    try {
      const token = Cookies.get('accessToken');
      await axios.post(
        `${API_BASE_URL}/wallet/withdraw`,
        { amount: parseInt(withdrawAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Yêu cầu rút tiền đã được gửi! Admin sẽ xử lý trong 1-2 ngày làm việc.');
      setWithdrawAmount('');
      setShowWithdrawForm(false);
      loadWallet();
      loadWithdrawals();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
      console.error('Withdraw error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      processing: 'badge-info',
      completed: 'badge-success',
      failed: 'badge-danger',
      cancelled: 'badge-secondary'
    };
    
    const labels = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      completed: 'Hoàn thành',
      failed: 'Thất bại',
      cancelled: 'Đã hủy'
    };

    return (
      <span className={`badge ${badges[status] || 'badge-secondary'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="wallet-page">
      <div className="wallet-header">
        <h1>💰 Ví của tôi</h1>
      </div>

      {/* Balance Cards */}
      <div className="balance-cards">
        <div className="balance-card primary">
          <div className="label">Số dư khả dụng</div>
          <div className="amount">{earnings.availableBalance.toLocaleString('vi-VN')} VNĐ</div>
          <button 
            className="btn-withdraw"
            onClick={() => setShowWithdrawForm(!showWithdrawForm)}
          >
            Rút tiền ngay
          </button>
        </div>

        <div className="balance-card secondary">
          <div className="label">⏳ Đang chờ</div>
          <div className="amount">{earnings.pendingBalance.toLocaleString('vi-VN')} VNĐ</div>
          <small>Tiền đang giữ trong escrow</small>
        </div>

        <div className="balance-card info">
          <div className="label">Tổng thu nhập</div>
          <div className="amount">{earnings.totalEarnings.toLocaleString('vi-VN')} VNĐ</div>
          <small>Toàn bộ tiền đã nhận</small>
        </div>
      </div>

      {/* Bank Account Info */}
      <div className="bank-account-section">
        {!bankAccount ? (
          <div className="no-bank-alert">
            <p>⚠️ Bạn chưa cập nhật thông tin tài khoản ngân hàng</p>
            <button className="btn-update" onClick={handleUpdateBankAccount}>
              Cập nhật ngay
            </button>
          </div>
        ) : (
          <div className="bank-info">
            <h3>Thông tin tài khoản nhận tiền</h3>
            <div className="bank-details">
              <div className="detail-item">
                <span className="label">Ngân hàng:</span>
                <span className="value">{bankAccount.bankName || 'Chưa cập nhật'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Số tài khoản:</span>
                <span className="value">{bankAccount.accountNumber ? `****${bankAccount.accountNumber.slice(-4)}` : 'Chưa cập nhật'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Chủ tài khoản:</span>
                <span className="value">{bankAccount.accountName || 'Chưa cập nhật'}</span>
              </div>
            </div>
            <button className="btn-update" onClick={handleUpdateBankAccount}>
              Cập nhật
            </button>
          </div>
        )}
      </div>

      {/* Withdraw Form */}
      {showWithdrawForm && (
        <div className="withdraw-form-section">
          <h3>Rút tiền</h3>
          <div className="form-group">
            <label>Số tiền muốn rút (VNĐ)</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Tối thiểu 50,000 VNĐ"
              min="50000"
            />
            <small>Số dư hiện tại: {earnings.availableBalance.toLocaleString('vi-VN')} VNĐ</small>
          </div>
          <div className="form-actions">
            <button 
              className="btn-confirm" 
              onClick={handleWithdraw}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận rút tiền'}
            </button>
            <button 
              className="btn-cancel" 
              onClick={() => setShowWithdrawForm(false)}
              disabled={loading}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Withdrawal History */}
      <div className="withdrawal-history">
        <h2>Lịch sử rút tiền</h2>
        {withdrawals.length === 0 ? (
          <p className="empty-state">Chưa có yêu cầu rút tiền nào</p>
        ) : (
          <table className="withdrawals-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map(w => (
                <tr key={w._id}>
                  <td>{new Date(w.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>{w.amount.toLocaleString('vi-VN')} VNĐ</td>
                  <td>{getStatusBadge(w.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Wallet;

