import React, { useState, useEffect } from 'react';

// ============================================================================
// មុខងារទី ១៖ កំណត់សិទ្ធិបុគ្គលិកតាមរយៈ Tick Box (Role & Permission Matrix)
// Admin គ្រាន់តែ Tick លើប្រអប់ ដោយមិនបាច់កែកូដឡើយ
// ============================================================================

export default function RolePermissionManager() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [checkedPermIds, setCheckedPermIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ១. ទាញយកទិន្នន័យពី Backend
  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const fetchRolesAndPermissions = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/roles/matrix');
      const data = await res.json();
      setRoles(data.roles || []);
      setPermissions(data.permissions || []);
      
      if (data.roles?.length > 0) {
        selectRole(data.roles[0].id, data.assignedPermissions);
      }
    } catch (err) {
      console.error('Error fetching matrix:', err);
    }
  };

  const selectRole = (roleId, allAssigned) => {
    setSelectedRoleId(roleId);
    const roleAssigned = (allAssigned || [])
      .filter((ap) => ap.role_id === roleId)
      .map((ap) => ap.permission_id);
    setCheckedPermIds(new Set(roleAssigned));
    setMessage('');
  };

  // ២. ពេលចុច Tick ឬដោះ Tick លើប្រអប់
  const handleToggle = (permissionId) => {
    const updated = new Set(checkedPermIds);
    if (updated.has(permissionId)) {
      updated.delete(permissionId);
    } else {
      updated.add(permissionId);
    }
    setCheckedPermIds(updated);
  };

  // ៣. រក្សាទុកការផ្លាស់ប្តូរទៅកាន់ Database ភ្លាមៗ
  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`http://localhost:5000/api/roles/${selectedRoleId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionIds: Array.from(checkedPermIds) })
      });
      const data = await res.json();
      setMessage(data.message || 'បានរក្សាទុកសិទ្ធិជោគជ័យ!');
    } catch (err) {
      setMessage('មានបញ្ហាក្នុងការរក្សាទុក!');
    } finally {
      setLoading(false);
    }
  };

  // រៀបចំ Permissions ជាក្រុមតាម Module (POS, Sales, Products, Stock In, Reports, etc.)
  const groupedPermissions = permissions.reduce((acc, perm) => {
    acc[perm.module] = acc[perm.module] || [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  const currentRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-xl shadow-md border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">កំណត់សិទ្ធិបុគ្គលិកតាម Tick Box</h2>
          <p className="text-sm text-gray-500">ជ្រើសរើសតួនាទី (Role) រួចគ្រាន់តែ Tick លើប្រអប់មុខងារដែលចង់អនុញ្ញាត</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-4 md:mt-0 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition disabled:bg-gray-400"
        >
          {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកសិទ្ធិ (Save Changes)'}
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {message}
        </div>
      )}

      {/* បញ្ជីផ្ទាំងជ្រើសរើស Role */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => selectRole(role.id)}
            className={`px-5 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
              selectedRoleId === role.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {role.name_kh} ({role.name})
          </button>
        ))}
      </div>

      {/* តារាង Tick Box បែងចែកតាម Module */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
          <div key={moduleName} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
              <span className="font-bold text-gray-800 text-base">{moduleName}</span>
              <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                {perms.filter((p) => checkedPermIds.has(p.id)).length} / {perms.length}
              </span>
            </div>

            <div className="space-y-3">
              {perms.map((p) => {
                const isChecked = checkedPermIds.has(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-start gap-3 p-2.5 rounded-md cursor-pointer transition ${
                      isChecked ? 'bg-blue-50/70 border border-blue-200' : 'hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(p.id)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{p.name_kh}</div>
                      <div className="text-xs text-gray-500">{p.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
