import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../auth/AuthContext";
import AccessDenied from "../components/AccessDenied";

//assign_roles.view
export default function AssignRole() {

    const { can,permissions } = useAuth();
  console.log("User Permissions dfdfdfdf:",can);
  console.log("User Permissions array:",permissions);


  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin-dashboard/users", {
        params: { search },
      });
      setUsers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH ROLES ================= */
  const fetchRoles = async () => {
    const res = await api.get("/admin-dashboard/roles");
    setRoles(res.data);
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [search]);

  /* ================= ASSIGN ROLE ================= */
  const handleAssign = async (userId, role) => {
    try {
      await api.post("/admin-dashboard/assign-role", {
        user_id: userId,
        role: role,
      });

      alert("Role assigned");
      fetchUsers(); // refresh
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemove = async (userId, role) => {
  try {
    await api.post("/admin-dashboard/remove-role", {
      user_id: userId,
      role: role,
    });

    alert("Role removed");
    fetchUsers(); // refresh
  } catch (e) {
    console.error(e);
  }
};


   if (!can("assign_roles.view")) {
    return (
      <AccessDenied />
    );
  }




   return (
  <div className="p-6 space-y-6">
    {/* HEADER */}
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <h1 className="text-2xl font-bold text-gray-800">
        Assign Roles
      </h1>

      <input
        placeholder="Search user..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-4 py-2 rounded-xl w-full md:w-72 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      />
    </div>

    {/* TABLE CARD */}
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="p-4 text-left">User</th>
            <th className="p-4 text-left">Email</th>
            <th className="p-4 text-left">Roles</th>
              
    {can("assign_roles.assign") && (

            <th className="p-4 text-left">Assign</th>
    )}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4" className="text-center py-10 text-gray-500">
                Loading...
              </td>
            </tr>
          ) : users.length ? (
            users.map((u) => (
              <tr
                key={u.id}
                className="border-t hover:bg-gray-50 transition"
              >
                {/* USER */}
                <td className="p-4 font-medium text-gray-800">
                  {u.name}
                </td>

                {/* EMAIL */}
                <td className="p-4 text-gray-600">
                  {u.email}
                </td>

                {/* ROLES */}
                <td className="p-4">
                  {u.roles?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {u.roles.map((role) => (
                        <div
                          key={role.id}
                          className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {role.name}

                          {/* REMOVE BUTTON */}
                          <button
                            onClick={() => handleRemove(u.id, role.name)}
                            className="bg-red-100 hover:bg-red-200 text-red-600 px-2 rounded-full text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">
                      No Role
                    </span>
                  )}
                </td>

                {/* ASSIGN */}

                    {can("assign_roles.assign") && (
                <td className="p-4">
                  <select
                    className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    defaultValue=""
                    onChange={(e) =>
                      handleAssign(u.id, e.target.value)
                    }
                  >
                    <option value="">Select Role</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </td>
                    )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center py-10 text-gray-400">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);
  
}