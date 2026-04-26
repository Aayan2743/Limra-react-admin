import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import api from "../../../api/axios";

const EditStepMeta = forwardRef(({ productId, meta }, ref) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  /* ================= PREFILL FROM API ================= */
  useEffect(() => {
    if (!meta) return;

    setTitle(meta.meta_title || "");
    setDescription(meta.meta_description || "");

    if (meta.meta_tags) {
      setTags(
        Array.isArray(meta.meta_tags)
          ? meta.meta_tags
          : meta.meta_tags.split(","),
      );
    }
  }, [meta]);

  /* ================= ADD TAG ================= */
  const addTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags((prev) => [...prev, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  /* ================= SAVE STEP ================= */
  useImperativeHandle(ref, () => ({
    async saveStep() {
      if (!productId) return false;

      try {
        await api.post(
          `/admin-dashboard/product-seo-meta/update-meta/${productId}`,
          {
            meta_title: title,
            meta_description: description,
            meta_tags: tags.join(","), // 🔥 store as string
          },
        );

        return true;
      } catch (err) {
        console.error("META SAVE ERROR:", err);
        alert("Failed to save meta");
        return false;
      }
    },
  }));

  return (
    <div className="bg-white border rounded-xl p-6 space-y-6">
      <h3 className="text-lg font-semibold">SEO Meta Information</h3>

      {/* META TITLE */}
      <div>
        <label className="text-sm font-medium">Meta Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          className="input mt-1"
        />
      </div>

      {/* META DESCRIPTION */}
      <div>
        <label className="text-sm font-medium">Meta Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={160}
          rows={3}
          className="input mt-1"
        />
      </div>

      {/* META TAGS */}
      <div>
        <label className="text-sm font-medium">Meta Tags</label>
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Type & press Enter"
          className="input mt-1"
        />

        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag, i) => (
            <span key={i} className="bg-gray-200 px-3 py-1 rounded text-sm">
              {tag}
              <button onClick={() => removeTag(i)}>✕</button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

export default EditStepMeta;
