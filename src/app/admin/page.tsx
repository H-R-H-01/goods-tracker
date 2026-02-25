
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { GoodsRecord } from "@/lib/types";
import { Loader2, Search, Edit2, Trash2, X, Save, Download, ArrowDownRight, ArrowUpRight, MapPin, Package, Printer } from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
    const { user, loading } = useAuth();
    const [records, setRecords] = useState<GoodsRecord[]>([]);
    const [loadingRecords, setLoadingRecords] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<"all" | "in" | "out">("all");

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

    const exportToCSV = () => {
        if (filteredRecords.length === 0) {
            alert("No records to export.");
            return;
        }

        const headers = [
            "Date", "Type", "Location", "Goods Name", "Quantity",
            "From (Source)", "To (Destination)", "Time Arrived", "Time Left",
            "Vehicle Number", "Driver Name", "Driver Contact", "Created By", "Comments"
        ];

        const csvData = filteredRecords.map(record => [
            format(new Date(record.createdAt), "yyyy-MM-dd HH:mm:ss"),
            record.type.toUpperCase(),
            `"${record.location || ''}"`,
            `"${record.goodsName || ''}"`,
            record.quantity,
            `"${record.fromLocation || ''}"`,
            `"${record.toLocation || ''}"`,
            record.timeArrived ? format(new Date(record.timeArrived), "yyyy-MM-dd HH:mm:ss") : '',
            record.timeLeft ? format(new Date(record.timeLeft), "yyyy-MM-dd HH:mm:ss") : '',
            `"${record.vehicleNumber || ''}"`,
            `"${record.driverName || ''}"`,
            `"${record.driverContact || ''}"`,
            `"${record.userName || ''}"`,
            `"${record.comments || ''}"`
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `goods_tracker_export_${format(new Date(), "yyyy-MM-dd_HHmmss")}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRecords = records.filter(r => new Date(r.createdAt) >= today);
    const todayIn = todayRecords.filter(r => r.type === "in").length;
    const todayOut = todayRecords.filter(r => r.type === "out").length;
    const uniqueLocations = new Set(todayRecords.map(r => r.location)).size;

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
        <div className="max-w-[1400px] mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and view all goods movement records.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <button
                        onClick={exportToCSV}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#222] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white transition-colors"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </button>
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white w-full sm:w-64 bg-white dark:bg-[#1a1a1a] dark:text-white transition-colors"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="border border-gray-300 dark:border-gray-700 rounded-md py-2 px-4 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white bg-white dark:bg-[#1a1a1a] dark:text-white w-full sm:w-auto transition-colors"
                    >
                        <option value="all">All Movements</option>
                        <option value="in">In (Entry)</option>
                        <option value="out">Out (Exit)</option>
                    </select>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex items-center transition-colors">
                    <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
                        <Package className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Today</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayRecords.length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex items-center transition-colors">
                    <div className="p-3 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
                        <ArrowDownRight className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Entries Today</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayIn}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex items-center transition-colors">
                    <div className="p-3 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-4">
                        <ArrowUpRight className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Exits Today</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayOut}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex items-center transition-colors">
                    <div className="p-3 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 mr-4">
                        <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Locations Today</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueLocations}</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm transition-colors">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-[#1a1a1a]">
                    <thead className="bg-gray-50 dark:bg-[#222]">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Goods</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">From/To</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehicle</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Driver</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created By</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-[#1a1a1a]">
                        {filteredRecords.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No records found matching your filters.
                                </td>
                            </tr>
                        ) : (
                            filteredRecords.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-[#222]/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {format(new Date(record.createdAt), "MMM d, yyyy HH:mm")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.type === "in" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                            }`}>
                                            {record.type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">{record.location}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {record.quantity}x {record.goodsName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {record.type === "in" ? (
                                            <>From: <span className="font-medium text-gray-700 dark:text-gray-300">{record.fromLocation}</span></>
                                        ) : (
                                            <>To: <span className="font-medium text-gray-700 dark:text-gray-300">{record.toLocation}</span></>
                                        )}
                                        <br />
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            {record.type === "in"
                                                ? `Arr: ${record.timeArrived ? format(new Date(record.timeArrived), "HH:mm") : "-"}`
                                                : `Left: ${record.timeLeft ? format(new Date(record.timeLeft), "HH:mm") : "-"}`
                                            }
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{record.vehicleNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {record.driverName}
                                        <div className="text-xs text-gray-400 dark:text-gray-500">{record.driverContact}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{record.userName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => setPrintingRecord(record)}
                                            className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white mr-4 transition-colors"
                                            title="Print Receipt"
                                        >
                                            <Printer className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setEditingRecord(record)}
                                            className="text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 mr-4"
                                            title="Edit"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(record.id)}
                                            className="text-red-600 dark:text-red-500 hover:text-red-900 dark:hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Record</h3>
                            <button
                                onClick={() => setEditingRecord(null)}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    defaultValue={editingRecord.location}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-[#222] text-black dark:text-white shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-3 py-2 border"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Goods Name</label>
                                    <input
                                        type="text"
                                        name="goodsName"
                                        defaultValue={editingRecord.goodsName}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-[#222] text-black dark:text-white shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-3 py-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        defaultValue={editingRecord.quantity}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-[#222] text-black dark:text-white shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-3 py-2 border"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle Number</label>
                                <input
                                    type="text"
                                    name="vehicleNumber"
                                    defaultValue={editingRecord.vehicleNumber}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-[#222] text-black dark:text-white shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-3 py-2 border"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Driver Name</label>
                                    <input
                                        type="text"
                                        name="driverName"
                                        defaultValue={editingRecord.driverName}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-[#222] text-black dark:text-white shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-3 py-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Driver Contact</label>
                                    <input
                                        type="text"
                                        name="driverContact"
                                        defaultValue={editingRecord.driverContact}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-[#222] text-black dark:text-white shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-3 py-2 border"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Comments</label>
                                <textarea
                                    name="comments"
                                    rows={3}
                                    defaultValue={editingRecord.comments}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-[#222] text-black dark:text-white shadow-sm focus:border-black dark:focus:border-white focus:ring-black dark:focus:ring-white sm:text-sm px-3 py-2 border"
                                />
                            </div>

                            <div className="flex justify-end pt-4 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingRecord(null)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#222] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white dark:text-black bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Print Modal */}
            {printingRecord && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:bg-white print:p-0 print:backdrop-blur-none" onClick={() => setPrintingRecord(null)}>
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl max-w-sm w-full p-8 print:shadow-none print:max-w-none print:w-full print:p-8 relative print:bg-white" onClick={(e) => e.stopPropagation()}>
                        <div className="absolute top-4 right-4 print:hidden flex gap-2">
                            <button
                                onClick={() => window.print()}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                title="Print"
                            >
                                <Printer className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setPrintingRecord(null)}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                title="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold uppercase tracking-widest text-black dark:text-white print:text-black">Goods Tracker</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-500 mt-1">Movement Receipt</p>
                        </div>

                        <div className="border-t border-b border-gray-200 dark:border-gray-700 print:border-gray-200 py-4 mb-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400 print:text-gray-500 text-sm">Date & Time:</span>
                                <span className="font-medium text-sm dark:text-gray-200 print:text-black">{format(new Date(printingRecord.createdAt), "dd MMM yyyy, HH:mm")}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400 print:text-gray-500 text-sm">Type:</span>
                                <span className={`font-bold text-sm uppercase ${printingRecord.type === 'in' ? 'text-green-600 dark:text-green-400 print:text-green-600' : 'text-blue-600 dark:text-blue-400 print:text-blue-600'}`}>{printingRecord.type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400 print:text-gray-500 text-sm">Location:</span>
                                <span className="font-medium text-sm dark:text-gray-200 print:text-black">{printingRecord.location}</span>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400 print:text-gray-500 text-sm">Goods Name:</span>
                                <span className="font-bold text-sm text-right dark:text-gray-200 print:text-black">{printingRecord.goodsName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400 print:text-gray-500 text-sm">Quantity:</span>
                                <span className="font-medium text-sm dark:text-gray-200 print:text-black">{printingRecord.quantity}</span>
                            </div>
                            {printingRecord.type === "in" && printingRecord.fromLocation && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-gray-400 print:text-gray-500 text-sm mr-4">From:</span>
                                    <span className="font-medium text-sm text-right break-words dark:text-gray-200 print:text-black">{printingRecord.fromLocation}</span>
                                </div>
                            )}
                            {printingRecord.type === "out" && printingRecord.toLocation && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-gray-400 print:text-gray-500 text-sm mr-4">To:</span>
                                    <span className="font-medium text-sm text-right break-words dark:text-gray-200 print:text-black">{printingRecord.toLocation}</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mb-6 border border-gray-100 dark:border-gray-800 print:bg-white print:border-gray-200 transition-colors">
                            <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-500 mb-2 uppercase tracking-wider font-semibold">Vehicle Details</p>
                            <div className="flex justify-between mt-2">
                                <span className="text-gray-600 dark:text-gray-400 print:text-gray-600 text-sm">Number:</span>
                                <span className="font-medium text-sm dark:text-gray-200 print:text-black">{printingRecord.vehicleNumber}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-gray-600 dark:text-gray-400 print:text-gray-600 text-sm">Driver:</span>
                                <span className="font-medium text-sm dark:text-gray-200 print:text-black">{printingRecord.driverName}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-gray-600 dark:text-gray-400 print:text-gray-600 text-sm">Contact:</span>
                                <span className="font-medium text-sm dark:text-gray-200 print:text-black">{printingRecord.driverContact}</span>
                            </div>
                        </div>

                        <div className="text-center mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 print:border-gray-200">
                            <p className="text-xs text-gray-400 dark:text-gray-500 print:text-gray-400">Generated by {printingRecord.userName}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
