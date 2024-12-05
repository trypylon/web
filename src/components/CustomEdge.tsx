import React from "react";
import { BaseEdge, EdgeProps, getBezierPath } from "reactflow";
import { X } from "lucide-react";
import { useFlowStore } from "../store/flowStore";

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);

  const handleDelete = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onEdgesChange([{ id, type: "remove" }]);
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <foreignObject
        width={24}
        height={24}
        x={labelX - 12}
        y={labelY - 12}
        className="edge-delete-button"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div
          className="flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-red-50 dark:hover:bg-red-900 cursor-pointer transition-colors"
          style={{ backdropFilter: "none", WebkitBackdropFilter: "none" }}
          onClick={handleDelete}
        >
          <div className="absolute inset-0 rounded-full bg-white dark:bg-gray-800" />
          <X className="w-4 h-4 text-red-500 dark:text-red-400 relative z-10" />
        </div>
      </foreignObject>
    </>
  );
}
