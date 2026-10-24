import type { Metadata } from "next";
import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = { title: "Página no encontrada", robots: { index: false } };

export default NotFoundContent;
