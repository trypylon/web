import * as React from "react";
import { cn } from "@/lib/utils";

interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  minHeight?: number;
  maxHeight?: number;
  defaultHeight?: number;
  onHeightChange?: (height: number) => void;
}

export const ResizablePanel = React.forwardRef<
  HTMLDivElement,
  ResizablePanelProps
>(
  (
    {
      className,
      children,
      minHeight = 200,
      maxHeight = 800,
      defaultHeight = 500,
      onHeightChange,
      ...props
    },
    ref
  ) => {
    const [height, setHeight] = React.useState(defaultHeight);
    const [isDragging, setIsDragging] = React.useState(false);
    const panelRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (!panelRef.current) return;
      const content = panelRef.current;
      const scrollHeight = content.scrollHeight;
      if (scrollHeight > height && scrollHeight < maxHeight) {
        setHeight(Math.min(scrollHeight + 40, maxHeight));
      }
    }, [children, maxHeight, height]);

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = React.useCallback(
      (e: MouseEvent) => {
        if (!panelRef.current) return;

        const panelTop = panelRef.current.getBoundingClientRect().top;
        const newHeight = Math.min(
          Math.max(e.clientY - panelTop, minHeight),
          maxHeight
        );

        setHeight(newHeight);
        onHeightChange?.(newHeight);
      },
      [minHeight, maxHeight, onHeightChange]
    );

    const handleMouseUp = React.useCallback(() => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }, [handleMouseMove]);

    React.useEffect(() => {
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [handleMouseMove, handleMouseUp]);

    return (
      <div className="relative" style={{ height: `${height}px` }}>
        <div
          ref={panelRef}
          className={cn("h-full overflow-auto", className)}
          {...props}
        >
          {children}
        </div>
        <div
          className={cn(
            "sticky bottom-0 left-0 right-0 h-4 cursor-ns-resize hover:bg-blue-500/10",
            isDragging && "bg-blue-500/10",
            "before:absolute before:bottom-0 before:left-0 before:right-0 before:h-8 before:bg-gradient-to-t before:from-white before:to-transparent before:dark:from-gray-800 before:pointer-events-none"
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
      </div>
    );
  }
);

ResizablePanel.displayName = "ResizablePanel";
