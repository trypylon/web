import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeCategory as NodeCategoryType } from '@/types/nodes';
import { registeredNodes } from '@/nodes';

interface NodeCategoryProps {
  category: NodeCategoryType;
  isExpanded: boolean;
  onToggle: () => void;
}

export function NodeCategory({ category, isExpanded, onToggle }: NodeCategoryProps) {
  const nodes = registeredNodes.filter(node => node.category === category);

  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <span>{category}</span>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          isExpanded ? "transform rotate-180" : ""
        )} />
      </button>
      
      <div className={cn(
        "space-y-2 mt-2 transition-all",
        isExpanded ? "block" : "hidden"
      )}>
        {nodes.map((node) => {
          const Icon = node.icon;
          return (
            <div
              key={node.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', node.type);
              }}
              className="flex items-start space-x-3 p-3 mx-2 rounded-lg cursor-move hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="p-2 rounded-lg bg-blue-500 dark:bg-blue-600 shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {node.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {node.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}