import React, { useState, useEffect } from 'react';
import { Plus, Eye, Search, TrendingUp, Calendar, Trash2 } from 'lucide-react';
import { saleAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import Modal from '../Common/Modal';
import SaleForm from './SaleForm';
import SaleDetail from './SaleDetail';

const SaleList = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await saleAPI.getSales();
      setSales(response.data.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSale = () => {
    setShowModal(true);
  };

  const handleViewDetail = async (sale) => {
    try {
      const response = await saleAPI.getSale(sale.id);
      setSelectedSale(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching sale detail:', error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedSale(null);
  };

  const handleSaveSale = () => {
    fetchSales();
    handleCloseModal();
  };

  const handleDeleteSale = (sale) => {
    setSaleToDelete(sale);
    setShowDeleteModal(true);
  };

  const confirmDeleteSale = async () => {
    if (!saleToDelete) return;
    
    setDeleting(true);
    try {
      await saleAPI.deleteSale(saleToDelete.id);
      await fetchSales();
      setShowDeleteModal(false);
      setSaleToDelete(null);
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Gagal menghapus penjualan. Silakan coba lagi.');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteSale = () => {
    setShowDeleteModal(false);
    setSaleToDelete(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const filteredSales = sales.filter(sale =>
    sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Data Penjualan</h1>
            <p className="text-gray-600">Kelola transaksi penjualan barang (FIFO)</p>
          </div>
          <button
            onClick={handleAddSale}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Penjualan</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari berdasarkan pelanggan atau user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Sale List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tanggal</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Pelanggan</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">#{sale.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(sale.sale_date).toLocaleDateString('id-ID')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{sale.customer_name || 'Tanpa Pelanggan'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{sale.user_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                    {formatCurrency(sale.total_amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleViewDetail(sale)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSale(sale)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Hapus Penjualan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSales.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada data penjualan ditemukan</p>
          </div>
        )}
      </div>

      {/* Add Sale Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Tambah Penjualan"
        size="xl"
      >
        <SaleForm
          onSave={handleSaveSale}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* Sale Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        title="Detail Penjualan"
        size="xl"
      >
        {selectedSale && (
          <SaleDetail
            sale={selectedSale}
            onClose={handleCloseDetailModal}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={cancelDeleteSale}
        title="Konfirmasi Hapus"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Apakah Anda yakin ingin menghapus penjualan ini?
          </p>
          {saleToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>ID:</strong> #{saleToDelete.id}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Pelanggan:</strong> {saleToDelete.customer_name || 'Tanpa Pelanggan'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Total:</strong> {formatCurrency(saleToDelete.total_amount)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Tanggal:</strong> {new Date(saleToDelete.sale_date).toLocaleDateString('id-ID')}
              </p>
            </div>
          )}
          <p className="text-sm text-red-600 font-medium">
            ⚠️ Tindakan ini akan menghapus penjualan dan mengembalikan stok ke kondisi sebelumnya.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={cancelDeleteSale}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={deleting}
            >
              Batal
            </button>
            <button
              onClick={confirmDeleteSale}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              disabled={deleting}
            >
              {deleting ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SaleList;