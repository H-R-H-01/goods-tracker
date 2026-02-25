
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { addDoc, collection, getDocs, query, orderBy, limit, where, onSnapshot } from "firebase/firestore";
import { Loader2, Clock } from "lucide-react";
import { format } from "date-fns";

export default function Home() {
  const { user, loading, signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [type, setType] = useState<"in" | "out">("in");

  const [suggestions, setSuggestions] = useState({
    locations: new Set<string>(),
    goodsNames: new Set<string>(),
    fromLocations: new Set<string>(),
    toLocations: new Set<string>(),
    vehicleNumbers: new Set<string>(),
    driverNames: new Set<string>(),
    driverContacts: new Set<string>(),
  });
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [recentRecordsError, setRecentRecordsError] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchSuggestions = async () => {
      try {
        const snapshot = await getDocs(collection(db, "records"));
        const newSuggestions = {
          locations: new Set<string>(),
          goodsNames: new Set<string>(),
          fromLocations: new Set<string>(),
          toLocations: new Set<string>(),
          vehicleNumbers: new Set<string>(),
          driverNames: new Set<string>(),
          driverContacts: new Set<string>(),
        };

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.location) newSuggestions.locations.add(data.location);
          if (data.goodsName) newSuggestions.goodsNames.add(data.goodsName);
          if (data.fromLocation) newSuggestions.fromLocations.add(data.fromLocation);
          if (data.toLocation) newSuggestions.toLocations.add(data.toLocation);
          if (data.vehicleNumber) newSuggestions.vehicleNumbers.add(data.vehicleNumber);
          if (data.driverName) newSuggestions.driverNames.add(data.driverName);
          if (data.driverContact) newSuggestions.driverContacts.add(data.driverContact);
        });

        setSuggestions(newSuggestions);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };

    fetchSuggestions();

    const recordsQuery = query(
      collection(db, "records"),
      where("userEmail", "==", user.email),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      recordsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRecentRecords(data);
      },
      (error) => {
        console.error("Error fetching recent records (might need Firestore index):", error);
        setRecentRecordsError(true);
        // You can check the browser console for the exact link to create the index.
      }
    );

    return () => unsubscribe();
  }, [user]);

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

      setSuggestions(prev => {
        const next = {
          locations: new Set(prev.locations),
          goodsNames: new Set(prev.goodsNames),
          fromLocations: new Set(prev.fromLocations),
          toLocations: new Set(prev.toLocations),
          vehicleNumbers: new Set(prev.vehicleNumbers),
          driverNames: new Set(prev.driverNames),
          driverContacts: new Set(prev.driverContacts),
        };
        if (record.location) next.locations.add(record.location as string);
        if (record.goodsName) next.goodsNames.add(record.goodsName as string);
        if (record.fromLocation) next.fromLocations.add(record.fromLocation as string);
        if (record.toLocation) next.toLocations.add(record.toLocation as string);
        if (record.vehicleNumber) next.vehicleNumbers.add(record.vehicleNumber as string);
        if (record.driverName) next.driverNames.add(record.driverName as string);
        if (record.driverContact) next.driverContacts.add(record.driverContact as string);
        return next;
      });

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
        <h1 className="text-4xl font-bold tracking-tight mb-4 dark:text-white">Welcome to GoodsTracker</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mb-8 text-lg">
          Track vehicle goods simply and efficiently.
        </p>
        <button
          onClick={signIn}
          className="bg-black text-white dark:bg-white dark:text-black px-8 py-3 rounded-full text-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg"
        >
          Sign In to Continue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Add New Record</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Enter details of goods moving in or out.
        </p>
      </div>

      <datalist id="locations-list">{Array.from(suggestions.locations).map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="goodsNames-list">{Array.from(suggestions.goodsNames).map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="fromLocations-list">{Array.from(suggestions.fromLocations).map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="toLocations-list">{Array.from(suggestions.toLocations).map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="vehicleNumbers-list">{Array.from(suggestions.vehicleNumbers).map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="driverNames-list">{Array.from(suggestions.driverNames).map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="driverContacts-list">{Array.from(suggestions.driverContacts).map((v) => <option key={v} value={v} />)}</datalist>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1a1a1a] p-8 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm space-y-8 transition-colors">

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
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location *
            </label>
            <input
              type="text"
              name="location"
              id="location"
              required
              list="locations-list"
              className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-4 py-2 border bg-white dark:bg-[#222] dark:text-white"
              placeholder="e.g. Warehouse A"
            />
          </div>

          <div>
            <label htmlFor="goodsName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Goods Name *
            </label>
            <input
              type="text"
              name="goodsName"
              id="goodsName"
              required
              list="goodsNames-list"
              className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-4 py-2 border bg-white dark:bg-[#222] dark:text-white"
              placeholder="e.g. Steel Rods"
            />
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              id="quantity"
              required
              min="1"
              className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-4 py-2 border bg-white dark:bg-[#222] dark:text-white"
              placeholder="e.g. 50"
            />
          </div>

          <div className="col-span-1 md:col-span-2 pt-4 pb-4 border-t border-b border-gray-100 dark:border-gray-800">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Movement Type *</label>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="type"
                  value="in"
                  checked={type === "in"}
                  onChange={() => setType("in")}
                  className="h-4 w-4 text-black dark:text-white border-gray-300 dark:border-gray-600 focus:ring-black dark:focus:ring-white bg-white dark:bg-[#222]"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">In (Entry)</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="type"
                  value="out"
                  checked={type === "out"}
                  onChange={() => setType("out")}
                  className="h-4 w-4 text-black dark:text-white border-gray-300 dark:border-gray-600 focus:ring-black dark:focus:ring-white bg-white dark:bg-[#222]"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">Out (Exit)</span>
              </label>
            </div>
          </div>

          {type === "in" ? (
            <>
              <div>
                <label htmlFor="fromLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From (Source) *</label>
                <input type="text" name="fromLocation" required list="fromLocations-list" className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-4 py-2 border bg-white dark:bg-[#222] dark:text-white" placeholder="e.g. Supplier X" />
              </div>
              <div>
                <label htmlFor="timeArrived" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Arrived *</label>
                <input type="datetime-local" name="timeArrived" required className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-4 py-2 border bg-white dark:bg-[#222] dark:text-white" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="toLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To (Destination) *</label>
                <input type="text" name="toLocation" required list="toLocations-list" className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-4 py-2 border bg-white dark:bg-[#222] dark:text-white" placeholder="e.g. Customer Y" />
              </div>
              <div>
                <label htmlFor="timeLeft" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Left *</label>
                <input type="datetime-local" name="timeLeft" required className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-4 py-2 border bg-white dark:bg-[#222] dark:text-white" />
              </div>
            </>
          )}

          <div className="col-span-1 md:col-span-2 pt-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Vehicle & Driver Details</h3>
          </div>

          <div>
            <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vehicle Number *
            </label>
            <input
              type="text"
              name="vehicleNumber"
              id="vehicleNumber"
              required
              list="vehicleNumbers-list"
              className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-4 py-2 border bg-white dark:bg-[#222] dark:text-white"
              placeholder="e.g. TN-00-AA-0000"
            />
          </div>

          <div>
            <label htmlFor="driverName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Driver Name *
            </label>
            <input
              type="text"
              name="driverName"
              id="driverName"
              required
              list="driverNames-list"
              className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-4 py-2 border bg-white dark:bg-[#222] dark:text-white"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label htmlFor="driverContact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Driver Contact *
            </label>
            <input
              type="tel"
              name="driverContact"
              id="driverContact"
              required
              list="driverContacts-list"
              className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-4 py-2 border bg-white dark:bg-[#222] dark:text-white"
              placeholder="e.g. +91 9876543210"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Comments (Optional)
            </label>
            <textarea
              name="comments"
              id="comments"
              rows={3}
              className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-4 py-2 border bg-white dark:bg-[#222] dark:text-white"
              placeholder="Any additional notes..."
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center py-2 px-8 border border-transparent shadow-sm text-sm font-medium rounded-md text-white dark:text-black bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white dark:focus:ring-offset-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

      {/* Recent Entries Error UI */}
      {recentRecordsError && (
        <div className="mt-12 bg-white dark:bg-[#1a1a1a] p-6 md:p-8 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Recent Entries</h2>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 border border-orange-200 dark:border-orange-800/50 rounded-md">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <strong>Database Index Required:</strong> Your recent entries cannot be displayed yet because Firestore needs a composite index for this query.
              <br /><br />
              Please open your browser's <strong>Developer Tools Console</strong> to find the exact direct link generated by Firebase. Clicking that link will automatically build the required index for you in your Firebase Console.
            </p>
          </div>
        </div>
      )}

      {/* Recent Entries Section */}
      {!recentRecordsError && recentRecords.length > 0 && (
        <div className="mt-12 bg-white dark:bg-[#1a1a1a] p-6 md:p-8 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Recent Entries</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentRecords.map((record) => (
              <div key={record.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${record.type === "in" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"}`}>
                      {record.type}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{record.goodsName}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">x{record.quantity}</span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{record.location}</span>
                    <span>•</span>
                    <span>{record.vehicleNumber}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {record.createdAt ? format(new Date(record.createdAt), "MMM d, HH:mm") : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
