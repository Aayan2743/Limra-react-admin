import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { generateVariants } from "./steps/generateVariants";

/** @param {number} n */
function randomDigits(n) {
  let s = "";
  for (let i = 0; i < n; i += 1) s += Math.floor(Math.random() * 10);
  return s;
}

/**
 * 13-digit barcode (EAN-13 check digit). Prefix 200 = commonly used for in-house / store numbering.
 * UI-only until your API assigns official GTINs.
 */
function generateEan13Internal() {
  const body = `200${randomDigits(9)}`;
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    const d = Number(body[i]);
    sum += i % 2 === 0 ? d : d * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return `${body}${check}`;
}

function collectUsedBarcodes(rows) {
  const used = new Set();
  (rows || []).forEach((r) => {
    const t = String(r?.barcode || "").trim();
    if (t) used.add(t);
  });
  return used;
}

function nextUniqueBarcode(used) {
  for (let k = 0; k < 64; k += 1) {
    const b = generateEan13Internal();
    if (!used.has(b)) return b;
  }
  return generateEan13Internal();
}

function generateSkuCode() {
  const t = Date.now().toString(36).toUpperCase().slice(-6);
  return `SKU-${t}-${randomDigits(4)}`;
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-3">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={
        "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 " +
        (props.className || "")
      }
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={
        "min-h-[96px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 " +
        (props.className || "")
      }
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={
        "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 " +
        (props.className || "")
      }
    />
  );
}

