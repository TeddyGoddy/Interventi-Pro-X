import * as React from 'react';

interface HeaderProps {
    theme: string;
    toggleTheme: () => void;
    activeView: 'dashboard' | 'analytics' | 'resources' | 'planning';
    setActiveView: (view: 'dashboard' | 'analytics' | 'resources' | 'planning') => void;
    onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, activeView, setActiveView, onOpenSettings }) => {
    const [notificationsOpen, setNotificationsOpen] = React.useState(false);

    const NavButton: React.FC<{ view: 'dashboard' | 'analytics' | 'resources' | 'planning', label: string }> = ({ view, label }) => (
        <button
            onClick={() => setActiveView(view)}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeView === view ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
            {label}
        </button>
    );

    return (
        <header className="bg-surface-light dark:bg-surface-dark shadow-md p-3 px-6 flex justify-between items-center shrink-0 border-b border-border-light dark:border-border-dark transition-colors duration-300 z-10">
            <div className="flex items-center gap-4">
                 <div className="bg-primary rounded-lg p-2 flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h1 className="text-xl font-extrabold text-white hidden sm:block">
                        Interventi <span className="text-white/80">Pro X</span>
                    </h1>
                 </div>
                 <nav className="hidden md:flex items-center gap-2">
                    <NavButton view="dashboard" label="Dashboard" />
                    <NavButton view="planning" label="Pianificazione" />
                    <NavButton view="analytics" label="Analytics" />
                    <NavButton view="resources" label="Gestione Risorse" />
                </nav>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleTheme}
                    aria-label={`Attiva tema ${theme === 'light' ? 'scuro' : 'chiaro'}`}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring dark:focus:ring-offset-surface-dark"
                >
                    {theme === 'light' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
                <button
                    onClick={onOpenSettings}
                    aria-label="Apri impostazioni"
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring dark:focus:ring-offset-surface-dark"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                </button>
                <div className="relative">
                    <button 
                        onClick={() => setNotificationsOpen(o => !o)}
                        aria-label="Notifiche" className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring dark:focus:ring-offset-surface-dark">
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