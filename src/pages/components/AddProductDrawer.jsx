import { useEffect, useRef, useState } from "react";
import StepBasic from "./steps/StepBasic";
import StepGallery from "./steps/StepGallery";
import StepVariation from "./steps/StepVariation";
import StepMeta from "./steps/StepMeta";
import StepTax from "./steps/StepTax";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { celebrateSuccess } from "../../utils/celebrate";

const STEPS = ["Basic", "Gallery", "Variation", "SEO", "Tax"];

export default function AddProductDrawer({ open, onClose }) {
  const [step, setStep] = useState(1);
  const [productId, setProductId] = useState(null);
  const [loading, setLoading] = useState(false);

  const galleryRef = useRef(null);
  const variationRef = useRef(null);
  const metaRef = useRef(null);
  const taxRef = useRef(null);

  useEffect(() => {
    if (!open) {
      // ✅ Reset everything when drawer closes
      setStep(1);
      setProductId(null);

      // optional (safe cleanup)
      galleryRef.current = null;
      variationRef.current = null;
      metaRef.current = null;
      taxRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [open]);

  if (!open) return null;

  const handleNext = async () => {
    if (loading) return;

    try {
      setLoading(true);

      if (step === 2 && galleryRef.current) {
        if (!(await galleryRef.current.saveStep())) return;
      }
      if (step === 3 && variationRef.current) {
        if (!(await variationRef.current.saveStep())) return;
      }
      if (step === 4 && metaRef.current) {
        if (!(await metaRef.current.saveStep())) return;
      }
      if (step === 5 && taxRef.current) {
        if (!(await taxRef.current.saveStep())) return;

        await api.post(`/admin-dashboard/publish-product/${productId}`);

        celebrateSuccess();
        toast.success("Product published successfully 🎉");

        setTimeout(onClose, 1200);
        return;
      }

      setStep((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (loading) return;
    setStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[9999] flex flex-col">
        {/* CONTENT AREA (FULL WIDTH) */}
        <div
          className="flex-1 overflow-y-auto px-8 py-8 pb-28
    bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100"
        >
          <div
            className="relative bg-white 
      rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] 
      border border-indigo-100 
      p-8 w-full transition-all duration-300"
          >
            {/* TOP ACCENT */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-t-2xl" />

            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Add Product</h2>
                <p className="text-sm text-gray-500">
                  Step {step} of {STEPS.length}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center 
    rounded-lg hover:bg-gray-100 transition text-gray-600 hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* CONTENT */}
            <div className="relative">
              {step === 1 && (
                <StepBasic setProductId={setProductId} setStep={setStep} />
              )}
              {step === 2 && (
                <StepGallery ref={galleryRef} productId={productId} />
              )}
              {step === 3 && (
                <StepVariation ref={variationRef} productId={productId} />
              )}
              {step === 4 && <StepMeta ref={metaRef} productId={productId} />}
              {step === 5 && <StepTax ref={taxRef} productId={productId} />}

              {/* FOOTER */}
              {/* FOOTER */}
              {step > 1 && (
                <div className="mt-10 pt-6 flex justify-between items-center border-t border-indigo-100 mb-16">
                  {/* 🔙 BACK BUTTON */}
                  <button
                    onClick={handleBack}
                    disabled={loading}
                    className="px-6 py-2 rounded-lg text-gray-600 hover:bg-indigo-50 transition duration-200 disabled:opacity-50"
                  >
                    ← Back
                  </button>

                  {/* ➡️ NEXT / PUBLISH BUTTON */}
                  <button
                    onClick={handleNext}
                    disabled={loading}
                    className={`
        px-8 py-2 rounded-lg text-white font-medium shadow-md
        transition-all duration-300 hover:scale-[1.02]
        ${
          step === 5
            ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:brightness-110"
            : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:brightness-110"
        }
      `}
                  >
                    {loading
                      ? step === 5
                        ? "Publishing..."
                        : "Saving..."
                      : step === 5
                        ? "Publish Product"
                        : "Next →"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🔥 WINDOWS 11 BOTTOM DOCK */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10000]">
          <div
            className="flex items-center gap-4 px-6 py-3 
  bg-white/80 backdrop-blur-xl 
  shadow-xl rounded-2xl border border-gray-200"
          >
            {STEPS.map((label, index) => {
              const tabStep = index + 1;
              const isActive = step === tabStep;
              const isCompleted = step > tabStep;

              return (
                <button
                  key={label}
                  disabled={isCompleted}
                  onClick={() => !isCompleted && setStep(tabStep)}
                  className={`
          flex flex-col items-center justify-center
          px-3 py-2 rounded-xl transition-all duration-300
          hover:scale-105 active:scale-95
          ${
            isActive
              ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg"
              : "text-gray-600 hover:bg-gray-100"
          }
          ${isCompleted ? "opacity-40 cursor-not-allowed" : ""}
        `}
                >
                  {/* STEP NUMBER / ICON */}
                  <div
                    className={`
            w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold
            ${
              isActive
                ? "bg-white text-indigo-600"
                : "bg-gray-200 text-gray-700"
            }
          `}
                  >
                    {tabStep}
                  </div>

                  {/* LABEL (VISIBLE) */}
                  <span className="text-[11px] mt-1 font-medium whitespace-nowrap">
                    {label}
                  </span>

                  {/* ACTIVE INDICATOR */}
                  {isActive && (
                    <div className="mt-1 w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
