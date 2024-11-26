import React, { useState } from 'react';
import { ChevronDown, Folder, Component } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nodeRegistry } from '@/nodes/registry';

interface FolderProps {
  name: string;
  isExpanded: boolean;
  onToggle: () => void;
  level: number;
}

function FolderHeader({ name, isExpanded, onToggle, level }: FolderProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors",
        level > 0 && "ml-4"
      )}
    >
      <Folder className="w-4 h-4" />
      <span className="flex-1 text-left">{name}</span>
      <ChevronDown className={cn(
        "w-4 h-4 transition-transform",
        isExpanded ? "transform rotate-180" : ""
      )} />
    </button>
  );
}

export function FolderStructure() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['llm']));

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderFolder = (folder: any, path: string = '', level: number = 0) => {
    const isExpanded = expandedFolders.has(path);

    return (
      <div key={path} className="space-y-1">
        <FolderHeader
          name={folder.name}
          isExpanded={isExpanded}
          onToggle={() => toggleFolder(path)}
          level={level}
        />
        
        {isExpanded && (
          <div className={cn("space-y-1", level > 0 && "ml-4")}>
            {/* Render nodes in this folder */}
            {folder.nodes?.map((node: any) => {
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

            {/* Render subfolders */}
            {Object.entries(folder.folders || {}).map(([name, subFolder]: [string, any]) => 
              renderFolder(
                { name, ...subFolder },
                path ? `${path}/${name}` : name,
                level + 1
              )
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {renderFolder(nodeRegistry)}
    </div>
  );
}