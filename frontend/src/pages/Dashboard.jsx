import { useEffect, useState } from 'react';
import { FiDollarSign, FiShoppingBag, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { orderService } from '../services/orderService';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await orderService.getOrderStats();
      setStats(response.data.stats);
    } catch (error) {
      toast.error('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Today\'s Revenue',
      value: stats ? `$${stats.todayRevenue.toFixed(2)}` : '$0.00',
      icon: FiDollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Today\'s Orders',
      value: stats?.todayOrders || 0,
      icon: FiShoppingBag,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Revenue',
      value: stats ? `$${stats.totalRevenue.toFixed(2)}` : '$0.00',
      icon: FiTrendingUp,
      color: 'bg-purple-500',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: FiUsers,
      color: 'bg-orange-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/pos"
              className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg font-medium hover:bg-primary-700 transition"
            >
              New Sale
            </a>
            <a
              href="/products"
              className="block w-full bg-gray-200 text-gray-700 text-center py-3 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Manage Products
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <p className="text-gray-600 text-center py-8">No recent activity</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

