import React, { useState, useEffect } from 'react';
import { Server, Database, Wifi, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import AdminService from '../../services/AdminService';

const AdminSystem = () => {
  const [systemHealth, setSystemHealth] = useState({});
  const [systemLogs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const [healthResponse, logsResponse] = await Promise.all([
        AdminService.getSystemHealth(),
        AdminService.getSystemLogs()
      ]);
      setSystemHealth(healthResponse.data || {});
      setSystemLogs(logsResponse.data || []);
    } catch (error) {
      console.error('Error fetching system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
      case 'offline':
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'offline':
      case 'disconnected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hệ thống</h1>
          <p className="mt-1 text-sm text-gray-500">Giám sát tình trạng hệ thống và logs</p>
        </div>
        <button
          onClick={fetchSystemData}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </button>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Server className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">API Server</p>
              <div className="flex items-center mt-1">
                {getStatusIcon(systemHealth.apiStatus)}
                <span className={`ml-2 text-sm font-medium ${getStatusColor(systemHealth.apiStatus)}`}>
                  {systemHealth.apiStatus || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Database className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Database</p>
              <div className="flex items-center mt-1">
                {getStatusIcon(systemHealth.databaseStatus)}
                <span className={`ml-2 text-sm font-medium ${getStatusColor(systemHealth.databaseStatus)}`}>
                  {systemHealth.databaseStatus || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Wifi className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">WebRTC</p>
              <div className="flex items-center mt-1">
                {getStatusIcon(systemHealth.webrtcStatus)}
                <span className={`ml-2 text-sm font-medium ${getStatusColor(systemHealth.webrtcStatus)}`}>
                  {systemHealth.webrtcStatus || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tổng quan</p>
              <div className="flex items-center mt-1">
                {getStatusIcon(systemHealth.overallStatus)}
                <span className={`ml-2 text-sm font-medium ${getStatusColor(systemHealth.overallStatus)}`}>
                  {systemHealth.overallStatus || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Thông tin hệ thống</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phiên bản</dt>
                  <dd className="text-sm text-gray-900">{systemHealth.version || '1.0.0'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Uptime</dt>
                  <dd className="text-sm text-gray-900">{systemHealth.uptime || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Memory Usage</dt>
                  <dd className="text-sm text-gray-900">{systemHealth.memoryUsage || 'N/A'}</dd>
                </div>
              </dl>
            </div>
            <div>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">CPU Usage</dt>
                  <dd className="text-sm text-gray-900">{systemHealth.cpuUsage || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Disk Usage</dt>
                  <dd className="text-sm text-gray-900">{systemHealth.diskUsage || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900">{formatTimestamp(systemHealth.lastUpdated || Date.now())}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Logs hệ thống</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {systemLogs.map((log, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.level === 'error' ? 'bg-red-100 text-red-800' :
                        log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        log.level === 'info' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.source || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {systemLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Không có logs nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSystem;
