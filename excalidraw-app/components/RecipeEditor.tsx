import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import { CaptureUpdateAction } from "@excalidraw/element";
import { randomId } from "@excalidraw/common";
import React, { useCallback, useState } from "react";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElementSkeleton } from "@excalidraw/element/transform";

import "./RecipeEditor.scss";

interface RecipeIngredient {
  id: string;
  name: string;
}

interface RecipeStep {
  id: string;
  name: string;
}

interface RecipeDependency {
  fromId: string;
  toId: string;
}

const INGREDIENT_COLORS = [
  "#a5d8ff",
  "#d0bfff",
  "#ffc9c9",
  "#b2f2bb",
  "#ffec99",
  "#c3fae8",
  "#eebefa",
  "#ffd8a8",
];

const STEP_COLORS = [
  "#fff3bf",
  "#d3f9d8",
  "#e7f5ff",
  "#fff0f6",
  "#f3f0ff",
  "#fff4e6",
  "#e6fcf5",
  "#f8f0fc",
];

const LAYOUT = {
  ingredientWidth: 160,
  ingredientHeight: 70,
  stepWidth: 200,
  stepHeight: 80,
  horizontalGap: 40,
  verticalGap: 120,
  titleY: 0,
  ingredientStartY: 80,
  stepStartY: 300,
} as const;

