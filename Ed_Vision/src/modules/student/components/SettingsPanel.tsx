import { useState } from 'react';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
};

export default function SettingsPanel({
  visible,
  onClose,
  initialX = (window.innerWidth - 700) / 2,
  initialY = (window.innerHeight - 600 - 80) / 2,
  initialWidth = 700,
  initialHeight = 600,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const { size, handleMouseDown: handleResize } = useResizable(initialWidth, initialHeight, 500, 400);
  
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'notifications' | 'privacy'>('general');
  const [language, setLanguage] = useState('vi');
  const [autoSave, setAutoSave] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [pomodoroNotif, setPomodoroNotif] = useState(true);
  const [showTimer, setShowTimer] = useState(true);

  if (!visible) return null;

  const tabs = [
    { id: 'general', icon: 'fa-sliders-h', label: 'General' },
    { id: 'appearance', icon: 'fa-palette', label: 'Appearance' },
    { id: 'notifications', icon: 'fa-bell', label: 'Notifications' },
    { id: 'privacy', icon: 'fa-shield-alt', label: 'Privacy' },
  ];

  return (
    <div
      className="fixed z-10"
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
    >
      <div className="backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-3xl shadow-2xl h-full flex flex-col relative">
        {/* Header */}
        <div
          className="flex-shrink-0 h-10 cursor-move rounded-t-3xl flex items-center justify-between px-6"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-cog text-white/80 text-lg"></i>
            <h2 className="text-xl font-semibold text-white">Settings</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 bg-black/20 border-r border-white/10 p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <i className={`fas ${tab.icon}`}></i>
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'general' && (
              <>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-4">General Settings</h3>
                  
                  {/* Language Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-white/70 text-sm font-medium mb-2 block">Language</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                      >
                        <option value="vi" className="bg-gray-800">Tiếng Việt</option>
                        <option value="en" className="bg-gray-800">English</option>
                        <option value="ja" className="bg-gray-800">日本語</option>
                        <option value="ko" className="bg-gray-800">한국어</option>
                      </select>
                    </div>

                    {/* Auto Save */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-save text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Auto Save</div>
                          <div className="text-white/50 text-xs">Automatically save your progress</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setAutoSave(!autoSave)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          autoSave ? 'bg-pink-500' : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            autoSave ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Sound Effects */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-volume-up text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Sound Effects</div>
                          <div className="text-white/50 text-xs">Play sounds for interactions</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSoundEffects(!soundEffects)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          soundEffects ? 'bg-pink-500' : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            soundEffects ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'appearance' && (
              <>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-4">Appearance</h3>
                  
                  <div className="space-y-4">
                    {/* Dark Mode */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-moon text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Dark Mode</div>
                          <div className="text-white/50 text-xs">Use dark theme</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          darkMode ? 'bg-pink-500' : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            darkMode ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Show Timer */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-clock text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Show Clock</div>
                          <div className="text-white/50 text-xs">Display clock on screen</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowTimer(!showTimer)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          showTimer ? 'bg-pink-500' : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            showTimer ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Theme Presets */}
                    <div>
                      <label className="text-white/70 text-sm font-medium mb-3 block">Theme Presets</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['Minimal', 'Cozy', 'Focus', 'Nature'].map((preset) => (
                          <button
                            key={preset}
                            className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/30 transition"
                          >
                            <div className="text-white text-sm font-medium">{preset}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'notifications' && (
              <>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-4">Notifications</h3>
                  
                  <div className="space-y-4">
                    {/* Enable Notifications */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-bell text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Enable Notifications</div>
                          <div className="text-white/50 text-xs">Receive app notifications</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifications(!notifications)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          notifications ? 'bg-pink-500' : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            notifications ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Pomodoro Notifications */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-stopwatch text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Pomodoro Alerts</div>
                          <div className="text-white/50 text-xs">Get notified when timer ends</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setPomodoroNotif(!pomodoroNotif)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          pomodoroNotif ? 'bg-pink-500' : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            pomodoroNotif ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'privacy' && (
              <>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-4">Privacy & Security</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <i className="fas fa-database text-white/60"></i>
                        <div className="text-white font-medium text-sm">Data Storage</div>
                      </div>
                      <p className="text-white/50 text-xs mb-3">
                        Your data is stored locally on your device for privacy and offline access.
                      </p>
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition">
                        Clear All Data
                      </button>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <i className="fas fa-download text-white/60"></i>
                        <div className="text-white font-medium text-sm">Export Data</div>
                      </div>
                      <p className="text-white/50 text-xs mb-3">
                        Download your journal entries and study logs.
                      </p>
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition">
                        Export as JSON
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Save Button */}
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-lg transition"
              >
                <i className="fas fa-check mr-2"></i>
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute w-3 h-3 bg-white/30 border-2 border-white/60 rounded-full cursor-nwse-resize bottom-[-6px] right-[-6px] z-10 hover:bg-white/50"
          onMouseDown={handleResize}
        />
      </div>
    </div>
  );
}
