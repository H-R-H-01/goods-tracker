export type UserRole = "admin" | "user";

export type GoodsRecord = {
    id: string;
    location: string;
    goodsName: string;
    quantity: number;
    type: "in" | "out";
    fromLocation?: string;
    toLocation?: string;
    timeArrived?: string; // stored as ISO string
    timeLeft?: string; // stored as ISO string
    vehicleNumber: string;
    driverName: string;
    driverContact: string;
    userName: string;
    userEmail: string;
    inCharge: string;
    createdAt: string; // stored as ISO string
    comments?: string;
    inChargeComment?: string;
};

export type TaskPriority = 1 | 2 | 3 | 4 | 5;

export type TaskStatus = "pending" | "in-progress" | "completed";

export type Task = {
    id: string;
    title: string;
    description: string;
    raisedBy: string;
    userEmail: string;
    assignedTo?: string; // team or others
    priority: TaskPriority;
    status: TaskStatus;
    createdAt: string;
};
