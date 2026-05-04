/**
 * canvas-storage.ts
 * Central library for canvas storage operations and data types
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Canvas data model types
export interface CanvasComponent {
  componentId: string;
  _componentType: string;
  _inCanvas?: boolean;
  canvasId?: string;
  /** True while the AI is still streaming this component — never persisted */
  _isStreaming?: boolean;
  [key: string]: unknown;
}

export interface Canvas {
  id: string;
  name: string;
  components: CanvasComponent[];
  /** When true, all mutating store actions become no-ops for this canvas.
   *  Used by the shared-canvas importer so visitors view a read-only snapshot
   *  until they explicitly clear it and start their own. */
  isReadOnly?: boolean;
}

export interface CanvasState {
  canvases: Canvas[];
  activeCanvasId: string | null;
  pendingOperations: Set<string>;
  // Actions
  getCanvases: () => Canvas[];
  getCanvas: (id: string) => Canvas | undefined;
  getComponents: (canvasId: string) => CanvasComponent[];
  createCanvas: (name?: string, opts?: { isReadOnly?: boolean }) => Canvas;
  /** Flip a canvas out of read-only mode (used by the "Clear snapshot" UX). */
  unlockCanvas: (id: string) => void;
  updateCanvas: (id: string, name: string) => Canvas | null;
  removeCanvas: (id: string) => void;
  setActiveCanvas: (id: string | null) => void;
  reorderCanvas: (canvasId: string, newIndex: number) => void;
  clearCanvas: (id: string) => void;
  addComponent: (canvasId: string, component: CanvasComponent) => void;
  updateComponent: (
    canvasId: string,
    componentId: string,
    props: Record<string, unknown>,
  ) => CanvasComponent | null;
  removeComponent: (canvasId: string, componentId: string) => void;
  moveComponent: (
    sourceCanvasId: string,
    targetCanvasId: string,
    componentId: string,
  ) => CanvasComponent | null;
  reorderComponent: (
    canvasId: string,
    componentId: string,
    newIndex: number,
  ) => void;
}

