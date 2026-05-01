"use client";

import { CanvasComponent, useCanvasStore } from "@/lib/canvas-storage";
import { components } from "@/lib/tambo";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TamboComponent } from "@tambo-ai/react";
import {
  CheckIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";

// Define a generic component props interface that includes our canvas-specific props
type CanvasComponentProps = CanvasComponent;

export const ComponentsCanvas: React.FC<
  React.HTMLAttributes<HTMLDivElement>
> = ({ className, ...props }) => {
  const {
    canvases,
    activeCanvasId,
    createCanvas,
    updateCanvas,
    removeCanvas,
    setActiveCanvas,
    clearCanvas,
    removeComponent,
    addComponent,
    moveComponent,
  } = useCanvasStore();

  // Track component IDs that have already animated (starts with all IDs present at
  // page load). Adding to this set after the first animation prevents the pop-in
  // from replaying when SortableItem remounts due to parent re-renders.
  const seenComponentIds = React.useRef<Set<string>>(
    new Set(
      canvases.flatMap((c) => c.components.map((comp) => comp.componentId)),
    ),
  );

  const [editingCanvasId, setEditingCanvasId] = React.useState<string | null>(
    null,
  );
  const [pendingDeleteCanvasId, setPendingDeleteCanvasId] = React.useState<
    string | null
  >(null);
  const [editingName, setEditingName] = React.useState("");

  const sensors = useSensors(useSensor(PointerSensor));

  // Set default canvas if none exists
  React.useEffect(() => {
    // Check if localStorage already has canvases before creating a new one
    const existingStore = localStorage.getItem("tambo-canvas-storage");
    const hasExistingCanvases =
      existingStore && JSON.parse(existingStore)?.state?.canvases?.length > 0;

    // Only create a default canvas if we don't have any in storage
    if (!hasExistingCanvases && canvases.length === 0) {
      createCanvas("New Canvas 1");
    } else if (!activeCanvasId && canvases.length > 0) {
      setActiveCanvas(canvases[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on first mount

  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!activeCanvasId) return;

      const data = e.dataTransfer.getData("application/json");
      if (!data) return;

      try {
        const parsed = JSON.parse(data);
        if (!parsed.component || !parsed.props) return;

        const componentProps = parsed.props as CanvasComponentProps;
        const isMovingExisting =
          componentProps._inCanvas &&
          componentProps.componentId &&
          componentProps.canvasId;
        const sourceCanvasId = componentProps.canvasId;
        const componentId =
          componentProps.componentId ||
          `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Skip if reordering within the same canvas (handled by dnd-kit)
        if (isMovingExisting && sourceCanvasId === activeCanvasId) {
          return;
        }

        // Move component between different canvases
        if (
          isMovingExisting &&
          sourceCanvasId &&
          sourceCanvasId !== activeCanvasId
        ) {
          moveComponent(sourceCanvasId, activeCanvasId, componentId);
          return;
        }

        // Add new component to canvas
        addComponent(activeCanvasId, {
          ...componentProps,
          componentId,
          _inCanvas: true,
          _componentType: parsed.component,
        });
      } catch (err) {
        console.error("Invalid drop data", err);
      }
    },
    [activeCanvasId, addComponent, moveComponent],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect =
      e.dataTransfer.effectAllowed === "move" ? "move" : "copy";
  };

  const handleCreateCanvas = React.useCallback(() => {
    createCanvas();
  }, [createCanvas]);

  const startRenameCanvas = React.useCallback(
    (id: string) => {
      const canvas = canvases.find((c) => c.id === id);
      if (!canvas) return;
      setEditingCanvasId(id);
      setEditingName(canvas.name);
      setPendingDeleteCanvasId(null);
    },
    [canvases],
  );

  const saveRenameCanvas = React.useCallback(() => {
    if (!editingCanvasId) return;
    const name = editingName.trim();
    if (name) {
      updateCanvas(editingCanvasId, name);
    }
    setEditingCanvasId(null);
  }, [editingCanvasId, editingName, updateCanvas]);

  const handleDeleteCanvas = React.useCallback(
    (id: string, confirmed = false) => {
      if (confirmed) {
        // Confirmed deletion, actually delete the canvas
        removeCanvas(id);
        setPendingDeleteCanvasId(null);
      } else {
        // Show confirmation UI
        setPendingDeleteCanvasId(id);
        // Auto-cancel after 10 seconds if no action taken
        setTimeout(() => {
          setPendingDeleteCanvasId((current) =>
            current === id ? null : current,
          );
        }, 10000);
      }
    },
    [removeCanvas],
  );

  // Shimmer skeleton shown while a component is still being streamed
  const SkeletonCard: React.FC<{ componentType: string }> = ({ componentType }) => {
    const isGraph = componentType === "Graph";
    return (
      <div
        className="rounded-lg border border-border/40 overflow-hidden"
        style={{
          background: "hsl(var(--card, 0 0% 100%))",
          minHeight: isGraph ? 220 : 160,
          position: "relative",
        }}
      >
        {/* Shimmer overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.6s ease-in-out infinite",
          }}
        />
        <div className="p-4 flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
            <div className="h-3 w-1/5 rounded bg-muted/60 animate-pulse" />
          </div>
          {isGraph ? (
            <>
              {/* Fake chart bars */}
              <div className="flex items-end gap-2 pt-2" style={{ height: 100 }}>
                {[55, 75, 45, 90, 65, 80, 50].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-muted animate-pulse"
                    style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
              <div className="h-3 w-2/3 rounded bg-muted/60 animate-pulse" />
            </>
          ) : (
            <>
              <div className="h-3 w-full rounded bg-muted animate-pulse" />
              <div className="h-3 w-5/6 rounded bg-muted/60 animate-pulse" />
              <div className="h-3 w-4/6 rounded bg-muted/40 animate-pulse" />
              <div className="mt-1 h-3 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-muted/60 animate-pulse" />
            </>
          )}
        </div>
        {/* Label */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 12,
            fontSize: 10,
            fontFamily: "JetBrains Mono, monospace",
            color: "rgba(52,211,153,0.5)",
            letterSpacing: "0.04em",
          }}
        >
          generating…
        </div>
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    );
  };

  // Find component definition from registry
  const renderComponent = (componentProps: CanvasComponentProps) => {
    const componentType = componentProps._componentType;

    // Show skeleton while the AI is still generating this component
    if (componentProps._isStreaming) {
      return <SkeletonCard componentType={componentType} />;
    }

    const componentDef = components.find(
      (comp: TamboComponent) => comp.name === componentType,
    );

    if (!componentDef) {
      return (
        <div key={componentProps.componentId}>
          Unknown component type: {componentType}
        </div>
      );
    }

    const Component = componentDef.component;
    // Filter out our custom props that shouldn't be passed to the component
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _componentType, componentId, canvasId, _inCanvas, _isStreaming, ...cleanProps } =
      componentProps;

    return <Component {...cleanProps} />;
  };

  const SortableItem: React.FC<{
    componentProps: CanvasComponentProps;
    isNew: boolean;
  }> = ({ componentProps, isNew }) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: componentProps.componentId, disabled: !!componentProps._isStreaming });

    // Pop-in animation state: start collapsed if newly added, skip if pre-existing
    const [visible, setVisible] = React.useState(!isNew);
    // Exit animation state
    const [removing, setRemoving] = React.useState(false);
    // Tracks when a skeleton just resolved so we can fade the real content in
    const prevIsStreamingRef = React.useRef(componentProps._isStreaming);
    const [contentVisible, setContentVisible] = React.useState(!componentProps._isStreaming);

    React.useEffect(() => {
      if (!isNew) return;
      // Mark as seen immediately so any future remount of this item skips animation
      seenComponentIds.current.add(componentProps.componentId);
      // Defer to next frame so the initial hidden state is painted first
      const rafId = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(rafId);
    }, [isNew, componentProps.componentId]);

    // Fade the real content in when streaming resolves
    React.useEffect(() => {
      if (prevIsStreamingRef.current && !componentProps._isStreaming) {
        // Transition: skeleton → real content
        const rafId = requestAnimationFrame(() => setContentVisible(true));
        prevIsStreamingRef.current = false;
        return () => cancelAnimationFrame(rafId);
      }
      prevIsStreamingRef.current = componentProps._isStreaming ?? false;
    }, [componentProps._isStreaming]);

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    // Extract the necessary props for the delete button
    const { canvasId, componentId, _componentType } = componentProps;

    const removeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

    React.useEffect(() => {
      return () => {
        if (removeTimerRef.current !== null) {
          clearTimeout(removeTimerRef.current);
        }
      };
    }, []);

    const handleRemove = React.useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!canvasId || !componentId || removing) return;
        setRemoving(true);
        removeTimerRef.current = setTimeout(() => {
          removeComponent(canvasId, componentId);
        }, 200);
      },
      [canvasId, componentId, removing],
    );

    return (
      <div
        className="relative group"
        style={{
          opacity: removing ? 0 : visible ? 1 : 0,
          scale: removing ? "0.92" : visible ? "1" : "0.92",
          transition: "opacity 200ms ease-in, scale 200ms ease-in",
          width: "100%",
        }}
      >
        {/* Delete button outside the sortable area */}
        <div className="absolute -top-2 -right-2 z-50">
          <button
            onMouseDown={handleRemove}
            className="bg-background border border-border rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </div>

        {/* Sortable content - make it draggable to other canvases */}
        <div
          ref={setNodeRef}
          style={{
            ...style,
            // Fade real content in after streaming resolves
            opacity: componentProps._isStreaming ? 1 : contentVisible ? 1 : 0,
            transition: [style.transition, "opacity 350ms ease-in"].filter(Boolean).join(", "),
          }}
          {...attributes}
          {...listeners}
          draggable={!componentProps._isStreaming}
          onDragStart={(e) => {
            // Prevent dragging while still generating
            if (componentProps._isStreaming) { e.preventDefault(); return; }
            // Set drag data for moving between canvases
            const dragData = {
              component: _componentType,
              props: {
                ...componentProps,
                _inCanvas: true,
                componentId,
                canvasId,
              },
            };
            e.dataTransfer.setData(
              "application/json",
              JSON.stringify(dragData),
            );
            e.dataTransfer.effectAllowed = "move";
          }}
          className="cursor-move"
        >
          {renderComponent(componentProps)}
        </div>
      </div>
    );
  };

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !activeCanvasId) return;

      if (active.id !== over.id) {
        const overIndex = useCanvasStore
          .getState()
          .getComponents(activeCanvasId)
          .findIndex((c) => c.componentId === over.id);
        if (overIndex === -1) return;
        useCanvasStore
          .getState()
          .reorderComponent(activeCanvasId, active.id as string, overIndex);
      }
    },
    [activeCanvasId],
  );

  const activeCanvas = canvases.find((c) => c.id === activeCanvasId);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={cn("w-full h-full flex flex-col relative", className)}
      {...props}
    >
      <div
        className={cn(
          "flex items-center overflow-x-auto p-2 pr-10 gap-1",
          "[&::-webkit-scrollbar]:w-[6px]",
          "[&::-webkit-scrollbar-thumb]:bg-gray-300",
          "[&::-webkit-scrollbar:horizontal]:h-[4px]",
        )}
      >
        {canvases.map((c) => (
          <div
            key={c.id}
            data-canvas-id={c.id}
            onClick={() => {
              setActiveCanvas(c.id);
              setPendingDeleteCanvasId(null);
            }}
            className={cn(
              "px-3 py-1 text-sm cursor-pointer whitespace-nowrap flex items-center gap-1 border-b-2",
              activeCanvasId === c.id
                ? "border-border text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {editingCanvasId === c.id ? (
              <>
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="bg-transparent border-b border-border/50 focus:outline-none text-sm w-24"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveRenameCanvas();
                  }}
                  className="ml-1 p-0.5 hover:text-foreground"
                  title="Save"
                >
                  <CheckIcon className="h-3 w-3" />
                </button>
              </>
            ) : (
              <>
                <span>{c.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startRenameCanvas(c.id);
                  }}
                  className="ml-1 p-0.5 hover:text-foreground"
                  title="Rename"
                >
                  <PencilIcon className="h-3 w-3" />
                </button>
                {canvases.length > 1 &&
                  (pendingDeleteCanvasId === c.id ? (
                    <div className="ml-1 flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-400/30 rounded text-xs text-destructive dark:text-red-300">
                      <span>Delete?</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCanvas(c.id, true);
                        }}
                        className="p-0.5 hover:text-red-900 dark:hover:text-red-100"
                        title="Confirm delete"
                      >
                        <CheckIcon className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDeleteCanvasId(null);
                        }}
                        className="p-0.5 hover:text-red-900 dark:hover:text-red-100"
                        title="Cancel delete"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCanvas(c.id);
                      }}
                      className="ml-1 p-0.5 hover:text-foreground"
                      title="Delete canvas"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  ))}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="absolute top-2 right-2">
        <button
          onClick={handleCreateCanvas}
          className="p-1 hover:text-foreground bg-background/80 backdrop-blur-sm rounded"
          title="New canvas"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute bottom-4 right-4 z-50 bg-background rounded-md">
        {activeCanvasId && (
          <button
            onClick={() => activeCanvasId && clearCanvas(activeCanvasId)}
            className="px-3 py-1.5 border border-gray-200 text-primary hover:text-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 rounded-md shadow-sm flex items-center gap-1.5 text-sm cursor-pointer"
            title="Clear canvas"
          >
            <XIcon className="h-4 w-4" />
            <span>Clear Canvas</span>
          </button>
        )}
      </div>

      {/* Animated dot-grid background */}
      <style>{`
        @keyframes dotDrift {
          0%   { background-position: 0px 0px; }
          100% { background-position: 28px 28px; }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 0.85; }
        }
        .canvas-dot-grid {
          animation: dotDrift 12s linear infinite, dotPulse 6s ease-in-out infinite;
        }
      `}</style>
      <div
        className="canvas-dot-grid"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(52,211,153,0.28) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        className={cn(
          "flex-1 overflow-auto p-4",
          "[&::-webkit-scrollbar]:w-[6px]",
          "[&::-webkit-scrollbar-thumb]:bg-gray-300",
          "[&::-webkit-scrollbar:horizontal]:h-[4px]",
        )}
        style={{ position: "relative", zIndex: 1 }}
      >
        {!activeCanvas || activeCanvas.components.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Drag components here
          </div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext
              items={activeCanvas.components.map((c) => c.componentId)}
              strategy={rectSortingStrategy}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                  gap: 16,
                  alignItems: "start",
                }}
              >
                {activeCanvas.components.map((c) => (
                  <SortableItem
                    key={c.componentId}
                    componentProps={c}
                    isNew={!seenComponentIds.current.has(c.componentId)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export default ComponentsCanvas;
