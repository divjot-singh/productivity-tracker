import { ReactNode } from "react";
import { VisualizationResponse } from "@/models/visualization";

export interface VisualizationRendererProps<T = unknown> {
  visualization: VisualizationResponse<T>;
}

export type VisualizationRenderer = (
  props: VisualizationRendererProps<unknown>,
) => ReactNode;
