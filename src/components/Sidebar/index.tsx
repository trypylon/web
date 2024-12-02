import React from "react";
import { NodeList } from "./NodeList";

export function Sidebar() {
  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center space-x-3 mb-8">
        <img src="/logo/light.png" className="w-8 h-8" alt="Pylon Logo" />
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Pylon
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Visual AI Workflow Builder
          </p>
        </div>
      </div>

      <NodeList />
    </div>
  );
}
