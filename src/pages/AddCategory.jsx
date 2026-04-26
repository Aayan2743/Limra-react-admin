import { useState, useEffect } from "react";
import CategoryForm from "./CategoryForm";
import BulkCategoryForm from "./BulkCategoryForm";
import useDynamicTitle from "../hooks/useDynamicTitle";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import AccessDenied from "./components/AccessDenied";

const PAGE_SIZES = [5, 10, 20];

export default function AddCategory() {
  useDynamicTitle("Categories");

  const { can, permissions } = useAuth();


  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  const [openForm, setOpenForm] = useState(false);
  const [openBulkForm, setOpenBulkForm] = useState(false);
  const [editData, setEditData] = useState(null);

  /* ================= FETCH ================= */
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin-dashboard/list-category", {
        params: { search, page, perPage },
      });

      setCategories(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [search, page, perPage]);

  /* ================= CRUD ================= */
  const handleAdd = () => {
    setEditData(null);
    setOpenForm(true);
  };

  const handleEdit = (cat) => {
    setEditData(cat);
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;

    try {
      await api.delete(`/admin-dashboard/delete-category/${id}`);
      fetchCategories();
    } catch (e) {
      alert(e.response?.data?.message || "Delete failed");
    }
  };

  const handleSave = async (formData, id) => {
    try {
      if (id) {
        await api.post(`/admin-dashboard/update-category/${id}`, formData);
      } else {
        await api.post("/admin-dashboard/add-category", formData);
      }

      setOpenForm(false);
      setEditData(null);
      fetchCategories();
    } catch (e) {
      alert(e.response?.data?.message || "Save failed");
    }
  };


  const handleToggle = async (id, type) => {
    try {
      await api.post("/admin-dashboard/toggle-category", {
        id,
        type, // "pos" or "ecom"
      });

      // refresh data
      fetchCategories();

    } catch (e) {
      alert("Toggle failed");
    }
  };


  if (!can("categories.view")) {
    return (
      <AccessDenied />
    );
  }


  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Categories</h1>

        <div className="flex gap-3 flex-wrap items-start">
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border px-3 py-2 rounded-lg w-60"
          />

          {
            can("categories.bulk") && (

              <button
                onClick={() => setOpenBulkForm(true)}
                className="bg-gray-200 px-4 py-2 rounded-lg"
              >
                + Bulk Add
              </button>
            )}


          {
            can("categories.add") && (


              <button
                onClick={handleAdd}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
              >
                + Add Category
              </button>
            )
          }

        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-xl shadow overflow-hidden hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Image</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Action</th>
              {
                can("categories.pos") && (
                  <th className="p-3 text-left">POS</th>
                )}

              {
                can("categories.ecom") && (
                  <th className="p-3 text-left">Ecom</th>
                )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : categories.length ? (
              categories.map((cat) => (
                <tr key={cat.id} className="border-t">
                  <td className="p-3">
                    <CategoryImage image={cat.full_image_url} />
                  </td>

                  <td className="p-3 font-medium">{cat.name}</td>

                  <td className="p-3 space-x-4">

                    {
                      can("categories.edit") && (

                        <button
                          onClick={() => handleEdit(cat)}
                          className="text-indigo-600"
                        >
                          Edit
                        </button>

                      )}

                    {
                      can("categories.delete") && (

                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="text-red-600"
                        >
                          Delete
                        </button>

                      )}
                  </td>

                  {
                    can("categories.pos") && (

                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={cat.is_active_pos == 1}
                          onChange={() => handleToggle(cat.id, "pos")}
                        />
                      </td>

                    )}

                  {
                    can("categories.ecom") && (

                      <td className="p-3">
                        <input
                          type="checkbox"


                          checked={cat.is_active_ecom == 1}
                          onChange={() => handleToggle(cat.id, "ecom")}
                        />
                      </td>

                    )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center py-6">
                  No categories found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= PAGINATION ================= */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(+e.target.value);
              setPage(1);
            }}
            className="border px-2 py-1 rounded"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 border rounded ${page === i + 1 ? "bg-indigo-600 text-white" : ""
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}
      {openForm && (
        <CategoryForm
          data={editData}
          onClose={() => setOpenForm(false)}
          onSave={handleSave}
        />
      )}

      {openBulkForm && (
        <BulkCategoryForm
          onClose={() => setOpenBulkForm(false)}
          onSaved={fetchCategories}
        />
      )}
    </div>
  );
}

/* ================= IMAGE COMPONENT ================= */
function CategoryImage({ image }) {
  return (
    <div className="w-12 h-12 border rounded bg-gray-100 overflow-hidden">
      {image ? (
        <img
          src={image}
          alt="Category"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="text-xs text-gray-400 flex items-center justify-center h-full">
          No Image
        </div>
      )}
    </div>
  );
}
