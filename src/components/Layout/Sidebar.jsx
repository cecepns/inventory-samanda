import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Package, 
  Tag, 
  Truck, 
  UserCheck, 
  ShoppingCart, 
  TrendingUp, 
  FileText,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { 
      to: '/dashboard', 
      icon: Home, 
      label: 'Dashboard', 
      roles: ['admin', 'staff'] 
    },
    { 
      to: '/employees', 
      icon: Users, 
      label: 'Data Karyawan', 
      roles: ['admin'] 
    },
    { 
      to: '/categories', 
      icon: Tag, 
      label: 'Data Kategori', 
      roles: ['staff'] 
    },
    { 
      to: '/products', 
      icon: Package, 
      label: 'Data Produk', 
      roles: ['staff'] 
    },
    { 
      to: '/suppliers', 
      icon: Truck, 
      label: 'Data Supplier', 
      roles: ['staff'] 
    },
    { 
      to: '/customers', 
      icon: UserCheck, 
      label: 'Data Pelanggan', 
      roles: ['staff'] 
    },
    { 
      to: '/purchases', 
      icon: ShoppingCart, 
      label: 'Pembelian', 
      roles: ['staff'] 
    },
    { 
      to: '/sales', 
      icon: TrendingUp, 
      label: 'Penjualan', 
      roles: ['staff'] 
    },
    { 
      to: '/reports', 
      icon: FileText, 
      label: 'Laporan', 
      roles: ['staff'] 
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-gradient-to-b from-blue-600 to-purple-700 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:h-auto
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-500">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Toko Samanda</h1>
              <p className="text-blue-200 text-sm">Inventory System</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-white hover:bg-blue-500 p-2 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User info */}
        <div className="p-6 border-b border-blue-500">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{user?.name}</p>
              <p className="text-blue-200 text-sm capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => `
                      flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200
                      ${isActive 
                        ? 'bg-white text-blue-600 shadow-lg' 
                        : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-blue-500">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-blue-100 hover:bg-blue-500 hover:text-white rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;