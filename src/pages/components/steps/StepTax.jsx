import { forwardRef, useImperativeHandle, useState } from "react";
import api from "../../../api/axios";

const StepTax = forwardRef(({ productId }, ref) => {
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstType, setGstType] = useState("exclusive");
  const [gstPercent, setGstPercent] = useState("");

  const [affinityEnabled, setAffinityEnabled] = useState(false);
  const [affinityPercent, setAffinityPercent] = useState("");

  /* ================= SAVE STEP ================= */

  useImperativeHandle(ref, () => ({
    async saveStep() {
      if (!productId) {
        alert("Product ID missing");
        return false;
      }

      try {
        await api.post(`/admin-dashboard/product-tax-affinity/${productId}`, {
          gst_enabled: gstEnabled,
          gst_type: gstType,
          gst_percent: gstEnabled ? gstPercent : 0,
          affinity_enabled: affinityEnabled,
          affinity_percent: affinityEnabled ? affinityPercent : 0,
        });

        return true;
      } catch {
        alert("Failed to save tax & affinity");
        return false;
      }
    },
  }));

  return (
    <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800">Tax & Affinity</h3>
        <p className="text-sm text-gray-500">
          Configure GST and affinity commission settings
        </p>
      </div>

      {/* GST SECTION */}
      <div className="rounded-lg border p-4 space-y-4">
        <label className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">Enable GST </p>
            <p className="text-sm text-gray-500">Apply tax on this product</p>
          </div>

          <input
            type="checkbox"
            checked={gstEnabled}
            onChange={(e) => setGstEnabled(e.target.checked)}
            className="h-5 w-5"
          />
        </label>

        {gstEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                GST Type
              </label>
              <select
                className="input mt-1"
                value={gstType}
                onChange={(e) => setGstType(e.target.value)}
              >
                <option value="exclusive">Exclusive</option>
                <option value="inclusive">Inclusive</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                GST Percentage
              </label>
              <input
                type="number"
                className="input mt-1"
                placeholder="GST %"
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* AFFINITY SECTION */}
      <div className="rounded-lg border p-4 space-y-4">
        <label className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">Enable Affinity</p>
            <p className="text-sm text-gray-500">
              Affiliate commission percentage
            </p>
          </div>

          <input
            type="checkbox"
            checked={affinityEnabled}
            onChange={(e) => setAffinityEnabled(e.target.checked)}
            className="h-5 w-5"
          />
        </label>

        {affinityEnabled && (
          <div>
            <label className="text-sm font-medium text-gray-700">
              Affinity Percentage
            </label>
            <input
              type="number"
              className="input mt-1"
              placeholder="Affinity %"
              value={affinityPercent}
              onChange={(e) => setAffinityPercent(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default StepTax;
