import { useState, useEffect, useRef } from "react";
import api from "../../../api/axios";
import RichTextEditor from "../RichTextEditor";

export default function StepBasic({ setStep, setProductId }) {
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: "",
    category_id: "",
    subcategory_id: "",
  });

  const [specifications, setSpecifications] = useState([
    { key: "", value: "" },
  ]);

  const tabs = [
    "Description",
    "Product Specifications",
    "Return & Exchange",
    "Shipping & Delivery",
    "Manufactured By",
    "Customer Care",
  ];

  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [dynamicData, setDynamicData] = useState({});

  /* ================= FETCH CATEGORIES ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/admin-dashboard/list-category-all");
        setCategories(res.data?.data || []);
      } catch {
        alert("Failed to load categories");
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, []);

  // const mainCategories = categories.filter((c) => c.parent_id === null);

  const mainCategories = categories.filter(
    (c) => c.parent_id === null || c.parent_id === 0,
  );
  // const subCategories = categories.filter(
  //   (c) => c.parent_id === form.category_id,
  // );

  const subCategories = categories.filter(
    (c) => String(c.parent_id) === String(form.category_id),
  );

  /* ================= HANDLERS ================= */

  const handleChange = (key, value) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === "category_id") updated.subcategory_id = "";
      return updated;
    });
  };

  const handleSpecChange = (index, field, value) => {
    const updated = [...specifications];
    updated[index][field] = value;
    setSpecifications(updated);
  };

  const addSpecRow = () =>
    setSpecifications([...specifications, { key: "", value: "" }]);

  const removeSpecRow = (index) =>
    setSpecifications(specifications.filter((_, i) => i !== index));

  const handleRichTextChange = (value) => {
    setDynamicData((prev) => ({
      ...prev,
      [activeTab]: value,
    }));
  };

  const handleSubmit = async () => {
    if (loading) return; // prevent double request

    if (!form.name || !form.category_id) {
      alert("Required fields missing");
      return;
    }

    const formattedSpecs = specifications
      .filter((s) => s.key && s.value)
      .reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});

    try {
      setLoading(true);

      const res = await api.post("/admin-dashboard/create-product", {
        ...form,
        category_id: form.subcategory_id || form.category_id,
        specifications: formattedSpecs,
        extra_details: dynamicData,
      });

      setProductId(res.data?.product?.id);
      setStep(2);
    } catch (err) {
      if (err.response?.status === 422) {
        alert(err.response.data.errors);
      } else {
        alert("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <div className="py-12 text-center">Loading...</div>;

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      {/* 🔥 HEADER */}
      <div className="px-8 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Create Product
          </h2>
          <p className="text-sm text-gray-500">
            Add basic details to get started
          </p>
        </div>
      </div>

      {/* 🔹 MAIN CONTENT */}
      <div className="flex-1 px-8 pb-28 space-y-6">
        {/* 🧾 BASIC INFO CARD */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-5">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Product Name
              </label>
              <input
                className="input mt-2 focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter product name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <SearchableSelect
              label="Category"
              options={mainCategories}
              value={form.category_id}
              onChange={(id) => handleChange("category_id", id)}
              placeholder="Select category"
            />

            {form.category_id && subCategories.length > 0 && (
              <SearchableSelect
                label="Sub Category"
                options={subCategories}
                value={form.subcategory_id}
                onChange={(id) => handleChange("subcategory_id", id)}
                placeholder="Select sub category"
              />
            )}
          </div>
        </div>

        {/* 🧠 CONTENT / TABS */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex gap-6">
            {/* 🔹 LEFT TAB SIDEBAR */}
            <div className="w-64 border-r pr-4 space-y-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
              w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition
              flex items-center justify-between
              ${
                isActive
                  ? "bg-indigo-600 text-white shadow"
                  : "text-gray-600 hover:bg-gray-100"
              }
            `}
                  >
                    <span>{tab}</span>

                    {/* ACTIVE INDICATOR */}
                    {isActive && (
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 🔹 RIGHT CONTENT */}
            <div className="flex-1">
              {activeTab === "Product Specifications" ? (
                <div className="space-y-3">
                  {specifications.map((spec, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        placeholder="Field"
                        className="input w-1/2"
                        value={spec.key}
                        onChange={(e) =>
                          handleSpecChange(index, "key", e.target.value)
                        }
                      />
                      <input
                        placeholder="Value"
                        className="input w-1/2"
                        value={spec.value}
                        onChange={(e) =>
                          handleSpecChange(index, "value", e.target.value)
                        }
                      />

                      {specifications.length > 1 && (
                        <button
                          onClick={() => removeSpecRow(index)}
                          className="px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={addSpecRow}
                    className="text-sm text-indigo-600 font-medium hover:underline"
                  >
                    + Add Specification
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <RichTextEditor
                    value={dynamicData[activeTab] || ""}
                    onChange={handleRichTextChange}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 FIXED CTA BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t px-8 py-4 flex justify-end shadow-lg">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-10 py-3 rounded-xl bg-gradient-to-r 
        from-indigo-600 to-purple-600 text-white font-semibold 
        shadow-lg hover:scale-[1.02] transition-all duration-300"
        >
          {loading ? "Creating Product..." : "Create Product →"}
        </button>
      </div>
    </div>
  );
}

/* ================= SEARCHABLE SELECT ================= */

function SearchableSelect({ label, options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) =>
      ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selected = options.find((o) => o.id == value);

  return (
    <div className="relative" ref={ref}>
      <label className="text-sm font-medium">{label}</label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input mt-1 flex justify-between items-center w-full"
      >
        <span>{selected ? selected.name : placeholder}</span>
        <span>▾</span>
      </button>

      {open && (
        <div className="absolute z-40 w-full mt-1 border bg-white shadow-lg max-h-52 overflow-y-auto">
          {options.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onChange(item.id);
                setOpen(false);
              }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50"
            >
              {item.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
