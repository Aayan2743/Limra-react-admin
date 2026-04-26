import { useState, useMemo } from "react";
import api from "../api/axios";

import { useAuth } from "../auth/AuthContext";

export default function CartPanel({ cart = [], setCart }) {
  /* ================= CUSTOMER ================= */

    const { can,permissions } = useAuth();

  console.log("Cart Items:", cart);

  const [deliveryFee, setDeliveryFee] = useState(0);

  const [paymentLinkId, setPaymentLinkId] = useState(null);

  const [givenAmount, setGivenAmount] = useState("");
  const [balance, setBalance] = useState(0);

  const [showAddCustomerPopup, setShowAddCustomerPopup] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");

  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [pendingId, setPendingId] = useState(null);

  const [showPaymentDone, setShowPaymentDone] = useState(false);

  /* ================= OTP STATES ================= */
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingPayload, setPendingPayload] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ================= ADDRESS ================= */
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [isOnCallCustomer, setIsOnCallCustomer] = useState(false);

  // const [newAddress, setNewAddress] = useState({
  //   address_line: "",
  //   city: "",
  //   state: "",
  //   pincode: "",
  // });

  

  const [newAddress, setNewAddress] = useState({
    door_no: "",
    street: "",
    area: "",
    address_line: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("pay");

  const calculateBalance = (amount) => {
    const given = Number(amount) || 0;
    const bal = given - total;
    setBalance(bal);
  };

  /* ================= GST ================= */
  // const [gstEnabled, setGstEnabled] = useState(true);
  // const [gstPercent, setGstPercent] = useState(0);

  /* ================= HELPERS ================= */
  const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);
  const cleanAddressParts = (parts) => {
    const seen = new Set();
    return parts
      .map((part) => String(part ?? "").trim())
      .filter((part) => {
        if (!part) return false;
        const key = part.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };

  const formatAddressText = (addr = {}) => {
    const line1 = cleanAddressParts([
      addr.door_no,
      addr.street,
      addr.area,
      addr.address_line || addr.address,
    ]).join(", ");
    const line2 = cleanAddressParts([addr.city, addr.state, addr.pincode]).join(
      ", ",
    );
    const optionLabel = cleanAddressParts([
      addr.door_no,
      addr.street,
      addr.city,
      addr.pincode ? `PIN ${addr.pincode}` : "",
    ]).join(", ");

    return {
      line1: line1 || "Saved address",
      line2,
      optionLabel: optionLabel || line1 || line2 || "Saved address",
    };
  };

  /* ================= CALCULATIONS ================= */
  // const subtotal = useMemo(
  //   () => cart.reduce((s, i) => s + i.price * i.qty, 0),
  //   [cart],
  // );

  // const gst = useMemo(() => {
  //   if (!gstEnabled) return 0;
  //   return (subtotal * gstPercent) / 100;
  // }, [subtotal, gstEnabled, gstPercent]);

  // const total = Math.max(subtotal + gst - discount, 0);






const subtotal = useMemo(
  () =>
    cart.reduce((s, i) => {
      const price = Number(i.price) || 0;
      const qty = Number(i.qty) || 0;
      return s + price * qty;
    }, 0),
  [cart]
);

// ✅ NEW GST LOGIC (PER ITEM)
const gst = useMemo(() => {
  return cart.reduce((total, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;
    const gstPercent = Number(item.tax?.gst_percent) || 0;

    if (item.tax?.gst_enabled && item.tax?.gst_type === "exclusive") {
      return total + ((price * qty) * gstPercent) / 100;
    }

    return total;
  }, 0);
}, [cart]);


  const total = Math.max(subtotal + gst + Number(deliveryFee) - discount, 0);





  /* ================= QTY ================= */
  const increaseQty = (index) => {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index && item.qty < item.stock
          ? { ...item, qty: item.qty + 1 }
          : item,
      ),
    );
  };

  const decreaseQty = (index) => {
    setCart((prev) =>
      prev
        .map((item, i) => (i === index ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0),
    );
  };

  const checkPaymentStatus = async () => {

    alert("payment link  direct walkin")
    try {
      const res = await api.post("/admin-dashboard/check-payment-link", {
        link_id: paymentLinkId,
      });

      if (res.data.success) {
        alert("Payment Received");

        const orderRes = await api.post(
          "/admin-dashboard/pos/create-order-walking",
          pendingPayload,
        );

        if (orderRes.data.success) {
          const order = orderRes.data.data;

          printReceipt(order);

     // window.location.reload();
      
          setCart([]);
          setShowPaymentDone(false);
          setPendingPayload(null);
        }
      } else {
        alert("Payment not completed yet");
      }
    } catch (err) {
      alert("Failed to check payment");
    }
  };


  const checkPaymentStatusforOncall = async () => {
      alert("payment link on call")
    try {
      const res = await api.post("/admin-dashboard/check-payment-link", {
        link_id: paymentLinkId,
      });

      if (res.data.success) {
        alert("Payment Received");

        const orderRes = await api.post(
          "/admin-dashboard/pos/create-order-oncall-orders",
          pendingPayload,
        );

        if (orderRes.data.success) {
          const order = orderRes.data.data;

          printReceipt(order);

     // window.location.reload();
      
          setCart([]);
          setShowPaymentDone(false);
          setPendingPayload(null);
        }
      } else {
        alert("Payment not completed yet");
      }
    } catch (err) {
      alert("Failed to check payment");
    }
  };


  

  const productDiscount = useMemo(
  () => cart.reduce((sum, item) => sum + (item.discount || 0) * item.qty, 0),
  [cart]
);



const resetCartPanel = () => {

  setCart([]);

  setCustomer({
    name: "",
    phone: ""
  });

  setSelectedCustomer(null);   // ⭐ IMPORTANT
  setPendingPhone("");

  setAddresses([]);
  setSelectedAddress(null);
  setShowNewAddress(false);

  setNewAddress({
    door_no: "",
    street: "",
    area: "",
    address_line: "",
    city: "",
    state: "",
    pincode: ""
  });

  setDiscount(0);
  setPaymentMode("pay");

  setGivenAmount("");
  setBalance(0);

  setOtp("");
  setPendingPayload(null);
  setPendingId(null);

  setShowOtpModal(false);
  setShowPaymentDone(false);

  setOrderHistory([]);
};

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    // if (!customer.name || !isValidPhone(customer.phone)) {
    //   alert("Enter valid customer details");
    //   return;
    // }
    if (!customer.name) {
      alert("Enter customer name");
      return;
    }

    // ON CALL CUSTOMER → phone required
    if (isOnCallCustomer && !isValidPhone(customer.phone)) {
      alert("Enter valid phone number for on-call customer");
      return;
    }

    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    if (!isOnCallCustomer && paymentMode === "cash") {
      if (!givenAmount) {
        alert("Enter given amount");
        return;
      }

      if (Number(givenAmount) < total) {
        alert("Given amount is less than total");
        return;
      }
    }

    const selectedAddressObj = isOnCallCustomer
      ? addresses.find((a) => String(a.id) === String(selectedAddress))
      : null;

    let addressData = null;

    if (isOnCallCustomer) {
      if (selectedAddressObj) {
        addressData = selectedAddressObj;
      } else if (showNewAddress) {
        addressData = newAddress;
      }

      // ✅ FIXED VALIDATION (works for both old + new address)
      if (!addressData) {
        alert("Please provide complete address");
        return;
      }

      if (showNewAddress) {
        // New Address must have door, street, area
        if (
          !addressData.door_no ||
          !addressData.street ||
          !addressData.area ||
          !addressData.address_line ||
          !addressData.city ||
          !addressData.state ||
          !addressData.pincode
        ) {
          alert("Please provide complete address");
          return;
        }
      } else {
        // Existing address (old structure safe)
        if (
          !(addressData.address_line || addressData.address) ||
          !addressData.city ||
          !addressData.state ||
          !addressData.pincode
        ) {
          alert("Please provide complete address");
          return;
        }
      }
    }

    const payload = {
      customer_id: selectedCustomer?.id || null,
      customer_type: isOnCallCustomer ? "on call customer" : "normal customer",
      address_id: isOnCallCustomer ? selectedAddress || null : null,
      new_address: isOnCallCustomer && showNewAddress ? newAddress : null,

      payment_method: paymentMode,
      // paid_amount: Number(total.toFixed(2)),

      paid_amount:
        !isOnCallCustomer && paymentMode === "cash"
          ? Number(givenAmount)
          : Number(total.toFixed(2)),

      subtotal: subtotal,
      discount_total: discount,
      tax_total: gst,
      delivery_fee: deliveryFee,
      grand_total: total,

      customer_name: customer.name,
      customer_phone: customer.phone,

      // ✅ SAFE SNAPSHOT (no crash if old address)
      address_snapshot: isOnCallCustomer
        ? {
            door_no: addressData?.door_no || null,
            street: addressData?.street || null,
            area: addressData?.area || null,
            address: addressData?.address_line || addressData?.address,
            city: addressData?.city || null,
            state: addressData?.state || null,
            country: addressData?.country || "India",
            pincode: addressData?.pincode || null,
          }
        : null,

      items: cart.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variation_id,
        qty: item.qty,
          barcode_id: item.barcode_id ?? null
      })),
    };

    try {
      setLoading(true);

   

      // NORMAL CUSTOMER
      if (!isOnCallCustomer) {
        // CASH PAYMENT
        if (paymentMode === "cash") {
          const orderRes = await api.post(
            "/admin-dashboard/pos/create-order",
            payload,
          );

          if (orderRes.data.success) {
            alert(`Order Created: ${orderRes.data.data.invoice_number}`);

            const order = orderRes.data.data;
            console.log("ORDER DETAILS:", order);

            printReceipt(orderRes.data.data);

            console.log("Receipt printed, resetting cart panel...",orderRes.data.data);

            window.location.reload();
            setCart([]);
            setGivenAmount("");
            setBalance(0);
          } else {
            alert(orderRes.data.message);
          }

          return;
        }

        // PAYMENT LINK
        const paymentRes = await api.post(
          "/admin-dashboard/create-payment-link",
          {
            amount: total,
            name: customer.name,
            phone: customer.phone,
          },
        );

        if (paymentRes.data.success) {
          alert("Payment link sent to customer phone");

          setPendingPayload(payload);
          setPaymentLinkId(paymentRes.data.link_id);
          setShowPaymentDone(true);
        } else {
          alert(paymentRes.data.message || "Failed to create payment link");
        }
      }

      // ✅ ON-CALL CUSTOMER - OTP Flow
      else {
        console.log("SENDING OTP...");

        const otpRes = await api.post(
          "/admin-dashboard/send-order-otp",
          payload,
        );

        console.log("FULL RESPONSE:", otpRes);

        if (otpRes?.data?.success === true) {
          setPendingPayload(payload);
          setPendingId(otpRes.data.pending_id);
          setShowOtpModal(true);
           setOtp(otpRes.data.otp);
          alert("OTP sent to WhatsApp");
        } else {
          alert(otpRes?.data?.message || "Unexpected response");
        }
      }
    } catch (err) {
      console.log("🔥 ACTUAL ERROR:", err);
      alert("Failed to process order");

      console.log("🔥 FULL ERROR:", err);
      console.log("🔥 SERVER RESPONSE:", err.response?.data);

      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to process order",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      alert("Enter OTP");
      return;
    }

    try {
      setLoading(true);

      const verifyRes = await api.post("/admin-dashboard/verify-order-otp", {
        otp,
        pending_id: pendingId,
      });
      console.log(verifyRes.data.success);
      if (verifyRes.data.success) {
        // STEP 2 → AFTER VERIFY CREATE ORDER

        console.log("Name:", customer.name);
        console.log("Phone:", customer.phone);
        console.log("amount", total);
        const paymentRes = await api.post(
          "/admin-dashboard/create-payment-link",
          {
            amount: Math.round(total * 1),
            name: customer.name,
            phone: customer.phone,
          },
        );

        if (paymentRes.data.success) {
          alert("Payment link sent to customer phone");

          setPaymentLinkId(paymentRes.data.link_id);
          setShowPaymentDone(true);

          console.log("Payment Link:", paymentRes.data.payment_link);
        }

      
      } else {
        alert(verifyRes.data.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchCityState = async (pincode) => {
    if (pincode.length !== 6) return;

    try {
      const res = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`,
      );
      const data = await res.json();

      if (
        data?.[0]?.Status === "Success" &&
        data?.[0]?.PostOffice?.length > 0
      ) {
        const info = data[0].PostOffice[0];
        setNewAddress((prev) => ({
          ...prev,
          city: info.District || "",
          state: info.State || "",
        }));
      }
    } catch (err) {
      console.error("Pin API failed", err);
    }
  };



  const handleManualPaymentSuccessOncall = async () => {
  try {
    setLoading(true);

    const orderRes = await api.post(
      "/admin-dashboard/pos/create-order-manually-oncall",
      pendingPayload
    );

    if (orderRes.data.success) {

      const order = orderRes.data.data;

      alert(`Order Created: ${order.invoice_number}`);

      // 🔥 PRINT RECEIPT
      printReceipt(order);

  


       setCustomer({
        name: "",
        phone: "",
      });

      // window.location.reload();

      setCart([]);
      setShowOtpModal(false);
      setOtp("");
      setPendingPayload(null);
      setShowPaymentDone(false);

    } else {
      alert(orderRes.data.message);
    }

  } catch (err) {
    console.log(err.response?.data);
    alert("Order creation failed");
  } finally {
    setLoading(false);
  }
};


  const handleManualPaymentSuccessWalking = async () => {
  try {
    setLoading(true);

    const orderRes = await api.post(
      "/admin-dashboard/pos/create-order",
      pendingPayload
    );

    if (orderRes.data.success) {

      const order = orderRes.data.data;

      alert(`Order Created: ${order.invoice_number}`);

      // 🔥 PRINT RECEIPT
      printReceipt(order);

  


       setCustomer({
        name: "",
        phone: "",
      });

      // window.location.reload();

      setCart([]);
      setShowOtpModal(false);
      setOtp("");
      setPendingPayload(null);
      setShowPaymentDone(false);

    } else {
      alert(orderRes.data.message);
    }

  } catch (err) {
    console.log(err.response?.data);
    alert("Order creation failed");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="w-96 bg-white border-l flex flex-col h-screen">
      {/* HEADER */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Billing</h3>
      </div>

      {/* CUSTOMER */}
      <div className="p-4 border-b space-y-2">
        <input
          value={customer.phone}
          onChange={async (e) => {
            const val = e.target.value.replace(/\D/g, "");

            if (val.length <= 10) {
              setCustomer((p) => ({ ...p, phone: val }));
            }

           

            if (val.length === 10) {
              try {
                setSearchLoading(true);

                const res = await api.get(
                  `/admin-dashboard/pos/search-user?phone=${val}`,
                );

                if (res.data.success && res.data.data) {
                  const user = res.data.data;

                  setSelectedCustomer(user);

                  setCustomer((p) => ({
                    ...p,
                    name: user.name,
                  }));

                  setOrderHistory(user.orders || []);

                  if (user.addresses && user.addresses.length > 0) {
                    setAddresses(user.addresses);
                    setSelectedAddress(user.addresses[0].id);
                    setShowNewAddress(false);
                  } else {
                    setAddresses([]);
                    setSelectedAddress(null);
                    setShowNewAddress(true);
                  }
                } else {
                  setSelectedCustomer(null);
                  setAddresses([]);
                  setShowNewAddress(false);

                  setPendingPhone(val);
                  setShowAddCustomerPopup(true);
                }
              } catch (err) {
                setSelectedCustomer(null);
                setAddresses([]);
                setShowNewAddress(false);

                setPendingPhone(val);
                setShowAddCustomerPopup(true);
              } finally {
                setSearchLoading(false);
              }
            }
          }}
          placeholder="Mobile Number"
          className="w-full border rounded-lg px-3 py-2 text-sm"
          disabled={searchLoading}
        />

        <input
          value={customer.name}
          disabled={!!selectedCustomer}
          onChange={(e) => setCustomer((p) => ({ ...p, name: e.target.value }))}
          placeholder="Customer Name"
          className={`w-full border rounded-lg px-3 py-2 text-sm ${
            selectedCustomer ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
        />

          
  {
    can("pos.oncall") && (



        <div className="flex items-center justify-between border rounded-lg px-3 py-2">
          <span className="text-xs font-semibold text-gray-600">
            Customer Type
          </span>
          <button
            type="button"
            onClick={() => {
              setIsOnCallCustomer((prev) => {
                const next = !prev;
                if (!next) setShowNewAddress(false);
                return next;
              });
            }}
            className={`text-xs px-3 py-1 rounded-full font-semibold ${
              isOnCallCustomer
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {isOnCallCustomer ? "On Call Customer" : "Normal Customer"}
          </button>
        </div>
        )
}


        {orderHistory.length > 0 && (
          <button
            onClick={() => setShowOrderHistory(true)}
            className="text-sm text-blue-600 underline"
          >
            View Purchase History ({orderHistory.length})
          </button>
        )}

        {/* ADDRESS UI */}
        {selectedCustomer && isOnCallCustomer && (
          <div className="mt-3 space-y-3">
            {/* EXISTING ADDRESSES */}
            {addresses.length > 0 && !showNewAddress && (
              <>
                <label className="text-xs font-semibold text-gray-600">
                  Select Delivery Address
                </label>

                <select
                  value={selectedAddress || ""}
                  onChange={(e) => setSelectedAddress(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                >
                  {addresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {formatAddressText(addr).optionLabel}
                    </option>
                  ))}
                </select>

                {selectedAddress &&
                  (() => {
                    const selectedAddr = addresses.find(
                      (a) => String(a.id) === String(selectedAddress),
                    );
                    const formatted = formatAddressText(selectedAddr || {});

                    return (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                        <p className="text-sm font-medium text-gray-800">
                          {formatted.line1}
                        </p>
                        {formatted.line2 && (
                          <p className="mt-1 text-xs text-gray-500">
                            {formatted.line2}
                          </p>
                        )}
                      </div>
                    );
                  })()}

                <div className="flex gap-4 text-xs">
                  <button
                    onClick={() => setShowNewAddress(true)}
                    className="text-blue-600 underline"
                  >
                    + Add New
                  </button>

                  <button
                    onClick={() => {
                      setSelectedAddress(null);
                      setAddresses([]);
                      setShowNewAddress(true);
                    }}
                    className="text-gray-500 underline"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* NEW ADDRESS FORM */}
            {showNewAddress && (
              <div className="p-3 border rounded-lg bg-gray-50 space-y-3">
                <input
                  placeholder="Door No"
                  value={newAddress.door_no}
                  onChange={(e) =>
                    setNewAddress({
                      ...newAddress,
                      door_no: e.target.value,
                    })
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                />

                <input
                  placeholder="Street"
                  value={newAddress.street}
                  onChange={(e) =>
                    setNewAddress({
                      ...newAddress,
                      street: e.target.value,
                    })
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                />

                <input
                  placeholder="Area"
                  value={newAddress.area}
                  onChange={(e) =>
                    setNewAddress({
                      ...newAddress,
                      area: e.target.value,
                    })
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                />

                <input
                  placeholder="Address Line"
                  value={newAddress.address_line}
                  onChange={(e) =>
                    setNewAddress({
                      ...newAddress,
                      address_line: e.target.value,
                    })
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) =>
                      setNewAddress({
                        ...newAddress,
                        city: e.target.value,
                      })
                    }
                    className="border rounded px-3 py-2 text-sm"
                  />

                  <input
                    placeholder="State"
                    value={newAddress.state}
                    onChange={(e) =>
                      setNewAddress({
                        ...newAddress,
                        state: e.target.value,
                      })
                    }
                    className="border rounded px-3 py-2 text-sm"
                  />
                </div>
                <input
                  placeholder="Pincode"
                  maxLength={6}
                  value={newAddress.pincode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");

                    setNewAddress((prev) => ({
                      ...prev,
                      pincode: value,
                    }));

                    // ✅ CALL API WHEN 6 DIGITS
                    if (value.length === 6) {
                      fetchCityState(value);
                    }
                  }}
                  className="w-full border rounded px-3 py-2 text-sm"
                />

                {/* ACTION BUTTONS */}
                <div className="flex justify-end gap-3 text-xs">
                  {addresses.length > 0 && (
                    <button
                      onClick={() => setShowNewAddress(false)}
                      className="text-gray-500 underline"
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    onClick={async () => {
                      if (
                        !newAddress.door_no ||
                        !newAddress.street ||
                        !newAddress.area ||
                        !newAddress.address_line ||
                        !newAddress.city ||
                        !newAddress.state ||
                        newAddress.pincode.length !== 6
                      ) {
                        alert("Please fill all address fields properly");
                        return;
                      }

                      try {
                        const payload = {
                          user_id: selectedCustomer?.id,
                          name: customer.name,
                          phone: customer.phone,
                          door_no: newAddress.door_no,
                          street: newAddress.street,
                          area: newAddress.area,
                          address: newAddress.address_line,
                          city: newAddress.city,
                          state: newAddress.state,
                          pincode: newAddress.pincode,
                        };

                        const res = await api.post(
                          "/admin-dashboard/save-address",
                          payload,
                        );

                        if (res.data.success) {
                          const savedAddress = res.data.data; // backend must return full address object

                          // Add to dropdown
                          setAddresses((prev) => [...prev, savedAddress]);

                          // Select newly saved address
                          setSelectedAddress(savedAddress.id);

                          setShowNewAddress(false);

                          // Clear form
                          setNewAddress({
                            door_no: "",
                            street: "",
                            area: "",
                            address_line: "",
                            city: "",
                            state: "",
                            pincode: "",
                          });

                          alert("Address saved successfully");
                        } else {
                          alert(res.data.message);
                        }
                      } catch (err) {
                        alert(
                          err.response?.data?.message ||
                            "Failed to save address",
                        );
                      }
                    }}
                    className="text-green-600 underline font-semibold"
                  >
                    Save Address
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ITEMS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.map((item, i) => (
          <div
            key={i}
            className="border rounded-xl p-3 flex justify-between items-center"
          >
            {/* <div>
              <p className="font-medium text-sm">{item.product_name}</p>
              <p className="text-xs text-gray-500">{item.variation_name}</p>
              <p className="text-sm mt-1 font-semibold">₹ SDSDSDSAD {item.price}</p>
              <p className="text-sm mt-1 font-semibold">₹ {item.MRP}</p>
              <p className="text-sm mt-1 font-semibold">₹ {item.discount}</p>
            </div> */}

      <div>
  <p className="font-medium text-sm">{item.product_name}</p>
  <p className="text-xs text-gray-500">{item.variation_name}</p>

  {/* <p className="text-sm mt-1 font-semibold text-green-700">
    ₹ {item.price}
  </p> */}


    {/* GST TAG */}
{item.tax?.gst_enabled && item.tax?.gst_type === "exclusive" && (
  <p className="text-[10px] text-green-600">
    + GST {item.tax.gst_percent}%
  </p>
)}

{/* FINAL PRICE */}
<p className="text-sm mt-1 font-semibold text-green-700">
  ₹{" "}
  {(() => {
    const price = Number(item.price) || 0;
    const gstPercent = Number(item.tax?.gst_percent) || 0;

    const finalPrice =
      item.tax?.gst_enabled && item.tax?.gst_type === "exclusive"
        ? price + (price * gstPercent) / 100
        : price;

    return finalPrice.toFixed(2);
  })()}
</p>

  {item.mrp && (
    <p className="text-xs text-gray-400 line-through">
      ₹ {item.mrp}
    </p>
  )}

  {item.discount > 0 && (
    <p className="text-xs text-red-500">
      Discount: ₹ {item.discount}
    </p>
  )}



</div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => decreaseQty(i)}
                className="h-8 w-8 border rounded-lg"
              >
                −
              </button>
              <span>{item.qty}</span>
              <button
                onClick={() => increaseQty(i)}
                className="h-8 w-8 border rounded-lg"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* SUMMARY */}
      <div className="border-t p-4 space-y-3 text-sm">
        <Row label="Subtotal" value={`₹ ${subtotal.toFixed(2)}`} />

        <div className="flex justify-between items-center">
          <span>Bill Discount</span>
          <input
            type="number"
            min={0}
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className="w-24 border rounded px-2 py-1 text-right"
          />
        </div>

        <div className="flex justify-between items-center">
  <span>Delivery Fee</span>

  <input
    type="number"
    min={0}
    value={deliveryFee}
    onChange={(e) => setDeliveryFee(Number(e.target.value))}
    className="w-24 border rounded px-2 py-1 text-right"
  />
</div>


        <div className="flex justify-between items-center">
  <span>Product Discount</span>
  <span className="text-red-600 font-semibold">
    ₹ {productDiscount.toFixed(2)}
  </span>
</div>

        <Row label="GST" value={`₹ ${gst.toFixed(2)}`} />
        <Row label="Total" value={`₹ ${total.toFixed(2)}`} />
      </div>

      {/* PAYMENT */}
      {/* PAYMENT */}
      <div className="p-4 border-t">
        {!isOnCallCustomer && (
          <div className="space-y-2 mb-3">
            <label className="text-xs font-semibold text-gray-600">
              Payment Method
            </label>

            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="pay">Payment Link</option>
              <option value="cash">Cash</option>
            </select>
          </div>
        )}

        {!isOnCallCustomer && paymentMode === "cash" && (
          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-center">
              <span>Given Amount</span>

              <input
                type="number"
                value={givenAmount}
                onChange={(e) => {
                  setGivenAmount(e.target.value);
                  calculateBalance(e.target.value);
                }}
                className="w-28 border rounded px-2 py-1 text-right"
              />
            </div>

            <div className="flex justify-between items-center">
              <span>Balance</span>

              <span
                className={`font-semibold ${
                  balance < 0 ? "text-red-600" : "text-green-700"
                }`}
              >
                ₹ {balance.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <button
          // disabled={
          //   cart.length === 0 ||
          //   !customer.name ||
          //   !isValidPhone(customer.phone) ||
          //   loading
          // }

          disabled={
            cart.length === 0 ||
            !customer.name ||
            (isOnCallCustomer && !isValidPhone(customer.phone)) ||
            loading
          }
          onClick={handleSubmit}
          className="w-full bg-green-700 text-white py-4 rounded-2xl disabled:opacity-40 flex items-center justify-center gap-2 font-semibold"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            `Proceed to Pay ₹ ${total.toFixed(2)}`
          )}
        </button>
      </div>

      {/* OTP MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-80 space-y-4">
            <h3 className="text-lg font-semibold text-center">Enter OTP</h3>

            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full border rounded px-3 py-2 text-center"
              disabled={loading}
            />
            
            <div className="flex justify-between">
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-gray-500 disabled:opacity-50"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCustomerPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-80 text-center space-y-4">
            <h3 className="text-lg font-semibold">Customer Not Found</h3>

            <p className="text-sm text-gray-600">
              Add this customer with phone <br />
              <b>{pendingPhone}</b> ?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowAddCustomerPopup(false);
                  setCustomer((prev) => ({ ...prev, phone: "" }));
                }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  try {
                    const res = await api.post(
                      "/admin-dashboard/customers/store",
                      {
                        phone: pendingPhone,
                        name: "New Customer",
                      },
                    );

                    if (res.data.success) {
                      const user = res.data.data;

                      setSelectedCustomer(user);

                      setCustomer({
                        phone: user.phone,
                        name: user.name,
                      });
                      setOrderHistory([]);
                      setAddresses([]);
                      setSelectedAddress(null);

                      setShowAddCustomerPopup(false);
                    }
                  } catch (err) {
                    alert("Failed to create customer");
                  }
                }}
                className="px-4 py-2 bg-green-700 text-white rounded"
              >
                Yes Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* manulay confirmation */}
      {showPaymentDone && (
        <div className="p-4 border-t space-y-2">
          {/* <button
            onClick={checkPaymentStatus}
            className="w-full bg-blue-600 text-white py-3 rounded-xl"
          >
            Check Payment dfdfdfdfd
          </button> */}

        {isOnCallCustomer ? (
            <button
              onClick={checkPaymentStatusforOncall}
              className="w-full bg-purple-600 text-white py-3 rounded-xl"
            >
              Verify On-Call Payment
            </button>
          ) : (
            <button
              onClick={checkPaymentStatus}
              className="w-full bg-blue-600 text-white py-3 rounded-xl"
            >
              Check Payment
            </button>
          )}




           {isOnCallCustomer ? (
             <button
            onClick={handleManualPaymentSuccessOncall}
            className="w-full bg-green-700 text-white py-3 rounded-xl"
          >
            Payment Done  On Call (Manual)
          </button>
          ) : (
             <button
            onClick={handleManualPaymentSuccessWalking}
            className="w-full bg-green-700 text-white py-3 rounded-xl"
          >
            Payment Done Walking (Manual)
          </button>
          )}

        
        </div>
      )}

      {showOrderHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl p-6">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Purchase History</h3>
              <button
                onClick={() => setShowOrderHistory(false)}
                className="text-gray-500 text-lg"
              >
                ✕
              </button>
            </div>

            {orderHistory.map((order) => (
              <div
                key={order.id}
                className="border rounded-xl p-4 mb-4 bg-gray-50"
              >
                {/* ORDER HEADER */}
                <div className="flex justify-between mb-3">
                  <div>
                    <p className="font-semibold">
                      Invoice: {order.invoice_number}
                    </p>
                    <p className="text-xs text-gray-500">Date: {order.date}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-green-700">
                      ₹ {order.grand_total}
                    </p>
                  </div>
                </div>

                {/* PRODUCTS */}
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between border-b pb-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.qty}</p>
                      </div>

                      <div className="font-semibold">₹ {item.total}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {orderHistory.length === 0 && (
              <p className="text-center text-gray-500">
                No purchase history found
              </p>
            )}
          </div>
        </div>
      )}

      {/* FULL SCREEN LOADER */}
      {(loading || searchLoading) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-700 font-medium">
              {searchLoading ? "Searching customer..." : "Processing..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const printReceipt = (order) => {

console.log("PRINTING RECEIPT FOR ORDER:", order);

const dateTime = order.created_at
  ? new Date(order.created_at).toLocaleString()
  : new Date().toLocaleString();

let customer = order.shipping_address_snapshot || {};

const customerName = customer.name || "Walk-in Customer";
const customerPhone = customer.phone || "-";

// alert(customer.name)

console.log("Customer Info for Receipt:", customer);




const address = [
customer.address,
customer.city,
customer.state,
customer.pincode
]
.filter(Boolean)
.join(", ");






const itemsHtml = (order.items || [])
.map((item) => {

  const name =
    item.product_name.length > 18
      ? item.product_name.substring(0, 18) + ".."
      : item.product_name;

  const qty = Number(item.qty ?? item.quantity ?? 1);
  const HSN = item.hsn ?? item.hsn ?? N/A;
  const discountPerItem = Number(item.total_discount ?? 0);
  const total = Number(item.total ?? 0);

  const lineDiscount = discountPerItem ;
  const lineAmount = total + discountPerItem;

  return `
<tr>
<td class="item">${name}</td>
<td class="item">${HSN}</td>
<td class="right qty">${qty}</td>
<td class="right mrp">${lineAmount.toFixed(2)}</td>
<td class="right disc">₹${lineDiscount.toFixed(2)}</td>
<td class="right amt">₹${total.toFixed(2)}</td>
</tr>
`;
})
.join("");

const content = `
<div class="receipt">

  <h3 class="center">Sri Devi Herbals</h3>
  <p class="center">Thank You Visit Again</p>

  <hr>

  <p>Invoice : ${order.invoice_number}</p>
  <p>Date : ${dateTime}</p>

  <hr>

  <table>
    <thead>
      <tr>
<th class="item">Item</th>
<th class="item">HSN</th>
<th class="right qty">Qty</th>
<th class="right mrp">MRP</th>
<th class="right disc">Disc</th>
<th class="right amt">Amt</th>
</tr>
    </thead>

    <tbody>
      ${itemsHtml}
    </tbody>

  </table>

  <hr>

  <table>


    <tr>
      <td>Subtotal</td>
      <td class="right">₹${order.subtotal}</td>
    </tr>


    <tr>
      <td>Subtotal</td>
      <td class="right">₹${order.subtotal}</td>
    </tr>

    <tr>
      <td>Product Discount  </td>
      <td class="right">₹${order.discount_total ?? 0}</td>
    </tr>

    <tr>
      <td>Bill Discount</td>
      <td class="right">₹${order.billed_discount ?? 0}</td>
    </tr>

    <tr>
      <td>GST</td>
      <td class="right">₹${order.tax_total ?? 0}</td>
    </tr>

    <tr class="total">
      <td><b>Total</b></td>
      <td class="right"><b>₹${order.grand_total}</b></td>
    </tr>

  </table>

  <hr>

  <p class="center">Powered by Sri Devi Herbals POS</p>

</div>
`;

const printFrame = document.createElement("iframe");
printFrame.style.position = "fixed";
printFrame.style.right = "0";
printFrame.style.bottom = "0";
printFrame.style.width = "0";
printFrame.style.height = "0";
printFrame.style.border = "0";

document.body.appendChild(printFrame);

const doc = printFrame.contentWindow.document;

doc.open();
doc.write(
`
<html>
<head>

<style>

body{
font-family: monospace;
width:78mm;
margin:0;
padding:8px;
font-size:12px;
}

.header{
text-align:center;
}

.store{
font-size:16px;
font-weight:bold;
}

.tagline{
font-size:11px;
margin-top:2px;
}

.meta{
margin-top:6px;
font-size:11px;
}

table{
width:100%;
border-collapse:collapse;
table-layout:fixed;
margin-top:5px;
}

th, td{
padding:3px 2px;
white-space:nowrap;
}

.item{
width:32%;
overflow:hidden;
text-overflow:ellipsis;
}


.hsn{
width:15%;
overflow:hidden;
text-overflow:ellipsis;
}

.qty{
width:8%;
}

.mrp{
width:19%;
}

.disc{
width:19%;
}

.amt{
width:19%;
}

.right{
text-align:right;
}

hr{
border:none;
border-top:1px dashed black;
margin:6px 0;
}

.summary td{
padding:2px 0;
}

.total{
font-weight:bold;
border-top:1px dashed black;
}

.footer{
text-align:center;
font-size:10px;
margin-top:6px;
}

</style>

</head>

<body>

<div class="header">
<div class="store">Sri Devi Herbals</div>
<div class="tagline">Thank You Visit Again</div>
</div>

<hr>

<div class="meta">
Invoice : ${order.invoice_number}<br>
Date : ${dateTime}<br>
Customer : ${customerName}<br>
Phone : ${customerPhone}<br>
${address ? `Address : ${address}<br>` : ""}
Payment : ${order.payment_method ?? "Cash"}
</div>

<hr>

<table>
<thead>
<tr>
<th class="item">Item</th>
<th class="hsn">HSN</th>
<th class="right qty">Qty</th>
<th class="right mrp">MRP</th>
<th class="right disc">Disc</th>
<th class="right amt">Amt</th>
</tr>
</thead>

<tbody>
${itemsHtml}
</tbody>
</table>

<hr>

<table class="summary">

<tr>
<td>Subtotal</td>
<td class="right">₹${order.subtotal}</td>
</tr>

<tr>
<td>Product Discount (-)</td>
<td class="right">₹${order.discount_total ?? 0}</td>
</tr>

<tr>
<td>Bill Discount (-)</td>
<td class="right">₹${order.billed_discount ?? 0}</td>
</tr>

<tr>
<td>GST</td>
<td class="right">₹${order.tax_total ?? 0}</td>
</tr>
<tr>
<td>Delivery Fee (+)</td>
<td class="right">₹${Number(order.delivery_charge ?? 0).toFixed(2)}</td>
</tr>

<tr class="total">
<td>Total</td>
<td class="right">₹${order.grand_total}</td>
</tr>

</table>

<hr>

<div class="footer">
Powered by Sri Devi Herbals POS
</div>

</body>

</html>
`



  
);

doc.close();

printFrame.contentWindow.focus();
printFrame.contentWindow.print();

setTimeout(() => {
  document.body.removeChild(printFrame);
}, 1000);
};