function MultiValuePills({ values, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => {
        const active = selected.includes(v);
        return (
          <button
            key={v}
            type="button"
            onClick={() => onToggle(v)}
            className={`h-10 rounded-2xl border px-4 text-sm font-semibold transition ${
              active
                ? "border-violet-200 bg-violet-50 text-violet-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

export default function EditStoreStockDrawer({ open, onClose, onSaved, product }) {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    subcategoryId: "",
    sku: "",
    quantity: "",
    hsn: "",
    discount: "",
    batchNo: "",
    expiry: "",
    supplier: "",
    notes: "",
    images: [], // File[] — product photos when no variant rows
  });
  const [categories, setCategories] = useState([]);
  const [variations, setVariations] = useState([]);
  const [selectedVariations, setSelectedVariations] = useState({});

  const [variantRows, setVariantRows] = useState([]); // [{label, barcode, qty, costPrice, sellingPrice, discount (₹), hsn, images: File[]}]
  const variantFileRefs = useRef({});
  const productImagesRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setForm((prev) => ({
      ...prev,
      name: product?.name || "",
      categoryId: product?.category_id || "",
      subcategoryId: product?.subcategory_id || "",
      sku: product?.sku || "",
      quantity: product?.store_stock || product?.quantity || "",
      hsn: product?.hsn_code || "",
      discount: product?.discount || "",
      batchNo: product?.batch_no || "",
      expiry: product?.expiry_date || "",
      supplier: product?.supplier || "",
      notes: product?.notes || "",
      images: [],
    }));
    setSelectedVariations({});
    setVariantRows(product?.variants || []);
  }, [open, product]);

  useEffect(() => {
    if (!open) return;
    const fetchCategories = async () => {
      try {
        const res = await api.get("/admin-dashboard/list-category-all");
        setCategories(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
        toast.error("Failed to load categories");
        setCategories([]);
      }
    };
    fetchCategories();
  }, [open]);

  useEffect(() => {
    if (!open || !form.categoryId) return;
    const fetchVariations = async () => {
      try {
        const res = await api.get("/admin-dashboard/get-variations", {
          params: { category_id: form.categoryId },
        });
        const rawVariations = res.data?.data || [];
        setVariations(
          rawVariations.map((variation) => ({
            key: variation.name,
            values: (variation.values || []).map(
              (value) => value.value || value.name || "",
            ),
          })),
        );
      } catch (err) {
        console.error("Failed to fetch variations", err);
        toast.error("Failed to load variations");
        setVariations([]);
      }
    };
    fetchVariations();
  }, [open, form.categoryId]);

  const subCategories = useMemo(
    () => categories.filter((c) => String(c.parent_id) === String(form.categoryId)),
    [categories, form.categoryId],
  );

  const selectedCategory = useMemo(
    () => categories.find((c) => String(c.id) === String(form.categoryId)),
    [form.categoryId, categories],
  );

  useEffect(() => {
    setForm((p) => {
      if (!p.categoryId) return { ...p, subcategoryId: "" };
      const validSubcategory = subCategories.some(
        (sub) => String(sub.id) === String(p.subcategoryId),
      );
      return validSubcategory ? p : { ...p, subcategoryId: "" };
    });
  }, [form.categoryId, subCategories]);

  const variants = useMemo(() => {
    const input = Object.fromEntries(
      Object.entries(selectedVariations).filter(([, vals]) => (vals?.length || 0) > 0),
    );
    return generateVariants(input);
  }, [selectedVariations]);

  useEffect(() => {
    // keep variantRows aligned with generated variants
    if (!variants.length) {
      setVariantRows([]);
      return;
    }
    setVariantRows((prev) =>
      variants.map((arr) => {
        const label = Array.isArray(arr) ? arr.join(" / ") : String(arr);
        const existing = prev.find((r) => r.label === label);
        const empty = {
          label,
          barcode: "",
          qty: "",
          costPrice: "",
          sellingPrice: "",
          discount: "",
          hsn: "",
          images: [],
        };
        return existing
          ? {
              ...empty,
              ...existing,
              barcode: existing.barcode ?? "",
              discount: existing.discount ?? "",
              hsn: existing.hsn ?? "",
              images: Array.isArray(existing.images) ? existing.images : [],
            }
          : empty;
      }),
    );
  }, [variants]);

  const canSave = useMemo(() => {
    const baseQty = Number(form.quantity);
    const baseQtyOk = Number.isFinite(baseQty) && baseQty > 0;
    const basicOk = Boolean(form.name.trim()) && Boolean(form.categoryId);

    const hsnLooksValid = (s) => {
      if (!s) return true;
      return typeof s === "string" && s.trim().length >= 4 && /^\d+$/.test(s.trim());
    };

    const discountRsOk = (val) => {
      if (val === "" || val == null) return true;
      const n = Number(val);
      return Number.isFinite(n) && n >= 0;
    };

    const variantsOk = variantRows.length
      ? variantRows.some((r) => Number(r.qty) > 0) &&
        variantRows
          .filter((r) => Number(r.qty) > 0)
          .every((r) => {
            const cost = r.costPrice === "" ? 0 : Number(r.costPrice);
            const sell = r.sellingPrice === "" ? 0 : Number(r.sellingPrice);
            return (
              Number.isFinite(cost) &&
              Number.isFinite(sell) &&
              cost >= 0 &&
              sell >= 0 &&
              discountRsOk(r.discount) &&
              hsnLooksValid(r.hsn || "")
            );
          })
      : baseQtyOk && discountRsOk(form.discount);

    return basicOk && variantsOk;
  }, [form, variantRows]);

  if (!open) return null;

  const handleSave = async () => {
    if (saving || !canSave) return;

    const categoryId = form.subcategoryId || form.categoryId;
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    const dummyPayload = {
      id: product?.id || Date.now(),
      name: form.name,
      category_id: categoryId,
      category_name: selectedCategory?.name,
      sku: form.sku || undefined,
      quantity: Number(form.quantity) || 0,
      store_stock: Number(form.quantity) || 0,
      stock: Number(form.quantity) || 0,
      hsn_code: form.hsn || undefined,
      discount: Number(form.discount) || 0,
      batch_no: form.batchNo || undefined,
      expiry_date: form.expiry || undefined,
      supplier: form.supplier || undefined,
      notes: form.notes || undefined,
      is_pos: 1,
      stock_type: "store",
      variants: variantRows.map((row) => ({
        label: row.label,
        sku: row.barcode || row.label,
        quantity: Number(row.qty || 0),
        stock: Number(row.qty || 0),
        purchase_price: Number(row.costPrice || 0),
        sell_price: Number(row.sellingPrice || 0),
        discount: Number(row.discount || 0),
        hsn_code: row.hsn || undefined,
      })),
    };

    try {
      setSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      const existing = JSON.parse(localStorage.getItem("dummy_store_stock") || "[]");
      const updated = existing.map((p) => (p.id === product?.id ? dummyPayload : p));
      if (!existing.some((p) => p.id === product?.id)) {
        updated.push(dummyPayload);
      }
      localStorage.setItem("dummy_store_stock", JSON.stringify(updated));
      console.log("Dummy store stock updated", dummyPayload);
      toast.success("Store stock updated successfully");
      onSaved?.(dummyPayload);
      onClose?.();
    } catch (err) {
      console.error("Failed to update store stock", err);
      toast.error("Failed to update store stock");
    } finally {
      setSaving(false);
    }
  };

  const addVariantImages = (label, files) => {
    const next = Array.from(files || []).filter(Boolean);
    if (!next.length) return;
    setVariantRows((prev) =>
      prev.map((x) =>
        x.label === label ? { ...x, images: [...(x.images || []), ...next] } : x,
      ),
    );
  };

  const removeVariantImage = (label, imgIndex) => {
    setVariantRows((prev) =>
      prev.map((x) => {
        if (x.label !== label) return x;
        const imgs = [...(x.images || [])];
        imgs.splice(imgIndex, 1);
        return { ...x, images: imgs };
      }),
    );
  };

  const addProductImages = (files) => {
    const next = Array.from(files || []).filter(Boolean);
    if (!next.length) return;
    setForm((p) => ({ ...p, images: [...(p.images || []), ...next] }));
  };

  const removeProductImage = (imgIndex) => {
    setForm((p) => {
      const imgs = [...(p.images || [])];
      imgs.splice(imgIndex, 1);
      return { ...p, images: imgs };
    });
  };

  const handleVariationToggle = (key, value) => {
    setSelectedVariations((prev) => {
      const curr = prev[key] || [];
      const next = curr.includes(value)
        ? curr.filter((v) => v !== value)
        : [...curr, value];
      return { ...prev, [key]: next };
    });
  };

  const updateVariantRow = (label, field, value) => {
    setVariantRows((prev) =>
      prev.map((r) => (r.label === label ? { ...r, [field]: value } : r)),
    );
  };

  const generateBarcodes = () => {
    const used = collectUsedBarcodes(variantRows);
    setVariantRows((prev) =>
      prev.map((r) => ({
        ...r,
        barcode: r.barcode || nextUniqueBarcode(used),
      })),
    );
  };

  const generateSkus = () => {
    setVariantRows((prev) =>
      prev.map((r) => ({
        ...r,
        barcode: r.barcode || generateSkuCode(),
      })),
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
          <h2 className="text-xl font-bold text-slate-800">Edit Store Stock</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[calc(90vh-4rem)] overflow-y-auto p-6">
          <div className="space-y-6">
            {/* 🔥 BASIC INFO */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Basic Information</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Product Name" hint="Required">
                  <Input
                    placeholder="Enter product name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </Field>
                <Field label="Category" hint="Required">
                  <Select
                    value={form.categoryId}
                    onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    {categories
                      .filter((c) => !c.parent_id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </Select>
                </Field>
                {subCategories.length > 0 && (
                  <Field label="Subcategory" hint="Optional">
                    <Select
                      value={form.subcategoryId}
                      onChange={(e) => setForm((p) => ({ ...p, subcategoryId: e.target.value }))}
                    >
                      <option value="">Select subcategory</option>
                      {subCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
                <Field label="SKU" hint="Auto-generated if empty">
                  <Input
                    placeholder="Enter SKU"
                    value={form.sku}
                    onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                  />
                </Field>
                <Field label="Store Stock Quantity" hint="Required">
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.quantity}
                    onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                  />
                </Field>
                <Field label="HSN Code" hint="Optional">
                  <Input
                    placeholder="Enter HSN code"
                    value={form.hsn}
                    onChange={(e) => setForm((p) => ({ ...p, hsn: e.target.value }))}
                  />
                </Field>
                <Field label="Discount (₹)" hint="Optional">
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.discount}
                    onChange={(e) => setForm((p) => ({ ...p, discount: e.target.value }))}
                  />
                </Field>
                <Field label="Batch No" hint="Optional">
                  <Input
                    placeholder="Enter batch number"
                    value={form.batchNo}
                    onChange={(e) => setForm((p) => ({ ...p, batchNo: e.target.value }))}
                  />
                </Field>
                <Field label="Expiry Date" hint="Optional">
                  <Input
                    type="date"
                    value={form.expiry}
                    onChange={(e) => setForm((p) => ({ ...p, expiry: e.target.value }))}
                  />
                </Field>
                <Field label="Supplier" hint="Optional">
                  <Input
                    placeholder="Enter supplier name"
                    value={form.supplier}
                    onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label="Notes" hint="Optional">
                <Textarea
                  placeholder="Enter notes"
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </Field>
            </div>

            {variations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Variations</h3>
                {variations.map((v) => (
                  <Field key={v.key} label={v.key} hint="Select options">
                    <MultiValuePills
                      values={v.values || []}
                      selected={selectedVariations[v.key] || []}
                      onToggle={(val) => handleVariationToggle(v.key, val)}
                    />
                  </Field>
                ))}
              </div>
            )}

            {/* 🔥 VARIANT ROWS */}
            {variantRows.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">Variant Details</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={generateBarcodes}
                      className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
                    >
                      Generate Barcodes
                    </button>
                    <button
                      type="button"
                      onClick={generateSkus}
                      className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
                    >
                      Generate SKUs
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {variantRows.map((row, idx) => (
                    <div
                      key={row.label}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <h4 className="mb-3 font-semibold text-slate-700">{row.label}</h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Field label="Barcode/SKU">
                          <Input
                            placeholder="Enter barcode"
                            value={row.barcode}
                            onChange={(e) => updateVariantRow(row.label, "barcode", e.target.value)}
                          />
                        </Field>
                        <Field label="Quantity">
                          <Input
                            type="number"
                            placeholder="0"
                            value={row.qty}
                            onChange={(e) => updateVariantRow(row.label, "qty", e.target.value)}
                          />
                        </Field>
                        <Field label="Cost Price (₹)">
                          <Input
                            type="number"
                            placeholder="0"
                            value={row.costPrice}
                            onChange={(e) => updateVariantRow(row.label, "costPrice", e.target.value)}
                          />
                        </Field>
                        <Field label="Selling Price (₹)">
                          <Input
                            type="number"
                            placeholder="0"
                            value={row.sellingPrice}
                            onChange={(e) => updateVariantRow(row.label, "sellingPrice", e.target.value)}
                          />
                        </Field>
                        <Field label="Discount (₹)">
                          <Input
                            type="number"
                            placeholder="0"
                            value={row.discount}
                            onChange={(e) => updateVariantRow(row.label, "discount", e.target.value)}
                          />
                        </Field>
                        <Field label="HSN Code">
                          <Input
                            placeholder="Enter HSN"
                            value={row.hsn}
                            onChange={(e) => updateVariantRow(row.label, "hsn", e.target.value)}
                          />
                        </Field>
                      </div>
                      <div className="mt-4">
                        <Field label="Images">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            ref={(el) => (variantFileRefs.current[row.label] = el)}
                            onChange={(e) => addVariantImages(row.label, e.target.files)}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => variantFileRefs.current[row.label]?.click()}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                          >
                            Add Images
                          </button>
                          {row.images?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {row.images.map((img, imgIdx) => (
                                <div key={imgIdx} className="relative">
                                  <img
                                    src={URL.createObjectURL(img)}
                                    alt=""
                                    className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeVariantImage(row.label, imgIdx)}
                                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🔥 PRODUCT IMAGES (when no variants) */}
            {variantRows.length === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Product Images</h3>
                <Field label="Images">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={productImagesRef}
                    onChange={(e) => addProductImages(e.target.files)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => productImagesRef.current?.click()}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Add Images
                  </button>
                  {form.images?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.images.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={URL.createObjectURL(img)}
                            alt=""
                            className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeProductImage(idx)}
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Field>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Updating..." : "Update Store Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}