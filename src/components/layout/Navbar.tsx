
"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Truck, User } from "lucide-react";

export function Navbar() {
    const { user, logOut, signIn } = useAuth();

    return (
        <nav className="border-b border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex-shrink-0 flex items-center gap-2">
                            <Truck className="h-6 w-6" />
                            <span className="font-bold text-xl tracking-tight">GoodsTracker</span>
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                href="/"
                                className="border-transparent text-gray-500 hover:border-black hover:text-black inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Add Record
                            </Link>
                            <Link
                                href="/admin"
                                className="border-transparent text-gray-500 hover:border-black hover:text-black inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Admin Dashboard
                            </Link>
                            <Link
                                href="/locations"
                                className="border-transparent text-gray-500 hover:border-black hover:text-black inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Locations
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <User className="h-4 w-4" />
                                    <span>{user.displayName || user.email}</span>
                                </div>
                                <button
                                    onClick={logOut}
                                    className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                                >
                                    <LogOut className="h-4 w-4 inline mr-2" />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={signIn}
                                className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
