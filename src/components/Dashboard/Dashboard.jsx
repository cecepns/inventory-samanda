import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Users, 
  Tag, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle 
} from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Total Produk',
      value: stats?.products || 0,
      icon: Package,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Karyawan',
      value: stats?.users || 0,
      icon: Users,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Total Kategori',
      value: stats?.categories || 0,
      icon: Tag,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Pembelian Bulan ini',
      value: stats?.purchases?.count || 0,
      subtitle: formatCurrency(stats?.purchases?.total || 0),
      icon: ShoppingCart,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    {
      title: 'Penjualan Bulan ini',
      value: stats?.sales?.count || 0,
      subtitle: formatCurrency(stats?.sales?.total || 0),
      icon: TrendingUp,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Selamat datang di Sistem Inventory Toko Samanda</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className={`text-2xl font-bold ${card.textColor} mb-1`}>{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500">{card.subtitle}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Low Stock Alert */}
      {stats?.lowStock && stats.lowStock.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-800">Stok Menipis</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Produk</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">SKU</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Stok</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStock.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800">{item.name}</td>
                    <td className="py-3 px-4 text-gray-600">{item.sku}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.current_stock === 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.current_stock} unit
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;