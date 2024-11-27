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
      <div
        ref={panelRef}
        className={cn("relative", className)}
        style={{ height: `${height}px` }}
        {...props}
      >
        {children}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize",
            isDragging && "bg-blue-500/10"
          )}
          onMouseDown={handleMouseDown}
        />
      </div>
    );
  }
);

ResizablePanel.displayName = "ResizablePanel";
