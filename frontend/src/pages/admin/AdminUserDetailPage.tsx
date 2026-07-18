import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import httpClient from '../../services/httpClient';

const AdminUserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (userId) fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await httpClient.get(`/admin/users/${userId}`);
      setUser(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateRole = async (newRole: string) => {
    try {
      await httpClient.patch(`/admin/users/${userId}`, { role: newRole });
      fetchUser();
    } catch (error) {
      console.error(error);
      alert('Failed to update role');
    }
  };

  if (!user) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-indigo-600 mb-4">&larr; Back</button>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">User Profile</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and system roles.</p>
          </div>
          <div>
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {user.status}
            </span>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.fullName}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.phone || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Joined</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500 mb-2">System Role</dt>
              <dd className="mt-1 text-sm text-gray-900 flex gap-4">
                <button 
                  onClick={() => handleUpdateRole('student')}
                  className={`px-4 py-2 border rounded text-sm font-medium ${user.role === 'student' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Student
                </button>
                <button 
                  onClick={() => handleUpdateRole('admin')}
                  className={`px-4 py-2 border rounded text-sm font-medium ${user.role === 'admin' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Admin
                </button>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetailPage;
