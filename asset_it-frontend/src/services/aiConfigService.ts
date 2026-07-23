import axios from 'axios';

const API_BASE = import.meta.env.VITE_LINE_API_BASE ? `${import.meta.env.VITE_LINE_API_BASE}/api` : '/line-api';

interface Provider {
  name: string;
  displayName: string;
  requiresKey: boolean;
}

interface Model {
  id: string;
  name: string;
}

interface CurrentConfig {
  provider: string;
  model: string;
  status: string;
  lastUpdated: string;
  validationStatus: 'valid' | 'invalid' | 'unknown';
  maskedKey: string | null;
}

interface UpdateConfigPayload {
  provider: string;
  model: string;
  apiKey?: string;
}

interface UpdateConfigResponse {
  success: boolean;
  message: string;
  config: CurrentConfig | null;
}

export const aiConfigService = {
  // Get current configuration
  async getCurrentConfig(): Promise<CurrentConfig> {
    try {
      const response = await axios.get(`${API_BASE}/ai-config/current`);
      return response.data;
    } catch (error) {
      console.error('Error fetching current config:', error);
      throw error;
    }
  },

  // Get available providers
  async getProviders(): Promise<Provider[]> {
    try {
      const response = await axios.get(`${API_BASE}/ai-config/providers`);
      return response.data.providers;
    } catch (error) {
      console.error('Error fetching providers:', error);
      throw error;
    }
  },

  // Get models for a specific provider
  async getModels(provider: string): Promise<Model[]> {
    try {
      const response = await axios.get(`${API_BASE}/ai-config/models/${provider}`);
      return response.data.models;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  },

  // Test connection with provider
  async testConnection(provider: string, model: string, apiKey?: string): Promise<{ valid: boolean; message: string }> {
    try {
      const response = await axios.post(`${API_BASE}/ai-config/test`, {
        provider,
        model,
        apiKey,
      });
      return response.data;
    } catch (error) {
      console.error('Error testing connection:', error);
      throw error;
    }
  },

  // Update configuration
  async updateConfig(payload: UpdateConfigPayload): Promise<UpdateConfigResponse> {
    try {
      const response = await axios.post<UpdateConfigResponse>(`${API_BASE}/ai-config/update`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating config:', error);
      throw error;
    }
  },

  // Delete configuration for a provider
  async deleteConfig(provider: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.delete(`${API_BASE}/ai-config/${provider}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting config:', error);
      throw error;
    }
  },
};
