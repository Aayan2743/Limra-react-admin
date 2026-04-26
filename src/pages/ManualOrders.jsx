import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import AccessDenied from "./components/AccessDenied";
export default function ManualOrders() {
  const navigate = useNavigate();

    const { can,permissions } = useAuth();
  console.log("User Permissions dfdfdfdf:",can);
  console.log("User Permissions array:",permissions);

const [ratePage, setRatePage] = useState(1);
const ratePerPage = 5;

const [showRateModal, setShowRateModal] = useState(false);
const [rates, setRates] = useState([]);
const [rateLoading, setRateLoading] = useState(false);

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  const [showCourierModal, setShowCourierModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState("");
  const [courierLoading, setCourierLoading] = useState(false);

  const [dimensions, setDimensions] = useState({
    length: "",
    breadth: "",
    height: "",
    weight: "",
  });

  useEffect(() => {
    fetchOrders();
  }, [page, search, filterStatus, filterType]);




const fetchRates = async (order) => {

  console.log("Fetching rates for order ID:", order);
  try {
   setError(null);  
    setSelectedOrder(order);  
    setRateLoading(true);
    setShowRateModal(true);

    const res = await api.post("/admin-dashboard/rate-card", {
      order_id: order.id
    });

    if (!res.data.success) {
      setError(res.data.message);
      setRates([]);
      return;
    }

    setRates(res.data.data.data || []);

  } catch (err) {

    setError(err.response?.data?.message || "Failed to fetch courier rates");

  } finally {

    setRateLoading(false);

  }
};

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `/admin-dashboard/calling/orders?page=${page}&search=${search}`;
      
      if (filterStatus) {
        url += `&status=${filterStatus}`;
      }

      console.log("Fetching from URL:", url);

      const res = await api.get(url);

      if (res.data.success) {
        let filteredData = res.data.data.data;

        // Client-side filtering for customer type
        if (filterType) {
          filteredData = filteredData.filter((order) => {
            const isWalkIn = !order.shipping_address_snapshot?.address;
            if (filterType === "walk-in") {
              return isWalkIn;
            } else if (filterType === "on-call") {
              return !isWalkIn;
            }
            return true;
          });
        }

        setOrders(filteredData);
        setLastPage(res.data.data.last_page);
      } else {
        setError("Failed to fetch orders");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const isNormalCustomer = (order) => {
    return !order.shipping_address_snapshot?.address;
  };

  const openCourierModal = async (order) => {
    if (isNormalCustomer(order)) {
      setError("Cannot send courier for walk-in customers");
      return;
    }

    setSelectedOrder(order);
    setShowCourierModal(true);
    setDimensions({ length: "", breadth: "", height: "", weight: "" });

    try {
      setCourierLoading(true);
      const res = await api.get("/admin-dashboard/enabled-couriers");

      if (res.data.success) {
        setCouriers(res.data.data);
      } else {
        setError("Failed to load couriers");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load couriers");
    } finally {
      setCourierLoading(false);
    }
  };

  const submitCourier = async () => {
    if (!selectedCourier) {
      setError("Please select a courier");
      return;
    }

    if (!dimensions.length || !dimensions.breadth || !dimensions.height || !dimensions.weight) {
      setError("Please fill all dimension fields");
      return;
    }

    try {
      setCourierLoading(true);
      setError(null);

      const res = await api.post(
        `/admin-dashboard/send-courier/${selectedOrder.id}`,
        {
          courier: selectedCourier,
          ...dimensions,
        },
      );

      if (res.data.success) {
        setSuccess("Courier assigned successfully");
        setShowCourierModal(false);
        setSelectedCourier("");
        fetchOrders();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(res.data.message || "Failed to assign courier");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign courier");
    } finally {
      setCourierLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      created: "bg-yellow-100 text-yellow-700 border border-yellow-300",
      shipped: "bg-blue-100 text-blue-700 border border-blue-300",
      completed: "bg-green-100 text-green-700 border border-green-300",
      cancelled: "bg-red-100 text-red-700 border border-red-300",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          styles[status] || "bg-gray-100 text-gray-700 border border-gray-300"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // const getCustomerTypeBadge = (order) => {
  //   const isNormal = isNormalCustomer(order);
  //   return (
  //     <span
  //       className={`px-3 py-1 rounded-full text-xs font-semibold ${
  //         isNormal
  //           ? "bg-purple-100 text-purple-700 border border-purple-300"
  //           : "bg-cyan-100 text-cyan-700 border border-cyan-300"
  //       }`}
  //     >
  //       {isNormal ? "Walk-in" : "On-Call"}
  //     </span>
  //   );
  // };


  const getCustomerTypeBadge = (order) => {

  const type = order?.order_from;

  let label = "N/A";
  let style = "bg-gray-100 text-gray-600 border border-gray-300";

  if (type === "whatsapp") {
    label = "WhatsApp";
    style = "bg-green-100 text-green-700 border border-green-300";
  }

  if (type === "On-Call") {
    label = "On-Call";
    style = "bg-cyan-100 text-cyan-700 border border-cyan-300";
  }

  if (type === "walk-in") {
    label = "Walk-in";
    style = "bg-purple-100 text-purple-700 border border-purple-300";
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
};

const shipNow = async (orderId, courierId) => {


  // alert("Shipping with courier ID: " + orderId);

  // return;
  try {

    const res = await api.post("/admin-dashboard/assign-courier", {
      order_id: orderId,
      courier_id: courierId
    });

    if (res.data.success) {

      setSuccess("Courier assigned successfully");
      setShowRateModal(false);
      fetchOrders();

    } else {

      setError(res.data.message);

    }

  } catch (err) {

    console.log(err.response?.data);

    setError(
      err.response?.data?.message ||
      "Failed to assign courier"
    );

  }

};


const resetCourier = async (orderId) => {

  try {

    const res = await api.post(`/admin-dashboard/reset-courier/${orderId}`);

    if(res.data.success){

      setSuccess("Courier removed successfully");

      fetchOrders();

    }

  } catch (err){

    setError("Failed to remove courier");

  }

};


const cancelOrder = async (orderId) => {
  try {

    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    const res = await api.post(`/admin-dashboard/cancel-courier/${orderId}`);

    if (res.data.success) {
      setSuccess("Order cancelled successfully");
      fetchOrders();
    } else {
      setError(res.data.message);
    }

  } catch (err) {
    setError("Cancel failed");
  }
};

const indexOfLastRate = ratePage * ratePerPage;
const indexOfFirstRate = indexOfLastRate - ratePerPage;

const currentRates = rates.slice(indexOfFirstRate, indexOfLastRate);

const totalRatePages = Math.ceil(rates.length / ratePerPage);



  if (!can("pos_orders.view")) {
    return (
      <AccessDenied />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manual Orderss</h1>
        {/* <p className="text-gray-600 mt-1">Manage and track all manual orders</p> */}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <span className="text-red-700 font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-xl"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <span className="text-green-700 font-medium">{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-600 hover:text-green-800 text-xl"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Bar & Filters */}
      <div className="mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by invoice, name, or phone..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>

        {/* Status Filter */}
        <div className="min-w-max">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setPage(1);
              setFilterStatus(e.target.value);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">All Status</option>
            <option value="created">Created</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Customer Type Filter */}
        <div className="min-w-max">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
          <select
            value={filterType}
            onChange={(e) => {
              setPage(1);
              setFilterType(e.target.value);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">All Types</option>
            <option value="walk-in">Walk-in</option>
            <option value="on-call">On-Call</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {(search || filterStatus || filterType) && (
          <button
            onClick={() => {
              setSearch("");
              setFilterStatus("");
              setFilterType("");
              setPage(1);
            }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 mt-4">Loading orders...</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && orders.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Invoice</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Employee</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{order.invoice_number}</td>
                    <td className="px-4 py-3 text-gray-700">{order.customer_name}</td>
                    <td className="px-4 py-3 text-gray-700">{order.customer_phone}</td>
                    <td className="px-4 py-3">{getCustomerTypeBadge(order)} </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">₹ {parseFloat(order.paid_amount).toFixed(2)}</td>
                    {/* <td className="px-4 py-3">{getStatusBadge(order.status)} </td> */}


                    <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(order.status)}

                      {order.tracking_number && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Tracking:</span> {order.awb_no}
                        </div>
                      )}

                      {order.shipping_partner && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Partner:</span> {order.shipping_partner}
                        </div>
                      )}
                    </div>
                  </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{order?.user?.name || "—"}</td>
                    <td className="px-4 py-3 flex gap-2">

  <button
    onClick={() => navigate(`/calling/order/${order.id}`)}
    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-medium transition"
  >
    View
  </button>

  {/* Step 1: Send courier */}
{order.status === "created" && !isNormalCustomer(order) && 
  can("pos_orders.courier") && (
    <button
      onClick={() => openCourierModal(order)}
      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition"
    >
      Courier
    </button>
)}

  {/* Step 2: After shipped show rate card */}


{order.status === "shipped" &&
  !order.awb_no &&
  can("pos_orders.ratecard") && (
    <button
      onClick={() => fetchRates(order)}
      className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition"
    >
      Rate Card
    </button>
)}

  {/* {order.status === "shipped" && !order.awb_no &&  (
  <button
    onClick={() => resetCourier(order.id)}
    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs"
  >
    Change Courier
  </button>
)} */}


{order.status === "shipped" &&
  !order.awb_no &&
  can("pos_orders.change_courier") && (
    <button
      onClick={() => resetCourier(order.id)}
      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs"
    >
      Change Courier
    </button>
)}

  {order.status === "shipped" && order.awb_no &&  (
  <button
    onClick={() => cancelOrder(order.id)}
    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs"
  >
    Cancel Order 
  </button>
)}

</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && lastPage > 1 && (
        <div className="mt-6 flex justify-center items-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            ← Previous
          </button>

          <div className="flex gap-1">
            {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-2 rounded-lg font-medium transition ${
                  page === p
                    ? "bg-blue-500 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPage(Math.min(lastPage, page + 1))}
            disabled={page === lastPage}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next →
          </button>
        </div>
      )}

      {/* Courier Modal */}
      {showCourierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Assign Courier</h3>
              <button
                onClick={() => setShowCourierModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Courier Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Courier
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedCourier}
                  onChange={(e) => setSelectedCourier(e.target.value)}
                  disabled={courierLoading}
                >
                  <option value="">
                    {courierLoading ? "Loading couriers..." : "Choose a courier"}
                  </option>
                  {couriers.map((courier) => (
                    <option key={courier.code} value={courier.code}>
                      {courier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Package Dimensions
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "length", label: "Length (cm)" },
                    { key: "breadth", label: "Breadth (cm)" },
                    { key: "height", label: "Height (cm)" },
                    { key: "weight", label: "Weight (kg)" },
                  ].map(({ key, label }) => (
                    <input
                      key={key}
                      type="number"
                      placeholder={label}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={dimensions[key]}
                      onChange={(e) =>
                        setDimensions({
                          ...dimensions,
                          [key]: e.target.value,
                        })
                      }
                      disabled={courierLoading}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCourierModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
                disabled={courierLoading}
              >
                Cancel
              </button>

              <button
                onClick={submitCourier}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={courierLoading}
              >
                {courierLoading ? "Assigning..." : "Assign Courier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRateModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">

      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Courier Rate Card</h3>
        <button onClick={() => setShowRateModal(false)}>✕</button>
      </div>

      <div className="p-6">

        {rateLoading && (
          <div className="text-center py-10">Loading courier rates...</div>
        )}

          {error && (
  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
    {error}
  </div>
)}

        {!rateLoading && (



          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Courier Partner</th>
                <th className="px-4 py-3 text-left">Estimated Delivery</th>
                <th className="px-4 py-3 text-left">Chargeable Weight</th>
                <th className="px-4 py-3 text-left">Charges</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {currentRates.map((courier) => (
                <tr key={courier.id} className="border-b">

                  <td className="px-4 py-4 flex items-center gap-3">
                    <img src={courier.image} className="w-10 h-10 object-contain"/>
                    <div>
                      <div className="font-semibold">{courier.name}</div>
                      <div className="text-xs text-gray-500">Domestic</div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {courier.estimated_delivery || "--"}
                  </td>

                  <td className="px-4 py-4">
                    {courier.minimum_chargeable_weight}
                  </td>

                  <td className="px-4 py-4 font-semibold">
                    ₹ {courier.total_charges.toFixed(2)}
                  </td>

                  <td className="px-4 py-4">
                 <button
                    onClick={() => shipNow(selectedOrder.tracking_number, courier.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs"
                  >
                    Ship Now 
                  </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalRatePages > 1 && (
  <div className="mt-6 flex justify-center items-center gap-2">

    <button
      onClick={() => setRatePage(Math.max(1, ratePage - 1))}
      disabled={ratePage === 1}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      ← Prev
    </button>

    {Array.from({ length: totalRatePages }, (_, i) => i + 1).map((p) => (
      <button
        key={p}
        onClick={() => setRatePage(p)}
        className={`px-3 py-1 rounded ${
          ratePage === p
            ? "bg-blue-600 text-white"
            : "border"
        }`}
      >
        {p}
      </button>
    ))}

    <button
      onClick={() => setRatePage(Math.min(totalRatePages, ratePage + 1))}
      disabled={ratePage === totalRatePages}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Next →
    </button>

  </div>
)}

      </div>

    </div>
  </div>
)}
    </div>
  );
}
