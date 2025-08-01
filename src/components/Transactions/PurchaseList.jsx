import React, { useState, useEffect } from 'react';
import { Plus, Eye, Search, ShoppingCart, Calendar } from 'lucide-react';
import { purchaseAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import Modal from '../Common/Modal';
import PurchaseForm from './PurchaseForm';
import PurchaseDetail from './PurchaseDetail';

const PurchaseList = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await purchaseAPI.getPurchases();
      setPurchases(response.data.data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPurchase = () => {
    setShowModal(true);
  };

  const handleViewDetail = async (purchase) => {
    try {
      const response = await purchaseAPI.getPurchase(purchase.id);
      setSelectedPurchase(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching purchase detail:', error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedPurchase(null);
  };

  const handleSavePurchase = () => {
    fetchPurchases();
    handleCloseModal();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const filteredPurchases = purchases.filter(purchase =>
    purchase.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Data Pembelian</h1>
            <p className="text-gray-600">Kelola transaksi pembelian barang (FIFO)</p>
          </div>
          <button
            onClick={handleAddPurchase}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Pembelian</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari berdasarkan supplier atau user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Purchase List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tanggal</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Supplier</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">#{purchase.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(purchase.purchase_date).toLocaleDateString('id-ID')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{purchase.supplier_name || 'Tanpa Supplier'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{purchase.user_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                    {formatCurrency(purchase.total_amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleViewDetail(purchase)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPurchases.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada data pembelian ditemukan</p>
          </div>
        )}
      </div>

      {/* Add Purchase Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Tambah Pembelian"
        size="xl"
      >
        <PurchaseForm
          onSave={handleSavePurchase}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* Purchase Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        title="Detail Pembelian"
        size="xl"
      >
        {selectedPurchase && (
          <PurchaseDetail
            purchase={selectedPurchase}
            onClose={handleCloseDetailModal}
          />
        )}
      </Modal>
    </div>
  );
};

export default PurchaseList;