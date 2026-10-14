import React from "react";
import { createRoot } from "react-dom/client";
import ZenyFarmTracker from "./ZenyFarmTracker.jsx";
import "./styles.css";

const roots = new WeakMap();

export default function renderTracker(component) {
  const { parentElement, data } = component;
  let root = roots.get(parentElement);
  if (!root) {
    const mount = parentElement.querySelector(".zeny-tracker-root");
    if (!mount) throw new Error("Zeny Tracker mount point is missing.");
    root = createRoot(mount);
    roots.set(parentElement, root);
  }
  root.render(<ZenyFarmTracker initialBackup={data?.initialBackup} />);
  return () => {
    const mounted = roots.get(parentElement);
    if (mounted) {
      mounted.unmount();
      roots.delete(parentElement);
    }
  };
}
