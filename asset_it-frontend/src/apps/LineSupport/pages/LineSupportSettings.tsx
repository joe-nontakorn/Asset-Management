import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  AlertTriangle,
  CheckCircle,
  Loader,
  Save,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import MainLayout from '../../../layouts/MainLayout';
import { aiConfigService } from '../../../services/aiConfigService';

interface Provider {
  name: string;
  displayName: string;
  requiresKey: boolean;
}

interface Model {
  id: string;
  name: string;
  pricing?: {
    prompt: number;
    completion: number;
  };
}

interface CurrentConfig {
  provider: string;
  model: string;
  status: string;
  lastUpdated: string;
  validationStatus: 'valid' | 'invalid' | 'unknown';
  maskedKey: string | null;
}

const LineSupportSettings = () => {
  const [currentConfig, setCurrentConfig] = useState<CurrentConfig | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);

  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite-preview');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setLoading2] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [configRes, providersRes] = await Promise.all([
          aiConfigService.getCurrentConfig(),
          aiConfigService.getProviders(),
        ]);

        setCurrentConfig(configRes);
        setProviders(providersRes);
        setSelectedProvider(configRes.provider);
        setSelectedModel(configRes.model);

        // Load models for current provider
        const modelsRes = await aiConfigService.getModels(configRes.provider);
        setModels(modelsRes);
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูลการตั้งค่าได้');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load models when provider changes
  useEffect(() => {
    const loadModels = async () => {
      try {
        const modelsRes = await aiConfigService.getModels(selectedProvider);
        setModels(modelsRes);
        if (modelsRes.length > 0) {
          const hasCurrentModel = modelsRes.some((m) => m.id === selectedModel);
          if (!hasCurrentModel) {
            setSelectedModel(modelsRes[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading models:', err);
      }
    };

    loadModels();
  }, [selectedProvider]);

  // Calculate cost when model changes
  useEffect(() => {
    const selectedModelObj = models.find((m) => m.id === selectedModel);
    if (selectedModelObj?.pricing) {
      // Average cost per 1000 tokens (input + output average)
      const avgCost = (selectedModelObj.pricing.prompt + selectedModelObj.pricing.completion) / 2;
      // Assume ~100 calls per day at ~200 tokens per call
      const estimatedDailyCost = (avgCost * 100 * 200) / 1000;
      setEstimatedCost(Math.max(0, estimatedDailyCost)); // Never show negative
    } else {
      setEstimatedCost(0);
    }
  }, [selectedModel, models]);

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      const result = await aiConfigService.testConnection(
        selectedProvider,
        selectedModel,
        apiKey || undefined
      );

      setTestResult(result);
    } catch (err) {
      setTestResult({
        valid: false,
        message: 'ไม่สามารถทดสอบการเชื่อมต่อได้',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setLoading2(true);
      setSaveResult(null);

      // API Key is now optional - if empty, backend will use existing key

      const result = await aiConfigService.updateConfig({
        provider: selectedProvider,
        model: selectedModel,
        apiKey: apiKey || undefined,
      });

      setSaveResult(result);

      if (result.success) {
        // Reload current config
        const newConfig = await aiConfigService.getCurrentConfig();
        setCurrentConfig(newConfig);
        setApiKey('');
      }
    } catch (err: any) {
      setSaveResult({
        success: false,
        message: err.response?.data?.error || 'ไม่สามารถบันทึกการตั้งค่าได้',
      });
    } finally {
      setLoading2(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!window.confirm(`ต้องการลบการตั้งค่าสำหรับ ${selectedProvider} หรือไม่?`)) {
      return;
    }

    try {
      const result = await aiConfigService.deleteConfig(selectedProvider);
      if (result.success) {
        setSaveResult(result);
        // Reload current config
        const newConfig = await aiConfigService.getCurrentConfig();
        setCurrentConfig(newConfig);
      }
    } catch (err: any) {
      setSaveResult({
        success: false,
        message: err.response?.data?.error || 'ไม่สามารถลบการตั้งค่าได้',
      });
    }
  };

  if (loading && !currentConfig) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-gray-500">กำลังโหลดข้อมูลการตั้งค่า...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error && !currentConfig) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">AI Configuration</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">จัดการการตั้งค่า AI Provider และ Model</p>
          </div>
        </motion.div>

        <div className="grid gap-6">
          {/* Current Status Card */}
          {currentConfig && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="border border-indigo-200 dark:border-indigo-800 rounded-xl p-8 bg-white dark:bg-gray-800/50"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">ตั้งค่าปัจจุบัน</h2>
                  <p className="text-xs text-gray-500">Active Configuration</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Provider Card */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800/50">
                  <p className="text-xs uppercase font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Provider</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentConfig.provider}</p>
                </div>

                {/* Model Card */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800/50">
                  <p className="text-xs uppercase font-semibold text-purple-600 dark:text-purple-400 mb-2">Model</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={currentConfig.model}>
                    {currentConfig.model}
                  </p>
                </div>

                {/* Status Card */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800/50">
                  <p className="text-xs uppercase font-semibold text-green-600 dark:text-green-400 mb-2">Status</p>
                  <div className="flex items-center gap-2">
                    {currentConfig.validationStatus === 'valid' ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-bold text-green-700 dark:text-green-300">Valid</span>
                      </>
                    ) : currentConfig.validationStatus === 'invalid' ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="font-bold text-red-700 dark:text-red-300">Invalid</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span className="font-bold text-gray-600 dark:text-gray-300">Unknown</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Estimated Cost Card */}
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800/50">
                  <p className="text-xs uppercase font-semibold text-orange-600 dark:text-orange-400 mb-2">Estimated Cost</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      ${estimatedCost > 0 ? estimatedCost.toFixed(2) : '0.00'}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">/day</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Configuration Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="border border-gray-200 dark:border-gray-700 rounded-xl p-8 bg-white dark:bg-gray-800/50"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">เปลี่ยนการตั้งค่า</h2>
                <p className="text-xs text-gray-500">Modify AI Configuration</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Provider
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {providers.map((provider) => (
                    <option key={provider.name} value={provider.name}>
                      {provider.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Selection (Searchable Dropdown) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Model
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ค้นหาและเลือก model..."
                      value={isOpen ? modelSearch : (models.find(m => m.id === selectedModel)?.name || selectedModel)}
                      onFocus={() => {
                        setIsOpen(true);
                        setModelSearch(''); // clear search to show all when opening
                      }}
                      onChange={(e) => {
                        setIsOpen(true);
                        setModelSearch(e.target.value);
                      }}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-text"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>

                  {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {models.filter((model) =>
                        model.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
                        model.id.toLowerCase().includes(modelSearch.toLowerCase())
                      ).length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                          ไม่พบโมเดลที่ค้นหา
                        </div>
                      ) : (
                        models
                          .filter((model) =>
                            model.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
                            model.id.toLowerCase().includes(modelSearch.toLowerCase())
                          )
                          .map((model) => (
                            <button
                              key={model.id}
                              type="button"
                              onClick={() => {
                                setSelectedModel(model.id);
                                setIsOpen(false);
                                setModelSearch('');
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex flex-col gap-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                selectedModel === model.id
                                  ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-medium'
                                  : 'text-gray-800 dark:text-gray-200'
                              }`}
                            >
                              <span>{model.name}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">{model.id}</span>
                            </button>
                          ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* API Key Input - optional for updating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key {selectedProvider === 'openrouter' ? '(OpenRouter)' : '(Google Gemini)'}
                  <span className="text-xs text-gray-500 ml-1">(เพื่ออัพเดท, เว้นว่างเพื่อใช้ key เดิม)</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={selectedProvider === 'openrouter' ? 'sk-or-v1-...' : 'AIzaSy...'}
                    className="w-full px-4 py-2 pr-24 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showApiKey ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setApiKey('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                    title="Clear API Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  💡 ถ้าเว้นว่าง ระบบจะใช้ API Key ที่เก็บไว้แล้ว
                </p>
              </div>

              {/* Test Result */}
              {testResult && (
                <div
                  className={`p-4 rounded-lg border ${
                    testResult.valid
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <p
                    className={`text-sm ${
                      testResult.valid
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    {testResult.message}
                  </p>
                </div>
              )}

              {/* Save Result */}
              {saveResult && (
                <div
                  className={`p-4 rounded-lg border ${
                    saveResult.success
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <p
                    className={`text-sm ${
                      saveResult.success
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    {saveResult.message}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex-1 min-w-[160px]"
                >
                  {testing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      กำลังทดสอบ...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      ทดสอบ
                    </>
                  )}
                </button>

                <button
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors flex-1 min-w-[160px]"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      บันทึก
                    </>
                  )}
                </button>

                <button
                  onClick={handleDeleteConfig}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors min-w-[100px]"
                  title="Delete this configuration"
                >
                  <Trash2 className="w-4 h-4" />
                  ลบ
                </button>
              </div>
            </div>
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6"
          >
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">ℹ️ ข้อมูล</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-2">
              <li>• API Keys จะถูกเข้ารหัส (hashed) ก่อนเก็บลงฐานข้อมูล</li>
              <li>• สามารถเปลี่ยน AI Provider ได้ทันทีโดยไม่ต้อง restart server</li>
              <li>• ทั้ง OpenRouter และ Gemini ต้องใส่ API Key</li>
              <li>• ทดสอบการเชื่อมต่อก่อนบันทึกเพื่อให้แน่ใจว่ามี key ที่ถูกต้อง</li>
              <li>• ใช้เฉพาะ API Key ที่เก็บใน MongoDB เท่านั้น (ไม่ใช้ .env)</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LineSupportSettings;