export const RecipeEditor: React.FC<{
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}> = ({ excalidrawAPI }) => {
  const [recipeName, setRecipeName] = useState("");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [steps, setSteps] = useState<RecipeStep[]>([]);
  const [dependencies, setDependencies] = useState<RecipeDependency[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [newStep, setNewStep] = useState("");
  const [depFrom, setDepFrom] = useState("");
  const [depTo, setDepTo] = useState("");

  const addIngredient = useCallback(() => {
    if (!newIngredient.trim()) {
      return;
    }
    setIngredients((prev) => [
      ...prev,
      { id: randomId(), name: newIngredient.trim() },
    ]);
    setNewIngredient("");
  }, [newIngredient]);

  const addStep = useCallback(() => {
    if (!newStep.trim()) {
      return;
    }
    setSteps((prev) => [...prev, { id: randomId(), name: newStep.trim() }]);
    setNewStep("");
  }, [newStep]);

  const addDependency = useCallback(() => {
    if (!depFrom || !depTo || depFrom === depTo) {
      return;
    }
    const exists = dependencies.some(
      (d) => d.fromId === depFrom && d.toId === depTo,
    );
    if (exists) {
      return;
    }
    setDependencies((prev) => [...prev, { fromId: depFrom, toId: depTo }]);
    setDepFrom("");
    setDepTo("");
  }, [depFrom, depTo, dependencies]);

  const removeIngredient = useCallback((id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    setDependencies((prev) =>
      prev.filter((d) => d.fromId !== id && d.toId !== id),
    );
  }, []);

  const removeStep = useCallback((id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
    setDependencies((prev) =>
      prev.filter((d) => d.fromId !== id && d.toId !== id),
    );
  }, []);

  const removeDependency = useCallback((fromId: string, toId: string) => {
    setDependencies((prev) =>
      prev.filter((d) => !(d.fromId === fromId && d.toId === toId)),
    );
  }, []);

  const allNodes = [
    ...ingredients.map((i) => ({ ...i, type: "ingredient" as const })),
    ...steps.map((s) => ({ ...s, type: "step" as const })),
  ];

  const getNodeLabel = (id: string) => {
    const node = allNodes.find((n) => n.id === id);
    return node?.name ?? id;
  };

  const generateDiagram = useCallback(() => {
    if (!excalidrawAPI) {
      return;
    }
    if (ingredients.length === 0 && steps.length === 0) {
      return;
    }

    const elementSkeletons: ExcalidrawElementSkeleton[] = [];
    const nodePositions = new Map<string, { x: number; y: number }>();

    const totalIngredientWidth =
      ingredients.length * LAYOUT.ingredientWidth +
      (ingredients.length - 1) * LAYOUT.horizontalGap;
    const totalStepWidth =
      steps.length * LAYOUT.stepWidth +
      (steps.length - 1) * LAYOUT.horizontalGap;
    const totalWidth = Math.max(totalIngredientWidth, totalStepWidth, 300);

    const startX = 100;

    if (recipeName.trim()) {
      elementSkeletons.push({
        type: "text",
        x: startX + totalWidth / 2 - 100,
        y: LAYOUT.titleY,
        text: recipeName.trim(),
        fontSize: 28,
        strokeColor: "#1e1e1e",
      } as ExcalidrawElementSkeleton);
    }

    const ingredientOffsetX = startX + (totalWidth - totalIngredientWidth) / 2;
    ingredients.forEach((ingredient, index) => {
      const x =
        ingredientOffsetX +
        index * (LAYOUT.ingredientWidth + LAYOUT.horizontalGap);
      const y = LAYOUT.ingredientStartY;
      const elId = `ingredient-${ingredient.id}`;

      nodePositions.set(ingredient.id, {
        x: x + LAYOUT.ingredientWidth / 2,
        y: y + LAYOUT.ingredientHeight / 2,
      });

      elementSkeletons.push({
        type: "ellipse",
        id: elId,
        x,
        y,
        width: LAYOUT.ingredientWidth,
        height: LAYOUT.ingredientHeight,
        backgroundColor: INGREDIENT_COLORS[index % INGREDIENT_COLORS.length],
        fillStyle: "solid",
        strokeWidth: 2,
        strokeColor: "#1e1e1e",
        roundness: { type: 2 },
        label: {
          text: ingredient.name,
          fontSize: 16,
          strokeColor: "#1e1e1e",
        },
      } as ExcalidrawElementSkeleton);
    });

    const stepOffsetX = startX + (totalWidth - totalStepWidth) / 2;
    steps.forEach((step, index) => {
      const x = stepOffsetX + index * (LAYOUT.stepWidth + LAYOUT.horizontalGap);
      const y = LAYOUT.stepStartY;
      const elId = `step-${step.id}`;

      nodePositions.set(step.id, {
        x: x + LAYOUT.stepWidth / 2,
        y: y + LAYOUT.stepHeight / 2,
      });

      elementSkeletons.push({
        type: "rectangle",
        id: elId,
        x,
        y,
        width: LAYOUT.stepWidth,
        height: LAYOUT.stepHeight,
        backgroundColor: STEP_COLORS[index % STEP_COLORS.length],
        fillStyle: "solid",
        strokeWidth: 2,
        strokeColor: "#1e1e1e",
        roundness: { type: 3, value: 12 },
        label: {
          text: `Step ${index + 1}:\n${step.name}`,
          fontSize: 14,
          strokeColor: "#1e1e1e",
        },
      } as ExcalidrawElementSkeleton);
    });

    dependencies.forEach((dep) => {
      const fromPos = nodePositions.get(dep.fromId);
      const toPos = nodePositions.get(dep.toId);
      if (!fromPos || !toPos) {
        return;
      }

      const fromElId = ingredients.find((i) => i.id === dep.fromId)
        ? `ingredient-${dep.fromId}`
        : `step-${dep.fromId}`;
      const toElId = ingredients.find((i) => i.id === dep.toId)
        ? `ingredient-${dep.toId}`
        : `step-${dep.toId}`;

      elementSkeletons.push({
        type: "arrow",
        x: fromPos.x,
        y: fromPos.y,
        strokeColor: "#1971c2",
        strokeWidth: 2,
        endArrowhead: "triangle",
        start: { id: fromElId },
        end: { id: toElId },
      } as ExcalidrawElementSkeleton);
    });

    const excalidrawElements = convertToExcalidrawElements(elementSkeletons);

    excalidrawAPI.updateScene({
      elements: [...excalidrawAPI.getSceneElements(), ...excalidrawElements],
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });

    excalidrawAPI.scrollToContent(excalidrawElements, {
      fitToContent: true,
    });
  }, [excalidrawAPI, recipeName, ingredients, steps, dependencies]);

  const canGenerate = ingredients.length > 0 || steps.length > 0;

  return (
    <div className="recipe-editor">
      <div className="recipe-editor__section">
        <h3>Recipe Name</h3>
        <div className="recipe-editor__field">
          <input
            type="text"
            placeholder="e.g., Chocolate Cake"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
          />
        </div>
      </div>

      <div className="recipe-editor__section">
        <h3>Ingredients</h3>
        {ingredients.map((ingredient, index) => (
          <div key={ingredient.id} className="recipe-editor__item-row">
            <span
              className="recipe-editor__color-dot"
              style={{
                backgroundColor:
                  INGREDIENT_COLORS[index % INGREDIENT_COLORS.length],
              }}
            />
            <span>{ingredient.name}</span>
            <button
              className="recipe-editor__remove-btn"
              onClick={() => removeIngredient(ingredient.id)}
              title="Remove ingredient"
              type="button"
            >
              x
            </button>
          </div>
        ))}
        <div className="recipe-editor__add-row">
          <input
            type="text"
            placeholder="Add ingredient..."
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addIngredient();
              }
            }}
          />
          <button
            className="recipe-editor__add-btn"
            onClick={addIngredient}
            disabled={!newIngredient.trim()}
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div className="recipe-editor__section">
        <h3>Steps</h3>
        {steps.map((step, index) => (
          <div key={step.id} className="recipe-editor__item-row">
            <span
              className="recipe-editor__color-dot"
              style={{
                backgroundColor: STEP_COLORS[index % STEP_COLORS.length],
              }}
            />
            <span>
              Step {index + 1}: {step.name}
            </span>
            <button
              className="recipe-editor__remove-btn"
              onClick={() => removeStep(step.id)}
              title="Remove step"
              type="button"
            >
              x
            </button>
          </div>
        ))}
        <div className="recipe-editor__add-row">
          <input
            type="text"
            placeholder="Add step..."
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addStep();
              }
            }}
          />
          <button
            className="recipe-editor__add-btn"
            onClick={addStep}
            disabled={!newStep.trim()}
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div className="recipe-editor__section">
        <h3>Dependencies</h3>
        {dependencies.map((dep) => (
          <div
            key={`${dep.fromId}-${dep.toId}`}
            className="recipe-editor__dep-item"
          >
            <span>{getNodeLabel(dep.fromId)}</span>
            <span className="recipe-editor__arrow-icon">&rarr;</span>
            <span>{getNodeLabel(dep.toId)}</span>
            <button
              className="recipe-editor__remove-btn"
              onClick={() => removeDependency(dep.fromId, dep.toId)}
              title="Remove dependency"
              type="button"
            >
              x
            </button>
          </div>
        ))}
        {allNodes.length >= 2 && (
          <div className="recipe-editor__dep-row">
            <select
              value={depFrom}
              onChange={(e) => setDepFrom(e.target.value)}
            >
              <option value="">From...</option>
              {allNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.type === "ingredient" ? "\u25CB " : "\u25A1 "}
                  {node.name}
                </option>
              ))}
            </select>
            <span className="recipe-editor__arrow-icon">&rarr;</span>
            <select value={depTo} onChange={(e) => setDepTo(e.target.value)}>
              <option value="">To...</option>
              {allNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.type === "ingredient" ? "\u25CB " : "\u25A1 "}
                  {node.name}
                </option>
              ))}
            </select>
            <button
              className="recipe-editor__add-btn"
              onClick={addDependency}
              disabled={!depFrom || !depTo || depFrom === depTo}
              type="button"
            >
              Link
            </button>
          </div>
        )}
        {allNodes.length < 2 && (
          <p className="recipe-editor__info">
            Add at least 2 ingredients or steps to create dependencies.
          </p>
        )}
      </div>

      <button
        className="recipe-editor__generate-btn"
        onClick={generateDiagram}
        disabled={!canGenerate}
        type="button"
      >
        Generate Recipe Diagram
      </button>

      <p className="recipe-editor__info">
        The diagram will be added to your canvas. Start a Live Collaboration
        session to edit with others in real-time.
      </p>
    </div>
  );
};
