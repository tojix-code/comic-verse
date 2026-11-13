"use client";
import { useEffect, useState } from "react";
import { Activity, AlertCircle, LoaderCircle } from "lucide-react";
import { checkApiHealth } from "@/lib/api";

type State = "checking" | "online" | "offline";
export function ApiStatus() {
  const [state, setState] = useState<State>("checking");
  useEffect(() => {
    let active = true;
    checkApiHealth().then(() => active && setState("online")).catch(() => active && setState("offline"));
    return () => { active = false; };
  }, []);
  return <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300">
    {state === "checking" ? <LoaderCircle size={13} className="animate-spin text-zinc-400" /> : state === "online" ? <Activity size={13} className="text-emerald-400" /> : <AlertCircle size={13} className="text-rose-400" />}
    <span>API {state === "checking" ? "checking" : state}</span>
    <span className={`h-1.5 w-1.5 rounded-full ${state === "online" ? "bg-emerald-400" : state === "offline" ? "bg-rose-400" : "bg-zinc-500"}`} />
  </div>;
}
