import { useState, useEffect } from "react";
import useDynamicTitle from "../../hooks/useDynamicTitle";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/AuthContext"; 
import AccessDenied from "../components/AccessDenied";

export default function Roles() {


  useDynamicTitle("Roles");

    const { can,permissions } = useAuth();
  console.log("User Permissions dfdfdfdf:",can);
  console.log("User Permissions array:",permissions);

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [search, setSearch] = useState("");

  /* ================= FETCH ================= */
  const fetchRoles = async () => {
    try {
      setLoading(true);

      const res = await api.get("/admin-dashboard/roles", {
        params: { search },
      });


      console.log("Roles API Response:", res.data);
      // ✅ your API returns direct array
      setRoles(res.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [search]);

  /* ================= ADD ================= */
const handleAdd = async () => {
  if (!name) return toast.error("Enter role name");

  try {
    await api.post("/admin-dashboard/create-role", { name });

    toast.success("Role created");

    // ✅ INSTANT UI UPDATE (no waiting)
    setRoles((prev) => [
      {
        id: Date.now(), // temporary id
        name,
      },
      ...prev,
    ]);

    setName("");

    // 🔥 BACKGROUND SYNC (optional)
    setTimeout(() => {
      fetchRoles();
    }, 300);

  } catch (e) {
    console.error("ERROR:", e);
    toast.error("Failed to create role");
  }
};
  /* ================= DELETE ================= */
const handleDelete = async (id) => {
  if (!window.confirm("Delete this role?")) return;

  try {
    const res = await api.delete(
      `/admin-dashboard/delete-role/${id}`
    );

    console.log("Delete Role API Response:", res.data);
    if (res.data.status) {
      toast.success("Role deleted");

      // ✅ update from backend response
      
        setTimeout(() => {
      fetchRoles();
    }, 300);

    }
  } catch (e) {
    toast.error("Delete failed");
  }
};


   if (!can("roles.view")) {
    return (
      <AccessDenied />
    );
  }


  return (
    <div className="space-y-6 p-4">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">
          Roles
        </h1>

        <div className="flex gap-3 flex-wrap items-center">
          {/* SEARCH */}
          <input
            placeholder="Search roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />

          {/* ADD ROLE */}


          
  {
    can("roles.add") && (
      <>
          <input
            placeholder="New role name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-4 py-2 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />



          <button
            onClick={handleAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl shadow"
          >
            + Add Role
          </button>
          </>

    )}


        </div>
      </div>

      {/* ================= ROLE CARDS ================= */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="col-span-full text-center py-10 text-gray-500">
            Loading...
          </p>
        ) : roles.length ? (
          roles
            .filter((role) => role.name !== "superadmin") // hide superadmin
            .map((role) => (
              <div
                key={role.id}
                className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
              >
                {/* ROLE NAME */}
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-800 capitalize">
                    {role.name}
                  </h3>

                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                    Role
                  </span>
                </div>

                {/* ACTIONS */}
                <div className="flex justify-between items-center mt-4">

                    {
    can("roles.manage") && (
                  <button
                    onClick={() =>
                      (window.location.href = `/role-permission/${role.name}`)
                    }
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Manage Permissions
                  </button>
    )}  


                  {role.name !== "admin" && role.name !== "superadmin" && (
                        can("roles.delete") && (
                        <button
                          onClick={() => handleDelete(role.id)}
                          className="text-sm text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                        )
                  )}

                  {/* <button
                    onClick={() => handleDelete(role.id)}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Delete
                  </button> */}
                </div>
              </div>
            ))
        ) : (
          <p className="col-span-full text-center py-10 text-gray-400">
            No roles found
          </p>
        )}
      </div>
    </div>
  );
}