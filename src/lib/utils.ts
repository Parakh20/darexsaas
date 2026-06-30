import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatCurrency(value: number, currency = "INR") { return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(value); }
export function formatDate(date: string | Date) { return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date)); }
export function slugify(text: string) { return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
export function ok<T>(data: T) { return { success: true as const, data }; }
export function err(error: string, code?: string) { return { success: false as const, error, code }; }
