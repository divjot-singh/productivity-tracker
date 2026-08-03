// models/visualization/provider-data.ts

export interface ProviderData {
  values: {
    date: string;
    value: number;
  }[];

  unit?: string;
}
