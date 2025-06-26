import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface CampaignSpec {
  name: string;
  total_budget: number;
  start_date: string;
  end_date: string;
  objective: string;
  description?: string;
  preferences?: any;
  line_items?: LineItem[];
}

export interface LineItem {
  id?: string;
  name: string;
  budget: number;
  start_date: string;
  end_date: string;
  networks: string[];
  genres: string[];
  devices: string[];
  locations: string[];
  segment_ids: number[];
  targeting?: any;
}

export interface Segment {
  segmentId: number;
  name: string;
  size: number;
  geo: string;
  demoTags: string[];
}

export interface CampaignPlan {
  plan: {
    campaign: CampaignSpec;
    line_items: LineItem[];
    total_budget_allocated: number;
    summary: any;
  };
  csvUrl: string;
  summary: any;
}

// API functions
export const parseCampaign = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post<CampaignSpec>('/parse', form, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const fetchPrefs = (advId: string) =>
  api.get(`/preferences/${advId}`);

export const fetchSegments = () =>
  api.get<{ segments: Segment[] }>('/segments');

export const generatePlan = (spec: CampaignSpec) =>
  api.post<CampaignPlan>('/plan', spec);

export const checkHealth = () =>
  api.get('/health');

export default api; 