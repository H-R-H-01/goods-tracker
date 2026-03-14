"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme, setTheme } = useTheme();

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-8 h-8" />; // placeholder to prevent layout shift
    }

    return (
        <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="group relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all duration-300 text-slate-500 dark:text-slate-400 overflow-hidden"
            aria-label="Toggle Dark Mode"
        >
            <div className="relative z-10 flex items-center justify-center">
                {resolvedTheme === "dark" ? (
                    <Sun className="h-5 w-5 transform group-hover:rotate-45 transition-transform duration-500 text-amber-400" />
                ) : (
                    <Moon className="h-5 w-5 transform group-hover:-rotate-12 transition-transform duration-500 text-indigo-600" />
                )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
    );
}