// Generate a unique ID for components or canvases
export const generateId = () =>
  `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Identity key used to detect duplicate components inside a canvas.
 * The AI sometimes generates the same logical card twice with different
 * componentIds, which used to slip through the componentId check.
 *
 * Singletons (StatCard, SkillRadar, TimelineCard) are keyed by type alone —
 * only one per canvas. ProjectShowcase is keyed by projectName and ResumeCard
 * by targetRole so legitimately distinct variants are still allowed. All
 * other / unknown component types fall through to a per-instance key so they
 * are NOT deduped (componentId remains the only collision check).
 */
const SINGLETON_TYPES = new Set(["StatCard", "SkillRadar", "TimelineCard"]);

export const getDedupeKey = (c: CanvasComponent): string => {
  const t = c._componentType;
  if (t === "ProjectShowcase") {
    const name = typeof c.projectName === "string" ? c.projectName.trim().toLowerCase() : "";
    return `ProjectShowcase:${name}`;
  }
  if (t === "ResumeCard") {
    const role = typeof c.targetRole === "string" ? c.targetRole.trim().toLowerCase() : "";
    return `ResumeCard:${role}`;
  }
  if (SINGLETON_TYPES.has(t)) {
    return t;
  }
  // Unknown / future types: never collide via this key (componentId still checked).
  return `__nodedupe__:${c.componentId || Math.random()}`;
};

// Create the store with persistence
export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      canvases: [],
      activeCanvasId: null,
      pendingOperations: new Set<string>(),

      // Get all canvases
      getCanvases: () => get().canvases,

      // Get a specific canvas by ID
      getCanvas: (id: string) => get().canvases.find((c) => c.id === id),

      // Get components for a specific canvas
      getComponents: (canvasId: string) => {
        const canvas = get().canvases.find((c) => c.id === canvasId);
        return canvas?.components || [];
      },

      // Create a new canvas
      createCanvas: (name?: string, opts?: { isReadOnly?: boolean }) => {
        const id = generateId();
        const canvases = get().canvases;
        const canvasName = name || `New Canvas ${canvases.length + 1}`;
        const newCanvas: Canvas = {
          id,
          name: canvasName,
          components: [],
          ...(opts?.isReadOnly ? { isReadOnly: true } : {}),
        };

        set((state) => ({
          canvases: [...state.canvases, newCanvas],
          activeCanvasId: id,
        }));

        return newCanvas;
      },

      // Flip a canvas out of read-only mode
      unlockCanvas: (id: string) => {
        set((state) => ({
          canvases: state.canvases.map((c) =>
            c.id === id ? { ...c, isReadOnly: false } : c,
          ),
        }));
      },

      // Update canvas name
      updateCanvas: (id: string, name: string) => {
        const updatedName = name.trim();
        if (!updatedName) return null;

        let updatedCanvas: Canvas | null = null;

        set((state) => {
          const updatedCanvases = state.canvases.map((c) => {
            if (c.id === id) {
              updatedCanvas = { ...c, name: updatedName };
              return updatedCanvas;
            }
            return c;
          });

          return { canvases: updatedCanvases };
        });

        return updatedCanvas;
      },

      // Remove a canvas
      removeCanvas: (id: string) => {
        set((state) => {
          const updatedCanvases = state.canvases.filter((c) => c.id !== id);
          let activeId = state.activeCanvasId;

          // If we're removing the active canvas, select another one
          if (activeId === id) {
            activeId = updatedCanvases[0]?.id || null;
          }

          return {
            canvases: updatedCanvases,
            activeCanvasId: activeId,
          };
        });
      },

      // Set the active canvas
      setActiveCanvas: (id: string | null) => {
        set({ activeCanvasId: id });
      },

      // Reorder canvases (tabs) by moving the specified canvasId to newIndex
      reorderCanvas: (canvasId: string, newIndex: number) => {
        set((state) => {
          const currentIndex = state.canvases.findIndex(
            (c) => c.id === canvasId,
          );
          if (currentIndex === -1) return state;

          const canvasesCopy = [...state.canvases];
          const [moving] = canvasesCopy.splice(currentIndex, 1);
          const boundedIndex = Math.max(
            0,
            Math.min(canvasesCopy.length, newIndex),
          );
          canvasesCopy.splice(boundedIndex, 0, moving);

          return { canvases: canvasesCopy };
        });
      },

      // Clear all components from a canvas
      clearCanvas: (id: string) => {
        const target = get().canvases.find((c) => c.id === id);
        if (target?.isReadOnly) return;
        set((state) => ({
          canvases: state.canvases.map((c) =>
            c.id === id ? { ...c, components: [] } : c,
          ),
        }));
      },

      // Add a component to a canvas
      addComponent: (canvasId: string, componentProps: CanvasComponent) => {
        const targetCanvasReadOnly = get().canvases.find((c) => c.id === canvasId)?.isReadOnly;
        if (targetCanvasReadOnly) {
          console.log(`[CANVAS] addComponent blocked — canvas ${canvasId} is read-only`);
          return;
        }
        const componentId = componentProps.componentId || generateId();

        // Check for duplicate operations
        const operationKey = `add-${componentId}-${canvasId}`;
        const pendingOps = get().pendingOperations;

        if (pendingOps.has(operationKey)) {
          console.log(`[CANVAS] Skipping duplicate operation: ${operationKey}`);
          return;
        }

        // Mark operation as pending
        pendingOps.add(operationKey);
        set({ pendingOperations: new Set(pendingOps) });

        // Update state
        set((state) => {
          // Check if component already exists (by id OR by type-based dedupe key)
          const targetCanvas = state.canvases.find((c) => c.id === canvasId);
          const incomingKey = getDedupeKey({ ...componentProps, componentId });
          if (
            targetCanvas &&
            targetCanvas.components.some(
              (c) =>
                c.componentId === componentId ||
                getDedupeKey(c) === incomingKey,
            )
          ) {
            console.log(
              `[CANVAS] Skipping duplicate ${componentProps._componentType} (${incomingKey}) in canvas ${canvasId}`,
            );
            // Remove operation from pending after 100ms
            setTimeout(() => {
              const ops = get().pendingOperations;
              ops.delete(operationKey);
              set({ pendingOperations: new Set(ops) });
            }, 100);
            return state;
          }

          const updatedCanvases = state.canvases.map((c) =>
            c.id === canvasId
              ? {
                  ...c,
                  components: [
                    ...c.components,
                    {
                      ...componentProps,
                      componentId,
                      _inCanvas: true,
                      canvasId,
                    },
                  ],
                }
              : c,
          );

          // Remove operation from pending after 100ms
          setTimeout(() => {
            const ops = get().pendingOperations;
            ops.delete(operationKey);
            set({ pendingOperations: new Set(ops) });
          }, 100);

          return { canvases: updatedCanvases };
        });
      },

      // Update a component's props
      updateComponent: (
        canvasId: string,
        componentId: string,
        props: Record<string, unknown>,
      ) => {
        if (get().canvases.find((c) => c.id === canvasId)?.isReadOnly) return null;
        let updatedComponent: CanvasComponent | null = null;

        set((state) => {
          const updatedCanvases = state.canvases.map((c) => {
            if (c.id !== canvasId) return c;

            const updatedComponents = c.components.map((comp) => {
              if (comp.componentId !== componentId) return comp;

              updatedComponent = { ...comp, ...props };
              return updatedComponent;
            });

            return { ...c, components: updatedComponents };
          });

          return { canvases: updatedCanvases };
        });

        return updatedComponent;
      },

      // Remove a component from a canvas
      removeComponent: (canvasId: string, componentId: string) => {
        if (get().canvases.find((c) => c.id === canvasId)?.isReadOnly) return;
        set((state) => ({
          canvases: state.canvases.map((c) =>
            c.id === canvasId
              ? {
                  ...c,
                  components: c.components.filter(
                    (comp) => comp.componentId !== componentId,
                  ),
                }
              : c,
          ),
        }));
      },

      // Move a component from one canvas to another
      moveComponent: (
        sourceCanvasId: string,
        targetCanvasId: string,
        componentId: string,
      ) => {
        // Skip if source and target are the same
        if (sourceCanvasId === targetCanvasId) return null;
        const cs = get().canvases;
        if (cs.find((c) => c.id === sourceCanvasId)?.isReadOnly) return null;
        if (cs.find((c) => c.id === targetCanvasId)?.isReadOnly) return null;

        const operationKey = `move-${componentId}-${sourceCanvasId}-${targetCanvasId}`;
        const pendingOps = get().pendingOperations;

        if (pendingOps.has(operationKey)) {
          console.log(
            `[CANVAS] Skipping duplicate move operation: ${operationKey}`,
          );
          return null;
        }

        // Mark operation as pending
        pendingOps.add(operationKey);
        set({ pendingOperations: new Set(pendingOps) });

        // Always clear the pending op after this call returns, regardless of
        // which branch was taken inside set(). Without this, an early return
        // (missing source/component/target, or duplicate-detected) would leave
        // the operationKey wedged in pendingOperations forever, blocking all
        // subsequent identical moves.
        const clearPending = () =>
          setTimeout(() => {
            const ops = get().pendingOperations;
            ops.delete(operationKey);
            set({ pendingOperations: new Set(ops) });
          }, 100);

        let movedComponent: CanvasComponent | null = null;

        set((state) => {
          // Find component in source canvas
          const sourceCanvas = state.canvases.find(
            (c) => c.id === sourceCanvasId,
          );
          if (!sourceCanvas) return state;

          const component = sourceCanvas.components.find(
            (c) => c.componentId === componentId,
          );
          if (!component) return state;

          // Check if component already exists in target (by id OR by dedupe key)
          const targetCanvas = state.canvases.find(
            (c) => c.id === targetCanvasId,
          );
          const incomingKey = getDedupeKey(component);
          if (
            targetCanvas &&
            targetCanvas.components.some(
              (c) =>
                c.componentId === componentId ||
                getDedupeKey(c) === incomingKey,
            )
          ) {
            console.log(
              `[CANVAS] Skipping duplicate move of ${component._componentType} (${incomingKey}) into canvas ${targetCanvasId}`,
            );
            return state;
          }

          // Create updated component
          movedComponent = {
            ...component,
            canvasId: targetCanvasId,
          };

          // Remove from source and add to target
          const updatedCanvases = state.canvases.map((c) => {
            if (c.id === sourceCanvasId) {
              return {
                ...c,
                components: c.components.filter(
                  (comp) => comp.componentId !== componentId,
                ),
              };
            }
            if (c.id === targetCanvasId) {
              return {
                ...c,
                components: [...c.components, movedComponent!],
              };
            }
            return c;
          });

          return { canvases: updatedCanvases };
        });

        clearPending();
        return movedComponent;
      },

      // Reorder a component within a canvas
      reorderComponent: (
        canvasId: string,
        componentId: string,
        newIndex: number,
      ) => {
        if (get().canvases.find((c) => c.id === canvasId)?.isReadOnly) return;
        set((state) => {
          const updatedCanvases = state.canvases.map((c) => {
            if (c.id !== canvasId) return c;

            // Find the component
            const componentIndex = c.components.findIndex(
              (comp) => comp.componentId === componentId,
            );
            if (componentIndex === -1) return c;

            // Create a new components array
            const newComponents = [...c.components];

            // Remove component from current position
            const [component] = newComponents.splice(componentIndex, 1);

            // Clamp newIndex to array bounds
            const boundedIndex = Math.max(
              0,
              Math.min(newComponents.length, newIndex),
            );

            // Insert at new position
            newComponents.splice(boundedIndex, 0, component);

            return {
              ...c,
              components: newComponents,
            };
          });

          return { canvases: updatedCanvases };
        });
      },
    }),
    {
      name: "tambo-canvas-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Strip skeleton-only entries so a page reload never shows stuck skeletons
        canvases: state.canvases.map((c) => ({
          ...c,
          components: c.components.filter((comp) => !comp._isStreaming),
        })),
        activeCanvasId: state.activeCanvasId,
      }),
    },
  ),
);
