
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { addDoc, collection } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading, signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [type, setType] = useState<"in" | "out">("in");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setStatus("idle");

    const formData = new FormData(e.currentTarget);

    // Explicitly construct the record to handle conditional fields better
    const record = {
      location: formData.get("location"),
      goodsName: formData.get("goodsName"),
      quantity: Number(formData.get("quantity")),
      type,
      fromLocation: type === "in" ? formData.get("fromLocation") : null,
      toLocation: type === "out" ? formData.get("toLocation") : null,
      timeArrived: type === "in" ? formData.get("timeArrived") : null,
      timeLeft: type === "out" ? formData.get("timeLeft") : null,
      vehicleNumber: formData.get("vehicleNumber"),
      driverName: formData.get("driverName"),
      driverContact: formData.get("driverContact"),
      comments: formData.get("comments"),
      userName: user.displayName || user.email,
      userEmail: user.email,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "records"), record);
      setStatus("success");
      (e.target as HTMLFormElement).reset();
      setType("in"); // Reset type default
    } catch (error) {
      console.error("Error adding document: ", error);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Welcome to GoodsTracker</h1>
        <p className="text-gray-500 max-w-lg mb-8 text-lg">
          Track vehicle goods simply and efficiently.
        </p>
        <button
          onClick={signIn}
          className="bg-black text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-gray-800 transition-colors shadow-lg"
        >
          Sign In to Continue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Add New Record</h1>
        <p className="text-gray-500 mt-2">
          Enter details of goods moving in or out.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 border border-gray-200 rounded-xl shadow-sm space-y-8">

        {/* Status Messages */}
        {status === "success" && (
          <div className="rounded-md bg-green-50 p-4 mb-6 border border-green-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Record added successfully!</p>
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-md bg-red-50 p-4 mb-6 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Error saving record. Please try again.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              name="location"
              id="location"
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm px-4 py-2 border"
              placeholder="e.g. Warehouse A"
            />
          </div>

          <div>
            <label htmlFor="goodsName" className="block text-sm font-medium text-gray-700 mb-1">
              Goods Name *
            </label>
            <input
              type="text"
              name="goodsName"
              id="goodsName"
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm px-4 py-2 border"
              placeholder="e.g. Steel Rods"
            />
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              id="quantity"
              required
              min="1"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm px-4 py-2 border"
              placeholder="e.g. 50"
            />
          </div>

          <div className="col-span-1 md:col-span-2 pt-4 pb-4 border-t border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-3">Movement Type *</label>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="type"
                  value="in"
                  checked={type === "in"}
                  onChange={() => setType("in")}
                  className="h-4 w-4 text-black border-gray-300 focus:ring-black"
                />
                <span className="ml-2 text-sm text-gray-700 group-hover:text-black">In (Entry)</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="type"
                  value="out"
                  checked={type === "out"}
                  onChange={() => setType("out")}
                  className="h-4 w-4 text-black border-gray-300 focus:ring-black"
                />
                <span className="ml-2 text-sm text-gray-700 group-hover:text-black">Out (Exit)</span>
              </label>
            </div>
          </div>

          {type === "in" ? (
            <>
              <div>
                <label htmlFor="fromLocation" className="block text-sm font-medium text-gray-700 mb-1">From (Source) *</label>
                <input type="text" name="fromLocation" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm px-4 py-2 border" placeholder="e.g. Supplier X" />
              </div>
              <div>
                <label htmlFor="timeArrived" className="block text-sm font-medium text-gray-700 mb-1">Time Arrived *</label>
                <input type="datetime-local" name="timeArrived" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm px-4 py-2 border" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="toLocation" className="block text-sm font-medium text-gray-700 mb-1">To (Destination) *</label>
                <input type="text" name="toLocation" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm px-4 py-2 border" placeholder="e.g. Customer Y" />
              </div>
              <div>
                <label htmlFor="timeLeft" className="block text-sm font-medium text-gray-700 mb-1">Time Left *</label>
                <input type="datetime-local" name="timeLeft" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm px-4 py-2 border" />
              </div>
            </>
          )}

          <div className="col-span-1 md:col-span-2 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vehicle & Driver Details</h3>
          </div>

          <div>
            <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Number *
            </label>
            <input
              type="text"
              name="vehicleNumber"
              id="vehicleNumber"
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm px-4 py-2 border"
              placeholder="e.g. TN-00-AA-0000"
            />
          </div>

          <div>
            <label htmlFor="driverName" className="block text-sm font-medium text-gray-700 mb-1">
              Driver Name *
            </label>
            <input
              type="text"
              name="driverName"
              id="driverName"
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm px-4 py-2 border"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label htmlFor="driverContact" className="block text-sm font-medium text-gray-700 mb-1">
              Driver Contact *
            </label>
            <input
              type="tel"
              name="driverContact"
              id="driverContact"
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm px-4 py-2 border"
              placeholder="e.g. +91 9876543210"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
              Comments (Optional)
            </label>
            <textarea
              name="comments"
              id="comments"
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm px-4 py-2 border"
              placeholder="Any additional notes..."
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center py-2 px-8 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              "Save Record"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
