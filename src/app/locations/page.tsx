"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { GoodsRecord } from "@/lib/types";
import { Loader2, MapPin, Package, ArrowUpRight, ArrowDownRight, Navigation } from "lucide-react";

export default function LocationsDashboard() {
    const { user, loading } = useAuth();
    const [records, setRecords] = useState<GoodsRecord[]>([]);
    const [loadingRecords, setLoadingRecords] = useState(true);

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

    // Derived location analytics
    type LocationStats = {
        name: string;
        totalMovements: number;
        entries: number;
        exits: number;
        lastActive: string | null;
        uniqueGoods: Set<string>;
    };

    const locationMap = new Map<string, LocationStats>();

    records.forEach(record => {
        if (!record.location) return;

        const loc = record.location;
        if (!locationMap.has(loc)) {
            locationMap.set(loc, {
                name: loc,
                totalMovements: 0,
                entries: 0,
                exits: 0,
                lastActive: null,
                uniqueGoods: new Set(),
            });
        }

        const stats = locationMap.get(loc)!;
        stats.totalMovements++;
        if (record.type === 'in') stats.entries++;
        if (record.type === 'out') stats.exits++;

        if (!stats.lastActive || new Date(record.createdAt) > new Date(stats.lastActive)) {
            stats.lastActive = record.createdAt;
        }

        if (record.goodsName) {
            stats.uniqueGoods.add(record.goodsName);
        }
    });

    const locationsArray = Array.from(locationMap.values()).sort((a, b) => b.totalMovements - a.totalMovements);

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
                <h2 className="text-2xl font-bold dark:text-white">Access Denied</h2>
                <p className="dark:text-gray-400">Please sign in to view the locations dashboard.</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Locations Intelligence</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Performance metrics and logistics health across all hubs.</p>
                </div>
                
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
                   <div className="flex flex-col items-center px-4 border-r border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Hubs</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">{locationsArray.length}</span>
                   </div>
                   <div className="flex flex-col items-center px-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Activity</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">{records.length}</span>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {locationsArray.length === 0 ? (
                    <div className="col-span-full py-24 bg-white dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6">
                            <MapPin className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Location Data Found</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm">Capture movement records from the home screen to populate your location analytics board.</p>
                    </div>
                ) : (
                    locationsArray.map((loc, idx) => (
                        <div 
                            key={loc.name} 
                            className="group relative bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-[2rem] p-7 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-none transition-all duration-500 animate-in fade-in slide-in-from-bottom-4"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            <div className="flex items-start justify-between mb-8">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={loc.name}>
                                        {loc.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                                        <Navigation className="h-3 w-3" />
                                        <span>Active {loc.lastActive ? new Date(loc.lastActive).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Never'}</span>
                                    </div>
                                </div>
                                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all duration-300">
                                    <MapPin className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl p-4 border border-emerald-100/50 dark:border-emerald-500/10 group-hover:scale-[1.02] transition-transform duration-300">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                                        <div className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-500/20">
                                            <ArrowDownRight className="h-3 w-3" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest italic">Entries</span>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{loc.entries}</p>
                                </div>
                                <div className="bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl p-4 border border-indigo-100/50 dark:border-indigo-500/10 group-hover:scale-[1.02] transition-transform duration-300">
                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
                                        <div className="p-1 rounded-md bg-indigo-100 dark:bg-indigo-500/20">
                                            <ArrowUpRight className="h-3 w-3" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest italic">Exits</span>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{loc.exits}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 group-hover:border-indigo-200 dark:group-hover:border-indigo-500/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                                        <Package className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Goods Varieties</span>
                                </div>
                                <div className="px-3 py-1 bg-white dark:bg-slate-900 rounded-xl text-sm font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300">
                                    {loc.uniqueGoods.size}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
