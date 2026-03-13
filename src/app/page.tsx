
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { addDoc, collection, getDocs, query, orderBy, limit, where, onSnapshot } from "firebase/firestore";
import { Loader2, Clock, Truck, MapPin, ArrowDownRight, ArrowUpRight, Package } from "lucide-react";
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
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Add New Record</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg">
          Track entry and exit of goods with precision.
        </p>
      </div>

      <datalist id="locations-list">{Array.from(suggestions.locations).map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="goodsNames-list">{Array.from(suggestions.goodsNames).map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="fromLocations-list">{Array.from(suggestions.fromLocations).map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="toLocations-list">{Array.from(suggestions.toLocations).map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="vehicleNumbers-list">{Array.from(suggestions.vehicleNumbers).map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="driverNames-list">{Array.from(suggestions.driverNames).map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="driverContacts-list">{Array.from(suggestions.driverContacts).map((v) => <option key={v} value={v} />)}</datalist>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900/50 backdrop-blur-sm p-6 md:p-10 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none space-y-10 transition-all duration-300">

        {/* Status Messages */}
        {status === "success" && (
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 p-5 border border-emerald-200 dark:border-emerald-500/20 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-full">
                  <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-400">Record saved successfully!</p>
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl bg-rose-50 dark:bg-rose-500/10 p-5 border border-rose-200 dark:border-rose-500/20 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-full">
                  <svg className="h-5 w-5 text-rose-600 dark:text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-rose-900 dark:text-rose-400">Failed to save record. Please try again.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="location" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Current Location *
            </label>
            <div className="relative group">
              <input
                type="text"
                name="location"
                id="location"
                required
                list="locations-list"
                className="block w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all px-5 py-3.5 border"
                placeholder="Where are the goods now? (e.g. Warehouse A)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="goodsName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Goods Description *
            </label>
            <input
              type="text"
              name="goodsName"
              id="goodsName"
              required
              list="goodsNames-list"
              className="block w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all px-5 py-3.5 border"
              placeholder="What's being moved?"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="quantity" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              id="quantity"
              required
              min="1"
              className="block w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all px-5 py-3.5 border"
              placeholder="e.g. 500"
            />
          </div>

          <div className="col-span-1 md:col-span-2 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-200 dark:border-slate-700/50 gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white">Movement Direction</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Is this an incoming or outgoing shipment?</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex w-full sm:w-auto shadow-sm">
                <button
                  type="button"
                  onClick={() => setType("in")}
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${type === "in" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                >
                  Entry (In)
                </button>
                <button
                  type="button"
                  onClick={() => setType("out")}
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${type === "out" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                >
                  Exit (Out)
                </button>
              </div>
            </div>
          </div>

          {type === "in" ? (
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 bg-emerald-50/30 dark:bg-emerald-500/5 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-500/10 animate-in fade-in duration-300">
              <div className="space-y-2">
                <label htmlFor="fromLocation" className="block text-sm font-semibold text-emerald-900 dark:text-emerald-400">Source Location (From) *</label>
                <input type="text" name="fromLocation" required list="fromLocations-list" className="block w-full rounded-2xl border-emerald-100 dark:border-emerald-900/30 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all px-5 py-3.5 border" placeholder="Where did it come from?" />
              </div>
              <div className="space-y-2">
                <label htmlFor="timeArrived" className="block text-sm font-semibold text-emerald-900 dark:text-emerald-400">Arrival Timestamp *</label>
                <input type="datetime-local" name="timeArrived" required className="block w-full rounded-2xl border-emerald-100 dark:border-emerald-900/30 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all px-5 py-3.5 border" />
              </div>
            </div>
          ) : (
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 bg-indigo-50/30 dark:bg-indigo-500/5 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-500/10 animate-in fade-in duration-300">
              <div className="space-y-2">
                <label htmlFor="toLocation" className="block text-sm font-semibold text-indigo-900 dark:text-indigo-400">Destination (To) *</label>
                <input type="text" name="toLocation" required list="toLocations-list" className="block w-full rounded-2xl border-indigo-100 dark:border-indigo-900/30 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all px-5 py-3.5 border" placeholder="Where is it going?" />
              </div>
              <div className="space-y-2">
                <label htmlFor="timeLeft" className="block text-sm font-semibold text-indigo-900 dark:text-indigo-400">Departure Timestamp *</label>
                <input type="datetime-local" name="timeLeft" required className="block w-full rounded-2xl border-indigo-100 dark:border-indigo-900/30 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all px-5 py-3.5 border" />
              </div>
            </div>
          )}

          <div className="col-span-1 md:col-span-2 pt-6 mb-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm">
                <Truck className="w-4 h-4" />
              </span>
              Logistics Information
            </h3>
          </div>

          <div className="space-y-2">
            <label htmlFor="vehicleNumber" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Vehicle Registration *
            </label>
            <input
              type="text"
              name="vehicleNumber"
              id="vehicleNumber"
              required
              list="vehicleNumbers-list"
              className="block w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all px-5 py-3.5 border uppercase"
              placeholder="TN-XX-XXXX"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="driverName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Driver Full Name *
            </label>
            <input
              type="text"
              name="driverName"
              id="driverName"
              required
              list="driverNames-list"
              className="block w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all px-5 py-3.5 border"
              placeholder="Who is driving?"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="driverContact" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Driver Phone Number *
            </label>
            <input
              type="tel"
              name="driverContact"
              id="driverContact"
              required
              list="driverContacts-list"
              className="block w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all px-5 py-3.5 border"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>

          <div className="col-span-1 md:col-span-2 space-y-2">
            <label htmlFor="comments" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Additional Notes
            </label>
            <textarea
              name="comments"
              id="comments"
              rows={4}
              className="block w-full rounded-3xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all px-5 py-3.5 border"
              placeholder="Any specific comments about this shipment..."
            />
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center py-4 px-12 border border-transparent shadow-xl shadow-indigo-500/20 text-base font-bold rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 group"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                Processing...
              </>
            ) : (
              "Save Movement Record"
            )}
          </button>
        </div>
      </form>

      {/* Recent Entries UI */}
      <div className="mt-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recent Activity</h2>
          </div>
          {recentRecords.length > 0 && (
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Last 5 records</span>
          )}
        </div>

        {recentRecordsError ? (
          <div className="bg-amber-50 dark:bg-amber-500/10 p-8 border border-amber-200 dark:border-amber-500/20 rounded-3xl animate-in fade-in duration-500 shadow-sm">
            <h3 className="font-bold text-amber-900 dark:text-amber-400 mb-2">Firestore Index Required</h3>
            <p className="text-amber-800/80 dark:text-amber-300/80 leading-relaxed text-sm">
              We couldn't load your recent entries. Firestore needs a composite index to run this query. 
              Please check your browser console for the direct link to create the index in Firebase.
            </p>
          </div>
        ) : recentRecords.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {recentRecords.map((record, idx) => (
              <div 
                key={record.id} 
                className="group relative bg-white dark:bg-slate-900/50 backdrop-blur-sm p-5 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 p-2 rounded-xl border ${record.type === "in" ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"}`}>
                      {record.type === "in" ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 dark:text-white">{record.goodsName}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">x{record.quantity}</span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${record.type === "in" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400"}`}>
                          {record.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 opacity-50" />
                          {record.location}
                        </span>
                        <span className="hidden sm:inline opacity-30">•</span>
                        <span className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 opacity-50" />
                          {record.vehicleNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                      {record.createdAt ? format(new Date(record.createdAt), "MMM d") : ''}
                    </span>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {record.createdAt ? format(new Date(record.createdAt), "HH:mm") : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-100/50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No activity recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
