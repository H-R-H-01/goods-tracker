"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Truck, User, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Navbar() {
    const { user, logOut, signIn } = useAuth();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { name: "Add Record", href: "/" },
        { name: "Dashboard", href: "/admin" },
        { name: "Locations", href: "/locations" },
        { name: "Tasks", href: "/tasks" },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full glass shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex-shrink-0 flex items-center gap-2 text-slate-900 dark:text-white group">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                <Truck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">GoodsTracker</span>
                        </Link>
                        <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${pathname === link.href ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'}`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <ThemeToggle />
                        <div className="hidden sm:flex items-center gap-4">
                            {user ? (
                                <>
                                    <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                                        <User className="h-4 w-4 text-indigo-500" />
                                        <span>{user.displayName || user.email}</span>
                                    </div>
                                    <button
                                        onClick={logOut}
                                        className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span className="hidden sm:inline">Logout</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={signIn}
                                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-500/20 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95"
                                >
                                    Sign In
                                </button>
                            )}
                        </div>
                        
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="sm:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="sm:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top duration-200">
                    <div className="pt-2 pb-3 space-y-1 px-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`block px-3 py-3 rounded-xl text-base font-medium transition-all ${pathname === link.href ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400'}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                    <div className="pt-4 pb-3 border-t border-slate-100 dark:border-slate-800 px-4">
                        {user ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                                        <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white leading-none">{user.displayName || 'User'}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{user.email}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={logOut}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-3 rounded-xl text-sm font-bold transition-all"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={signIn}
                                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
