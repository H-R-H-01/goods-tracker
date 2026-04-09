
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { GoodsRecord } from "@/lib/types";
import { Loader2, Search, Edit2, Trash2, X, Save, Download, ArrowDownRight, ArrowUpRight, MapPin, Package, Printer, User, Truck, BarChart2, List } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";

export default function AdminDashboard() {
    const { user, loading } = useAuth();
    const [records, setRecords] = useState<GoodsRecord[]>([]);
    const [loadingRecords, setLoadingRecords] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<"all" | "in" | "out">("all");
    const [activeTab, setActiveTab] = useState<"records" | "analytics">("records");

    // Edit State
    const [editingRecord, setEditingRecord] = useState<GoodsRecord | null>(null);
    const [printingRecord, setPrintingRecord] = useState<GoodsRecord | null>(null);

    useEffect(() => {
        if (!user) return;

        // Real-time listener
        const q = query(collection(db, "records"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as GoodsRecord[];
            setRecords(data);
            setLoadingRecords(false);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredRecords = records.filter((record) => {
        const matchesSearch =
            record.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.goodsName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.inCharge?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.userName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === "all" || record.type === filterType;

        return matchesSearch && matchesType;
    });

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingRecord) return;

        try {
            const formData = new FormData(e.currentTarget);
            const updates = {
                location: formData.get("location"),
                goodsName: formData.get("goodsName"),
                quantity: Number(formData.get("quantity")),
                vehicleNumber: formData.get("vehicleNumber"),
                driverName: formData.get("driverName"),
                driverContact: formData.get("driverContact"),
                inCharge: formData.get("inCharge"),
                inChargeComment: formData.get("inChargeComment"),
                comments: formData.get("comments"),
            };

            await updateDoc(doc(db, "records", editingRecord.id), updates);
            setEditingRecord(null);
        } catch (error) {
            console.error("Error updating record", error);
            alert("Failed to update record");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            await deleteDoc(doc(db, "records", id));
        } catch (error) {
            console.error("Error deleting record", error);
            alert("Failed to delete record");
        }
    };

    const exportToExcel = () => {
        if (filteredRecords.length === 0) {
            alert("No records to export.");
            return;
        }

        const mapRecord = (record: GoodsRecord) => ({
            "Date": format(new Date(record.createdAt), "yyyy-MM-dd"),
            "Time": format(new Date(record.createdAt), "HH:mm:ss"),
            "Type": record.type.toUpperCase(),
            "Location": record.location || '',
            "Goods Name": record.goodsName || '',
            "Quantity": record.quantity,
            "From (Source)": record.fromLocation || '',
            "To (Destination)": record.toLocation || '',
            "Time Arrived": record.timeArrived ? format(new Date(record.timeArrived), "yyyy-MM-dd HH:mm:ss") : '',
            "Time Left": record.timeLeft ? format(new Date(record.timeLeft), "yyyy-MM-dd HH:mm:ss") : '',
            "Vehicle Number": record.vehicleNumber || '',
            "Driver Name": record.driverName || '',
            "Driver Contact": record.driverContact || '',
            "In-Charge": record.inCharge || '',
            "In-Charge Comment": record.inChargeComment || '',
            "Created By": record.userName || '',
            "Comments": record.comments || ''
        });

        // Sheet 1: All Records
        const allData = filteredRecords.map(mapRecord);
        const wsAll = XLSX.utils.json_to_sheet(allData);

        // Sheet 2: Entries (Inbound)
        const inData = filteredRecords.filter(r => r.type === "in").map(mapRecord);
        const wsIn = XLSX.utils.json_to_sheet(inData);

        // Sheet 3: Exits (Outbound)
        const outData = filteredRecords.filter(r => r.type === "out").map(mapRecord);
        const wsOut = XLSX.utils.json_to_sheet(outData);

        // Sheet 4: Summary (Analytics)
        const locations = Array.from(new Set(filteredRecords.map(r => r.location)));
        const summaryData = locations.map(loc => {
            const locRecords = filteredRecords.filter(r => r.location === loc);
            const inCount = locRecords.filter(r => r.type === "in").length;
            const outCount = locRecords.filter(r => r.type === "out").length;
            const totalQty = locRecords.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
            return {
                "Location": loc || "Unknown",
                "Total Records": locRecords.length,
                "Inbound Records": inCount,
                "Outbound Records": outCount,
                "Total Quantity Handled": totalQty
            };
        });

        const wsSummary = XLSX.utils.json_to_sheet(summaryData);

        // Create workbook and add sheets
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, wsSummary, "Analytics Summary");
        XLSX.utils.book_append_sheet(wb, wsAll, "All Records");
        XLSX.utils.book_append_sheet(wb, wsIn, "Entries");
        XLSX.utils.book_append_sheet(wb, wsOut, "Exits");

        // Export Excel file
        XLSX.writeFile(wb, `goods_tracker_export_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRecords = records.filter(r => new Date(r.createdAt) >= today);
    const todayIn = todayRecords.filter(r => r.type === "in").length;
    const todayOut = todayRecords.filter(r => r.type === "out").length;
    const uniqueLocations = new Set(todayRecords.map(r => r.location)).size;

    // Analytics Calculation
    const pieData = [
        { name: "Inbound", value: filteredRecords.filter(r => r.type === "in").length },
        { name: "Outbound", value: filteredRecords.filter(r => r.type === "out").length }
    ];
    const PIE_COLORS = ['#10b981', '#6366f1'];

    const locationCounts = filteredRecords.reduce((acc, r) => {
        const loc = r.location || "Unknown";
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const locationData = Object.keys(locationCounts).map(key => ({
        location: key,
        count: locationCounts[key]
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    if (loading || loadingRecords) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p>Please sign in to view the dashboard.</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-10 gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Management Console</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Comprehensive overview of all goods movement across locations.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center bg-white dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search records, drivers, vehicles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all text-sm"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all text-sm font-medium"
                    >
                        <option value="all">All Movements</option>
                        <option value="in">Entries Only</option>
                        <option value="out">Exits Only</option>
                    </select>
                    <button
                        onClick={exportToExcel}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: "Total Today", value: todayRecords.length, icon: Package, color: "blue" },
                    { label: "Entries Today", value: todayIn, icon: ArrowDownRight, color: "emerald" },
                    { label: "Exits Today", value: todayOut, icon: ArrowUpRight, color: "indigo" },
                    { label: "Active Hubs", value: uniqueLocations, icon: MapPin, color: "amber" }
                ].map((stat, i) => (
                    <div key={i} className="group bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300">
                        <div className="flex items-center gap-5">
                            <div className={`p-4 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-500/10 text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit mb-8 shadow-inner">
                <button
                    onClick={() => setActiveTab("records")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === "records"
                            ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                    <List className="h-4 w-4" />
                    Records View
                </button>
                <button
                    onClick={() => setActiveTab("analytics")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === "analytics"
                            ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                    <BarChart2 className="h-4 w-4" />
                    Analytics Visuals
                </button>
            </div>

            {activeTab === "records" ? (
                <div className="bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Timestamp</th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Type</th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Location</th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Goods & Qty</th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Route Info</th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Logistics</th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Operator</th>
                                    <th className="px-6 py-5 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                                                    <Search className="h-8 w-8 text-slate-400" />
                                                </div>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium">No records match your current search criteria.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((record) => (
                                        <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                                                        {format(new Date(record.createdAt), "MMM d")}
                                                    </span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                        {format(new Date(record.createdAt), "HH:mm:ss")}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${record.type === "in" 
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
                                                    : "bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"
                                                }`}>
                                                    {record.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{record.location}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                                        <Package className="h-5 w-5 text-slate-500" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{record.goodsName}</span>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Qty: {record.quantity}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <span className="text-slate-400 font-bold uppercase tracking-tighter w-10">
                                                            {record.type === "in" ? "From:" : "To:"}
                                                        </span>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                                                            {record.type === "in" ? record.fromLocation : record.toLocation}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px]">
                                                        <span className="text-slate-400 font-bold uppercase tracking-tighter w-10">
                                                            {record.type === "in" ? "Arr:" : "Left:"}
                                                        </span>
                                                        <span className="text-slate-500 font-medium">
                                                            {record.type === "in"
                                                                ? (record.timeArrived ? format(new Date(record.timeArrived), "HH:mm") : "-")
                                                                : (record.timeLeft ? format(new Date(record.timeLeft), "HH:mm") : "-")
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{record.vehicleNumber}</span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">{record.driverName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                                                        <User className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{record.inCharge}</span>
                                                        {record.inChargeComment && (
                                                            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold truncate max-w-[120px]" title={record.inChargeComment}>
                                                                Note: {record.inChargeComment}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-slate-500 font-medium">System: {record.userName?.split(' ')[0]}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setPrintingRecord(record)}
                                                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
                                                        title="Print Receipt"
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingRecord(record)}
                                                        className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all"
                                                        title="Edit Record"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(record.id)}
                                                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                                        title="Delete Record"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-in fade-in slide-in-from-bottom-4">
                    {/* Pie Chart */}
                    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Movement Distribution</h3>
                        <div className="h-[300px] w-full">
                            {filteredRecords.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                            itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
                            )}
                        </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Hubs by Activity</h3>
                        <div className="h-[300px] w-full">
                            {locationData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={locationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                        <XAxis dataKey="location" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <Tooltip 
                                            cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', color: '#1e293b' }}
                                            itemStyle={{ fontWeight: 'bold' }}
                                        />
                                        <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingRecord && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 scale-in-center animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Record</h3>
                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">ID: {editingRecord.id.slice(0, 8)}</p>
                            </div>
                            <button
                                onClick={() => setEditingRecord(null)}
                                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Operational Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    defaultValue={editingRecord.location}
                                    className="w-full px-4 py-3 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all border outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Goods Name</label>
                                    <input
                                        type="text"
                                        name="goodsName"
                                        defaultValue={editingRecord.goodsName}
                                        className="w-full px-4 py-3 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all border outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        defaultValue={editingRecord.quantity}
                                        className="w-full px-4 py-3 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all border outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vehicle Number</label>
                                <input
                                    type="text"
                                    name="vehicleNumber"
                                    defaultValue={editingRecord.vehicleNumber}
                                    className="w-full px-4 py-3 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all border outline-none uppercase"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Driver Name</label>
                                    <input
                                        type="text"
                                        name="driverName"
                                        defaultValue={editingRecord.driverName}
                                        className="w-full px-4 py-3 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all border outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact No.</label>
                                    <input
                                        type="text"
                                        name="driverContact"
                                        defaultValue={editingRecord.driverContact}
                                        className="w-full px-4 py-3 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all border outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User / In-Charge</label>
                                <input
                                    type="text"
                                    name="inCharge"
                                    defaultValue={editingRecord.inCharge}
                                    className="w-full px-4 py-3 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all border outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">In-Charge Comment</label>
                                <textarea
                                    name="inChargeComment"
                                    rows={2}
                                    defaultValue={editingRecord.inChargeComment}
                                    className="w-full px-4 py-3 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all border outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comments</label>
                                <textarea
                                    name="comments"
                                    rows={3}
                                    defaultValue={editingRecord.comments}
                                    className="w-full px-4 py-3 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all border outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingRecord(null)}
                                    className="flex-1 px-6 py-4 rounded-2xl text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 tracking-wide"
                                >
                                    Discard Changes
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-500/20 transition-all active:scale-95 tracking-wide flex items-center justify-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    Update Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Print Receipt Logic (Simplified but modernized) */}
            {printingRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 print:bg-white print:p-0 print:backdrop-blur-none" onClick={() => setPrintingRecord(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-sm w-full p-10 print:shadow-none print:max-w-none print:w-full print:p-10 relative overflow-hidden border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                        {/* Decorative background for receipt */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
                        
                        <div className="flex justify-end mb-8 print:hidden">
                            <button onClick={() => window.print()} className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-100 transition-all mr-2">
                                <Printer className="h-5 w-5" />
                            </button>
                            <button onClick={() => setPrintingRecord(null)} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl hover:bg-slate-100 transition-all">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="text-center mb-10">
                            <Truck className="h-10 w-10 text-indigo-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Goods Tracker</h2>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mt-1">Official Receipt</p>
                        </div>

                        <div className="space-y-4 border-y border-slate-100 dark:border-slate-800 py-6 mb-8">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Receipt Date</span>
                                <span className="font-black text-slate-900 dark:text-white">{format(new Date(printingRecord.createdAt), "dd MMM yyyy")}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Movement Type</span>
                                <span className={`font-black uppercase italic ${printingRecord.type === 'in' ? 'text-emerald-600' : 'text-indigo-600'}`}>{printingRecord.type}bound</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Station</span>
                                <span className="font-black text-slate-900 dark:text-white">{printingRecord.location}</span>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl mb-10 border border-slate-100 dark:border-slate-700/50">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Goods Package</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{printingRecord.goodsName}</p>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">Quantity: {printingRecord.quantity}</p>
                                </div>
                                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vehicle</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">{printingRecord.vehicleNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Driver</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">{printingRecord.driverName}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center pt-6 border-t border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                Recorded by {printingRecord.inCharge} <br />
                                Authorized by {printingRecord.userName} <br />
                                Thank you for your business
                            </p>
                        </div>
                        
                        {/* Cut lines for style */}
                        <div className="absolute bottom-0 left-0 w-full h-4 overflow-hidden flex gap-1 opacity-20 translate-y-2">
                             {[...Array(20)].map((_, i) => (
                                 <div key={i} className="w-4 h-4 rounded-full bg-slate-900 dark:bg-white flex-shrink-0" />
                             ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
