import * as React from 'react';

interface HeaderProps {
    theme: string;
    activeView: 'dashboard' | 'analytics' | 'resources' | 'planning';
    setActiveView: (view: 'dashboard' | 'analytics' | 'resources' | 'planning') => void;
    onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, activeView, setActiveView, onOpenSettings }) => {
    const [notificationsOpen, setNotificationsOpen] = React.useState(false);

    const NavButton: React.FC<{ view: 'dashboard' | 'analytics' | 'resources' | 'planning', label: string }> = ({ view, label }) => (
        <button
            onClick={() => setActiveView(view)}
            className={`px-2 py-1 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${activeView === view ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.charAt(0)}</span>
        </button>
    );

    return (
        <header className="bg-surface-light dark:bg-surface-dark shadow-md ui-density-spacing-md px-6 flex justify-between items-center shrink-0 border-b border-border-light dark:border-border-dark transition-colors duration-300 z-10">
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-3">
                    <img 
                        src="./logos/logo_favorito_no_background.png" 
                        alt="Interventi Pro X Logo" 
                        className="h-10 w-auto" 
                    />
                    <h1 className="text-xl font-extrabold text-gray-900 dark:text-white hidden sm:block">
                        Interventi <span className="text-gray-600 dark:text-gray-300">Pro X</span>
                    </h1>
                 </div>
                 <nav className="flex items-center gap-1 sm:gap-2">
                    <NavButton view="dashboard" label="Dashboard" />
                    <NavButton view="planning" label="Pianificazione" />
                    <NavButton view="analytics" label="Analytics" />
                    <NavButton view="resources" label="Gestione Risorse" />
                </nav>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onOpenSettings}
                    aria-label="Impostazioni"
                    className="ui-density-spacing-xs rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring dark:focus:ring-offset-surface-dark"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
                <div className="relative">
                    <button 
                        onClick={() => setNotificationsOpen(o => !o)}
                        aria-label="Notifiche" className="ui-density-spacing-xs rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring dark:focus:ring-offset-surface-dark">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>
                    {notificationsOpen && (
                         <div className="absolute right-0 mt-2 w-80 bg-surface-light dark:bg-surface-dark rounded-lg shadow-xl border border-border-light dark:border-border-dark animate-scale-in">
                            <div className="p-3 font-semibold text-sm border-b border-border-light dark:border-border-dark">Notifiche</div>
                            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">Nessuna nuova notifica.</div>
                         </div>
                    )}
                </div>
                <img className="h-9 w-9 rounded-full object-cover ring-2 ring-offset-2 ring-offset-surface-light dark:ring-offset-surface-dark ring-primary" src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User avatar" />
            </div>
        </header>
    );
};

export default Header;