import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Truck } from 'lucide-react';
import { supplierAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import Modal from '../Common/Modal';
import SupplierForm from './SupplierForm';

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await supplierAPI.getSuppliers();
      setSuppliers(response.data.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setShowModal(true);
  };

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setShowModal(true);
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus supplier ini?')) {
      setDeleting(id);
      try {
        await supplierAPI.deleteSupplier(id);
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('Gagal menghapus supplier');
      } finally {
        setDeleting(null);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSupplier(null);
  };

  const handleSaveSupplier = () => {
    fetchSuppliers();
    handleCloseModal();
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Data Supplier</h1>
            <p className="text-gray-600">Kelola data supplier dan pemasok</p>
          </div>
          <button
            onClick={handleAddSupplier}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Supplier</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Supplier List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nama Supplier</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Contact Person</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Telepon</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Alamat</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">{supplier.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{supplier.contact_person || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{supplier.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{supplier.email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{supplier.address || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleEditSupplier(supplier)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        disabled={deleting === supplier.id}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Hapus"
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

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada supplier ditemukan</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={selectedSupplier ? 'Edit Supplier' : 'Tambah Supplier'}
        size="large"
      >
        <SupplierForm
          supplier={selectedSupplier}
          onSave={handleSaveSupplier}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default SupplierList;