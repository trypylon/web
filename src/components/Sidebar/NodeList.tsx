import React, { useState } from 'react';
import { ChevronDown, Component } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nodeRegistry } from '@/nodes/registry';

interface FolderProps {
  name: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function FolderHeader({ name, isExpanded, onToggle }: FolderProps) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
    >
      <span>{name}</span>
      <ChevronDown className={cn(
        "w-4 h-4 transition-transform",
        isExpanded ? "transform rotate-180" : ""
      )} />
    </button>
  );
}

export function NodeList() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['llm']));

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const renderNode = (node: any) => {
    const Icon = node.icon || Component;
    return (
      <div
        key={node.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/reactflow', node.type);
        }}
        className="flex items-start space-x-3 p-3 mx-2 rounded-lg cursor-move hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className={cn(
          "p-2 rounded-lg shrink-0",
          node.type === 'OpenAI' ? 'bg-emerald-500' : 'bg-blue-500'
        )}>
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
  };

  const renderCategory = (categoryName: string, category: any) => {
    const isExpanded = expandedCategories.has(categoryName);
    
    // Skip empty categories
    if (!category.folders || Object.keys(category.folders).length === 0) {
      return null;
    }

    return (
      <div key={categoryName} className="mb-4">
        <FolderHeader
          name={category.name}
          isExpanded={isExpanded}
          onToggle={() => toggleCategory(categoryName)}
        />
        
        {isExpanded && (
          <div className="mt-2 space-y-2">
            {Object.entries(category.folders).map(([providerName, provider]: [string, any]) => {
              if (!provider.nodes?.length) return null;
              
              return (
                <div key={providerName} className="space-y-1">
                  <div className="px-4 py-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      {provider.name}
                    </span>
                  </div>
                  {provider.nodes.map(renderNode)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {Object.entries(nodeRegistry.folders).map(([categoryName, category]) => 
        renderCategory(categoryName, category)
      )}
    </div>
  );
}