import { useEffect, useState } from "react";
import api from "../api/axios";
import AddProductDrawer from "./components/AddProductDrawer";
import EditProductDrawer from "./components/EditProductDrawer";
import StatusBadge from "./components/StatusBadge";
import ProductSectionAssign from "./settings/components/ProductSectionAssign";
import { useAuth } from "../auth/AuthContext";

import { showLoader, closeLoader, showErrorToast } from "../utils/swal";

export default function Products() {
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [sectionProduct, setSectionProduct] = useState(null);
  const [sections, setSections] = useState([]);
  const { can } = useAuth();

  // 🔥 STATES
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [columnOpen, setColumnOpen] = useState(false);

  // 🔥 COLUMN CONFIG
  const defaultColumns = [
    "id",
    "image",
    "name",
    "category",
    "price",
    "status",
    "sections",
    "action",
  ];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem("product_columns");
    return saved ? JSON.parse(saved) : defaultColumns;
  });

  const toggleColumn = (col) => {
    let updated;
    if (visibleColumns.includes(col)) {
      updated = visibleColumns.filter((c) => c !== col);
    } else {
      updated = [...visibleColumns, col];
    }
    setVisibleColumns(updated);
    localStorage.setItem("product_columns", JSON.stringify(updated));
  };

  // 🔥 CLOSE DROPDOWN
  useEffect(() => {
    const close = () => setColumnOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    api.get("/admin-dashboard/sections").then((res) => {
      setSections(res.data.data || []);
    });
  }, []);

  useEffect(() => {
    const loadSections = async () => {
      try {
        const res = await api.get("/admin-dashboard/sections");
        console.log("Sections API:", res.data); // 👈 DEBUG

        setSections(res.data.data || []);
      } catch (err) {
        console.log("Section load error", err);
      }
    };

    loadSections();
  }, []);

  // 🔥 FETCH API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin-dashboard/products", {
        params: { search: query, page, perPage },
      });

      setProducts(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [query, page, perPage]);

  // 🔥 HANDLERS
  const handleEdit = (product) => {
    setSelectedProduct(product);
    setOpenEdit(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/admin-dashboard/products/${id}`);
      fetchProducts();
    } catch (err) {
      console.log(err);
    }
  };

  if (!can("product.view")) return <div>No Access</div>;

  return (
    <div className="p-5 space-y-6">
      {/* 🔥 HEADER */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-2xl font-bold">Products</h2>

        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="px-4 py-2 border rounded-lg"
          />

          <button
            onClick={() => {
              setQuery(search);
              setPage(1);
            }}
            className="px-4 py-2 bg-gray-100 rounded-lg"
          >
            Search
          </button>

          <button
            onClick={() => {
              setSearch("");
              setQuery("");
            }}
            className="px-4 py-2 bg-red-100 rounded-lg"
          >
            Reset
          </button>

          {/* 🔥 ADD */}
          {can("product.add") && (
            <button
              onClick={() => setOpenAdd(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
            >
              + Add Product
            </button>
          )}

          {/* 🔥 COLUMN TOGGLE */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setColumnOpen(!columnOpen);
              }}
              className="px-4 py-2 bg-white border rounded-xl shadow"
            >
              ⚙ Columns
            </button>

            {columnOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border p-4 z-50"
              >
                {defaultColumns.map((col) => (
                  <label key={col} className="flex gap-2 text-sm py-1">
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col)}
                      onChange={() => toggleColumn(col)}
                    />
                    {col}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🔥 TABLE */}
      <div className="bg-white rounded-2xl shadow-lg border p-4 overflow-x-auto">
        <table className="min-w-[1000px] w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase">
              {visibleColumns.includes("id") && <th className="px-4">S No</th>}
              {visibleColumns.includes("image") && (
                <th className="px-4">Image</th>
              )}
              {visibleColumns.includes("name") && (
                <th className="px-4">Product</th>
              )}
              {visibleColumns.includes("category") && (
                <th className="px-4">Category</th>
              )}
              {visibleColumns.includes("price") && (
                <th className="px-4">Price</th>
              )}
              {visibleColumns.includes("status") && (
                <th className="px-4">Status</th>
              )}
              {visibleColumns.includes("sections") && (
                <th className="px-4">Sections</th>
              )}
              {visibleColumns.includes("action") && (
                <th className="px-4">Action</th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr
                  key={p.id}
                  className="bg-white shadow-sm hover:shadow-md rounded-xl"
                >
                  {visibleColumns.includes("id") && (
                    <td className="px-4 py-3">{p.id}</td>
                  )}

                  {visibleColumns.includes("image") && (
                    <td className="px-4 py-3">
                      <img src={p.image_url} className="w-12 h-12 rounded-xl" />
                    </td>
                  )}

                  {visibleColumns.includes("name") && (
                    <td className="px-4 py-3 font-semibold">{p.name}</td>
                  )}

                  {visibleColumns.includes("category") && (
                    <td className="px-4 py-3">{p.category_name}</td>
                  )}

                  {visibleColumns.includes("price") && (
                    <td className="px-4 py-3 text-green-600">
                      ₹{p.final_price}
                    </td>
                  )}

                  {visibleColumns.includes("status") && (
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                  )}

                  {visibleColumns.includes("sections") && (
                    <td className="px-4 py-3 space-y-2">
                      {/* 🔥 BADGES */}
                      <div className="flex flex-wrap gap-1">
                        {p.sections?.slice(0, 2).map((s) => (
                          <span
                            key={s.id}
                            className="px-2 py-1 text-xs bg-indigo-100 text-indigo-600 rounded-full"
                          >
                            {s.name}
                          </span>
                        ))}

                        {p.sections?.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{p.sections.length - 2} more
                          </span>
                        )}
                      </div>

                      {/* 🔥 MANAGE BUTTON */}
                      <button
                        onClick={async () => {
                          try {
                            showLoader("Loading Sections...");

                            // 🔥 small delay to show loader smoothly (optional but recommended)
                            await new Promise((resolve) =>
                              setTimeout(resolve, 300),
                            );

                            // 🔥 If you already loaded sections globally → skip API
                            // Otherwise preload (optional)
                            // await api.get("/admin-dashboard/sections");

                            setSectionProduct(p);

                            closeLoader(); // 🔥 CLOSE LOADER
                            setSectionModalOpen(true); // 🔥 OPEN MODAL
                          } catch (err) {
                            closeLoader();
                            showErrorToast("Failed to load sections");
                          }
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-sm shadow hover:scale-105 transition"
                      >
                        Manage
                      </button>
                    </td>
                  )}
                  {visibleColumns.includes("action") && (
                    <td className="px-4 py-3 flex gap-2">
                      {can("product.edit") && (
                        <button
                          onClick={() => handleEdit(p)}
                          className="text-indigo-600"
                        >
                          Edit
                        </button>
                      )}

                      {can("product.delete") && (
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-red-500"
                        >
                          Delete
                        </button>
                      )}

                      {/* 🔥 IMPORTANT (YOU WERE MISSING THIS BEFORE) */}
                      {/* <ProductSectionAssign product={p} /> */}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🔥 PAGINATION */}
      <div className="flex justify-between items-center">
        <select
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
        </select>

        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Prev
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* 🔥 DRAWERS */}
      {/* <AddProductDrawer open={openAdd} onClose={() => setOpenAdd(false)} /> */}

      <AddProductDrawer
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSaved={(newProduct) => {
          setProducts((prev) => [newProduct, ...prev]); // 🔥 add instantly
        }}
      />

      {/* <EditProductDrawer
        open={openEdit}
        product={selectedProduct}
        onClose={() => setOpenEdit(false)}
      /> */}

      <EditProductDrawer
        open={openEdit}
        product={selectedProduct} // FULL PRODUCT
        productId={selectedProduct?.id}
        onClose={() => {
          setOpenEdit(false);
          setSelectedProduct(null);
          fetchProducts();
        }}
      />

      {sectionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Manage Sections</h2>
              <button onClick={() => setSectionModalOpen(false)}>✕</button>
            </div>

            <ProductSectionAssign
              product={sectionProduct}
              sections={sections}
              onSaved={(updatedSections) => {
                // 🔥 REALTIME UPDATE
                setProducts((prev) =>
                  prev.map((item) =>
                    item.id === sectionProduct.id
                      ? { ...item, sections: updatedSections }
                      : item,
                  ),
                );

                setSectionModalOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
