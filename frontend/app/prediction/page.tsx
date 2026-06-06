"use client";

import { redirect } from "next/navigation";

export default function PredictionPage() {
  redirect("/dashboard/predict");
}
