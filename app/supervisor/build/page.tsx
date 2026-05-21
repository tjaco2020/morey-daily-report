import { redirect } from "next/navigation";
import { todayLocal } from "@/lib/format";

export default function BuildIndex() {
  redirect(`/supervisor/build/${todayLocal()}`);
}
