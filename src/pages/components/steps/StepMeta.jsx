

import { forwardRef, useImperativeHandle, useState } from "react";
import api from "../../../api/axios";

const StepMeta = forwardRef(({ productId }, ref) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

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
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  // 🔥 THIS WILL BE CALLED BY PARENT
  useImperativeHandle(ref, () => ({
    async saveStep() {
      console.log("SEO saveStep called"); // 🔥 debug

      if (!productId) {
        alert("Product ID missing");
        return false;
      }

      try {
        await api.post(`/admin-dashboard/product-seo-meta/${productId}`, {
          meta_title: title,
          meta_description: description,
          meta_tags: tags.join(","), // ✅ must be string
        });

        return true;
      } catch (err) {
        console.error(err);
        alert("Failed to save SEO meta");
        return false;
      }
    },
  }));

  return (
    <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold">SEO Meta Information</h3>
        <p className="text-sm text-gray-500">
          Optimize how this product appears on search engines
        </p>
      </div>

      <div>
        <label className="text-sm font-medium">Meta Title</label>
        <input
          className="input mt-1"
          maxLength={60}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <p className="text-xs text-gray-400">{title.length}/60</p>
      </div>

      <div>
        <label className="text-sm font-medium">Meta Description</label>
        <textarea
          rows={3}
          className="input mt-1"
          maxLength={160}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <p className="text-xs text-gray-400">{description.length}/160</p>
      </div>

      <div>
        <label className="text-sm font-medium">Meta Tags</label>
        <input
          className="input mt-1"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Type tag & press Enter"
        />

        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag, i) => (
            <span key={i} className="px-3 py-1 bg-indigo-50 rounded-full">
              {tag}
              <button onClick={() => removeTag(i)} className="ml-2">
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

export default StepMeta;
