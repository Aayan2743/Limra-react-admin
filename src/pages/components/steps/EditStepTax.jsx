import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import api from "../../../api/axios";

const EditStepTax = forwardRef(({ productId, data, productStatus }, ref) => {
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstType, setGstType] = useState("inclusive");
  const [gstPercent, setGstPercent] = useState("0.00");

  const [affinityEnabled, setAffinityEnabled] = useState(false);
  const [affinityPercent, setAffinityPercent] = useState("0.00");

  const [isPublished, setIsPublished] = useState(false);

  /* ================= PREFILL ================= */
  useEffect(() => {
    if (!data) return;

    console.log("RUNNING PREFILL", data);

    setGstEnabled(Boolean(data.gst_enabled));
    setGstType(data.gst_type || "inclusive");
    setGstPercent(Number(data.gst_percent ?? 0).toFixed(2));

    setAffinityEnabled(Boolean(data.affinity_enabled));
    setAffinityPercent(Number(data.affinity_percent ?? 0).toFixed(2));

    setIsPublished(
      productStatus === "Published" || productStatus === "Published",
    );
  }, [data, productStatus]);

  /* ================= SAVE STEP ================= */
  useImperativeHandle(ref, () => ({
    async saveStep() {
      if (!productId) return false;

      try {
        await api.post(
          `/admin-dashboard/product-tax-affinity/update-tax/${productId}`,
          {
            gst_enabled: gstEnabled,
            gst_type: gstType,
            gst_percent: gstEnabled ? Number(gstPercent) : 0,

            affinity_enabled: affinityEnabled,
            affinity_percent: affinityEnabled ? Number(affinityPercent) : 0,

            status: isPublished ? "Published" : "draft", // 👈 IMPORTANT
          },
        );

        return true;
      } catch (err) {
        console.error("TAX SAVE ERROR:", err);
        alert("Failed to save settings");
        return false;
      }
    },
  }));

  return (
    <div className="bg-white border rounded-xl p-6 space-y-6">
      <h3 className="text-lg font-semibold">Tax, Affinity & Publish</h3>

      {/* ================= PUBLISH ================= */}
      <div className="space-y-1">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Publish Product
        </label>

        <p className="text-sm text-gray-500">
          Status:{" "}
          <span
            className={`font-medium ${
              isPublished ? "text-green-600" : "text-yellow-600"
            }`}
          >
            {isPublished ? "Published" : "Draft"}
          </span>
        </p>
      </div>

      {/* ================= GST ================= */}
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={gstEnabled}
            onChange={(e) => setGstEnabled(e.target.checked)}
          />
          Enable GST
        </label>

        <div
          className={`flex gap-4 items-center ${!gstEnabled && "opacity-50"}`}
        >
          <select
            value={gstType}
            disabled={!gstEnabled}
            onChange={(e) => setGstType(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="inclusive">Inclusive</option>
            <option value="exclusive">Exclusive</option>
          </select>

          <input
            type="number"
            value={gstPercent}
            disabled={!gstEnabled}
            onChange={(e) => setGstPercent(e.target.value)}
            className="border rounded px-3 py-1 w-24"
          />
        </div>
      </div>

      {/* ================= AFFINITY ================= */}
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={affinityEnabled}
            onChange={(e) => setAffinityEnabled(e.target.checked)}
          />
          Enable Affinity
        </label>

        <input
          type="number"
          value={affinityPercent}
          disabled={!affinityEnabled}
          onChange={(e) => setAffinityPercent(e.target.value)}
          className={`border rounded px-3 py-1 w-24 ${
            !affinityEnabled && "opacity-50"
          }`}
        />
      </div>
    </div>
  );
});

export default EditStepTax;
