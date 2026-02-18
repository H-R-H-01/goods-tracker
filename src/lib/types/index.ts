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
    createdAt: string; // stored as ISO string
    comments?: string;
};
