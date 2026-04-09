"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { addDoc, collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { Loader2, Plus, ListTodo, AlertCircle, CheckCircle2, Clock, Trash2, Filter, User, Users, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function TasksPage() {
    const { user, loading } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<"all" | "mine" | "team">("all");
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Task[];
            setTasks(data);
            setLoadingTasks(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        
        const newTask: Omit<Task, "id"> = {
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            raisedBy: user.displayName || user.email || 'Unknown',
            userEmail: user.email || 'unknown@example.com',
            assignedTo: (formData.get("assignedTo") as string) || "Team",
            priority: Number(formData.get("priority")) as TaskPriority,
            status: "pending",
            createdAt: new Date().toISOString(),
        };

        try {
            await addDoc(collection(db, "tasks"), newTask);
            setShowForm(false);
            (e.target as HTMLFormElement).reset();
        } catch (error) {
            console.error("Error adding task:", error);
            alert("Failed to add task");
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
        try {
            await updateDoc(doc(db, "tasks", taskId), { status: newStatus });
        } catch (error) {
            console.error("Error updating task status:", error);
        }
    };

    const deleteTask = async (taskId: string) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        try {
            await deleteDoc(doc(db, "tasks", taskId));
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (activeTab === "mine") return task.userEmail === user?.email;
        if (activeTab === "team") return task.assignedTo?.toLowerCase() === "team";
        return true;
    });

    const priorityColors: Record<number, string> = {
        1: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
        2: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
        3: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
        4: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
        5: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
    };

    const priorityLabels: Record<number, string> = {
        1: "Low",
        2: "Medium",
        3: "High",
        4: "Urgent",
        5: "Critical",
    };

    if (loading || loadingTasks) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ListTodo className="h-10 w-10 text-slate-400" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Access Denied</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Please sign in to manage your tasks and requirements.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl flex items-center gap-3">
                        <ListTodo className="h-8 w-8 text-indigo-600" />
                        Tasks & Requirements
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Manage logistics actions and team requests in one place.</p>
                </div>
                
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                >
                    {showForm ? <Trash2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    {showForm ? "Cancel" : "New Requirement"}
                </button>
            </div>

            {showForm && (
                <div className="mb-12 bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Add New Task</h2>
                    <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Title / Subject *</label>
                            <input type="text" name="title" required className="w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white px-5 py-3.5 border focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Brief title of the requirement" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Assigned To (Team/Name) *</label>
                            <input type="text" name="assignedTo" required defaultValue="Team" className="w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white px-5 py-3.5 border focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Who should take action?" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Priority Level *</label>
                            <select name="priority" required className="w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white px-5 py-3.5 border focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                <option value="1">1 - Low (Routine)</option>
                                <option value="2">2 - Medium (Normal)</option>
                                <option value="3">3 - High (Urgent)</option>
                                <option value="4">4 - Very High (Immediate)</option>
                                <option value="5">5 - Critical (System Down/Emergency)</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Detailed Description *</label>
                            <textarea name="description" required rows={3} className="w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white px-5 py-3.5 border focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Describe the task or issue in detail..."></textarea>
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                Raise Request
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit mb-8 shadow-inner">
                {[
                    { id: 'all', label: 'All Tasks', icon: Filter },
                    { id: 'mine', label: 'Raised by Me', icon: User },
                    { id: 'team', label: 'Team Tasks', icon: Users },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            activeTab === tab.id
                                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/30 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <ListTodo className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">No requirements found in this category.</p>
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <div 
                            key={task.id} 
                            className={`group relative bg-white dark:bg-slate-900/50 backdrop-blur-sm p-6 border rounded-3xl transition-all duration-300 hover:shadow-xl ${
                                task.status === 'completed' ? 'border-emerald-100 dark:border-emerald-500/20 opacity-75' : 'border-slate-200 dark:border-slate-800'
                            }`}
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`mt-1 p-3 rounded-2xl ${
                                        task.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                        task.status === 'in-progress' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' :
                                        'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                        {task.status === 'completed' ? <CheckCircle2 className="h-6 w-6" /> : 
                                         task.status === 'in-progress' ? <Clock className="h-6 w-6" /> : 
                                         <AlertCircle className="h-6 w-6" />}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className={`text-lg font-bold ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                                                {task.title}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${priorityColors[task.priority]}`}>
                                                {priorityLabels[task.priority]}
                                            </span>
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-2xl">
                                            {task.description}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs font-bold uppercase tracking-tighter text-slate-400">
                                            <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> By: {task.raisedBy}</span>
                                            <span className="flex items-center gap-1.5"><Users className="h-3 w-3" /> To: {task.assignedTo}</span>
                                            <span>• ID: {task.id.slice(0, 8)}</span>
                                            <span>• {format(new Date(task.createdAt), "dd MMM, HH:mm")}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                                        {(['pending', 'in-progress', 'completed'] as TaskStatus[]).map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => updateTaskStatus(task.id, s)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                                                    task.status === s 
                                                        ? s === 'completed' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                                                          s === 'in-progress' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' :
                                                          'bg-slate-600 text-white shadow-lg shadow-slate-500/20'
                                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                {s.replace('-', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => deleteTask(task.id)}
                                        className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
