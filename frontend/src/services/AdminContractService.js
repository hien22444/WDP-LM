import client from './ApiService';
import { toast } from 'react-toastify';

const AdminContractService = {
  // Get all contracts with filters
  getAllContracts: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.status) queryParams.append('status', params.status);
      if (params.contractSigned !== undefined) queryParams.append('contractSigned', params.contractSigned);
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const res = await client.get(`/admin/contracts?${queryParams.toString()}`);
      return res.data;
    } catch (error) {
      console.error('❌ Error fetching contracts:', error);
      const message = error.response?.data?.message || 'Không thể tải danh sách hợp đồng';
      toast.error(message);
      throw error;
    }
  },

  // Get contract by ID
  getContractById: async (id) => {
    try {
      const res = await client.get(`/admin/contracts/${id}`);
      return res.data.contract;
    } catch (error) {
      console.error('❌ Error fetching contract:', error);
      const message = error.response?.data?.message || 'Không thể tải thông tin hợp đồng';
      toast.error(message);
      throw error;
    }
  },

  // Get contract statistics
  getContractStats: async () => {
    try {
      const res = await client.get('/admin/contracts/stats/overview');
      return res.data.stats;
    } catch (error) {
      console.error('❌ Error fetching contract stats:', error);
      const message = error.response?.data?.message || 'Không thể tải thống kê hợp đồng';
      toast.error(message);
      throw error;
    }
  },

  // Update contract status
  updateContractStatus: async (id, status, adminNote = '') => {
    try {
      const res = await client.patch(`/admin/contracts/${id}/status`, {
        status,
        adminNote
      });
      toast.success('✅ Cập nhật trạng thái hợp đồng thành công');
      return res.data.contract;
    } catch (error) {
      console.error('❌ Error updating contract status:', error);
      const message = error.response?.data?.message || 'Không thể cập nhật trạng thái hợp đồng';
      toast.error(message);
      throw error;
    }
  },

  // Delete contract
  deleteContract: async (id, reason = '') => {
    try {
      const res = await client.delete(`/admin/contracts/${id}`, {
        data: { reason }
      });
      toast.success('✅ Xóa hợp đồng thành công');
      return res.data.contract;
    } catch (error) {
      console.error('❌ Error deleting contract:', error);
      const message = error.response?.data?.message || 'Không thể xóa hợp đồng';
      toast.error(message);
      throw error;
    }
  },

  // Get contracts by user ID
  getContractsByUserId: async (userId) => {
    try {
      console.log('📡 Fetching contracts for user:', userId);
      const res = await client.get(`/admin/contracts/user/${userId}`);
      console.log('✅ Contracts fetched:', res.data);
      return res.data;
    } catch (error) {
      console.error('❌ Error fetching user contracts:', error);
      console.error('❌ Error details:', error.response?.data);
      
      // Don't show toast for 400 errors (like invalid user ID), just return empty
      if (error.response?.status === 400) {
        return { contracts: [], total: 0 };
      }
      
      const message = error.response?.data?.message || 'Không thể tải hợp đồng của user';
      toast.error(message);
      
      // Return empty instead of throwing to avoid breaking the UI
      return { contracts: [], total: 0 };
    }
  },

  // Export contracts to CSV
  exportToCSV: async () => {
    try {
      const res = await client.get('/admin/contracts/export/csv', {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contracts-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('✅ Xuất file CSV thành công');
    } catch (error) {
      console.error('❌ Error exporting contracts:', error);
      const message = error.response?.data?.message || 'Không thể xuất file CSV';
      toast.error(message);
      throw error;
    }
  }
};

export default AdminContractService;

