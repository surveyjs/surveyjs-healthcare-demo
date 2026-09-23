import React from 'react';
import { LogOut } from 'lucide-react';

export type NavTab = 'register' | 'manage' | 'profile' | 'medications' | 'settings';

interface HeaderProps {
  activeTab: NavTab;
  userName: string;
  onTabChange: (tab: NavTab) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, userName, onTabChange, onLogout }) => {
  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Left identity group */}
        <div className="flex items-center space-x-4">
          {/* Green circular cross logo matching screenshot */}
          <div className="w-8 h-8 rounded-full bg-[#00695c] flex items-center justify-center text-white shadow-xs shrink-0">
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19 10.5h-5.5V5c0-.55-.45-1-1-1s-1 .45-1 1v5.5H6c-.55 0-1 .45-1 1s.45 1 1 1h5.5V19c0 .55.45 1 1 1s1-.45 1-1v-5.5H19c.55 0 1-.45 1-1s-.45-1-1-1z" />
            </svg>
          </div>

          <div className="text-sm text-gray-700">
            Logged in as: <span className="font-semibold text-[#00695c]">{userName}</span>
          </div>

          <div className="h-5 w-px bg-gray-300" />

          {/* Navigation items */}
          <nav className="flex items-center space-x-6">
            <button
              type="button"
              onClick={() => onTabChange('register')}
              className={`text-sm font-medium transition-colors cursor-pointer relative py-4 ${
                activeTab === 'register'
                  ? 'text-[#00695c] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#00695c]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Register Patient
            </button>

            <button
              type="button"
              onClick={() => onTabChange('manage')}
              className={`text-sm font-medium transition-colors cursor-pointer relative py-4 ${
                activeTab === 'manage' || activeTab === 'profile'
                  ? 'text-[#00695c] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#00695c]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Manage Patients
            </button>

            <button
              type="button"
              onClick={() => onTabChange('medications')}
              className={`text-sm font-medium transition-colors cursor-pointer relative py-4 ${
                activeTab === 'medications'
                  ? 'text-[#00695c] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#00695c]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Medications
            </button>

            <button
              type="button"
              onClick={() => onTabChange('settings')}
              className={`text-sm font-medium transition-colors cursor-pointer relative py-4 ${
                activeTab === 'settings'
                  ? 'text-[#00695c] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#00695c]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Inpatient Settings
            </button>
          </nav>
        </div>

        {/* Right action */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-[#00695c] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
