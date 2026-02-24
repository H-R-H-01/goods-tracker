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
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p>Please sign in to view the locations dashboard.</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Locations Overview</h1>
                <p className="text-gray-500 mt-1">Analytics and activity breakdown by operational venue.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {locationsArray.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200">
                        <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No Locations Found</h3>
                        <p className="text-gray-500 mt-1">Start adding records to see location analytics.</p>
                    </div>
                ) : (
                    locationsArray.map(loc => (
                        <div key={loc.name} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 truncate max-w-[200px]" title={loc.name}>{loc.name}</h3>
                                    <div className="flex items-center text-xs text-gray-400 mt-1">
                                        <Navigation className="h-3 w-3 mr-1" />
                                        <span>Active {loc.lastActive ? new Date(loc.lastActive).toLocaleDateString() : 'Never'}</span>
                                    </div>
                                </div>
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <MapPin className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-green-50 rounded-lg p-3">
                                    <div className="flex items-center text-green-700 mb-1">
                                        <ArrowDownRight className="h-4 w-4 mr-1" />
                                        <span className="text-xs font-medium uppercase">Entries</span>
                                    </div>
                                    <p className="text-xl font-bold text-green-800">{loc.entries}</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-3">
                                    <div className="flex items-center text-blue-700 mb-1">
                                        <ArrowUpRight className="h-4 w-4 mr-1" />
                                        <span className="text-xs font-medium uppercase">Exits</span>
                                    </div>
                                    <p className="text-xl font-bold text-blue-800">{loc.exits}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                                <div className="flex items-center text-gray-600">
                                    <Package className="h-4 w-4 mr-2" />
                                    <span className="text-sm font-medium">Unique Goods Types</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900 bg-white px-2 py-1 rounded shadow-sm">
                                    {loc.uniqueGoods.size}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
