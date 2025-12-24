/* global __firebase_config, __initial_auth_token */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    signInAnonymously,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    signInWithCustomToken
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, deleteDoc, Timestamp } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    // Fallback for local development
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- HELPER FUNCTIONS ---
const safeFormatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    let date;
    if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else {
        date = new Date(timestamp);
    }
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    return date.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

// --- ICON COMPONENTS ---
const Icon = ({ children, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
        {children}
    </svg>
);

const ICONS = {
    dashboard: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />,
    analyze: <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />,
    history: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    education: <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />,
    profile: <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />,
    camera: <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />,
    upload: <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />,
    chart: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />,
    warning: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />,
    shield: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />,
    logout: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />,
    info: <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />,
    hospital: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H12m0 0V6a3 3 0 10-6 0v1.5m6 0a3 3 0 106 0V6m-6 6h.008v.008H12v-.008zm-3 0h.008v.008H9v-.008zm6 0h.008v.008H15v-.008z" />,
    medicine: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />,
    healthLog: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H3V10.5a2.25 2.25 0 012.25-2.25h1.5A2.25 2.25 0 019 10.5v8.25" />,
    trash: <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.134H8.09a2.09 2.09 0 00-2.09 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h18" />,
    menu: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
};

const LoadingSpinner = ({ text }) => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-teal-600"></div>
        {text && <span className="text-gray-600">{text}</span>}
    </div>
);

const Header = ({ title, subtitle, action, onMenuClick }) => (
    <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 px-4 lg:px-6 py-3 lg:py-4 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="lg:hidden text-gray-600 p-1">
                    <Icon>{ICONS.menu}</Icon>
                </button>
                <div>
                    <h1 className="text-lg lg:text-2xl font-bold text-gray-900">{title}</h1>
                    {subtitle && <p className="text-xs lg:text-sm text-gray-600 mt-1">{subtitle}</p>}
                </div>
            </div>
            {action && <div className="hidden sm:block">{action}</div>}
        </div>
    </div>
);


// --- UI COMPONENTS ---
const Sidebar = ({ activePage, setActivePage, handleSignOut }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard },
        { id: 'analyze', label: 'AI Analysis', icon: ICONS.analyze },
        { id: 'history', label: 'History', icon: ICONS.history },
        { id: 'healthLog', label: 'Health Log', icon: ICONS.healthLog },
        { id: 'education', label: 'Education', icon: ICONS.education },
        { id: 'profile', label: 'Profile', icon: ICONS.profile },
    ];

    return (
        <aside className="w-72 bg-white flex flex-col h-full">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <img
                        src="logo3.png"
                        alt="DFU Logo"
                        className="w-[50px] h-[80px] p-2.5 rounded-lg"
                    />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">DFU Analyzer</h1>
                        <p className="text-xs text-gray-500">AI-Powered Diagnostics</p>
                    </div>
                </div>
            </div>
            <nav className="flex-1 p-6">
                <div className="space-y-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActivePage(item.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${activePage === item.id
                                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                        >
                            <Icon className="w-5 h-5">{item.icon}</Icon>
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>
            </nav>
            <div className="p-6 border-t border-gray-200">
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                    <Icon className="w-5 h-5">{ICONS.logout}</Icon>
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

const StatsCard = ({ title, value, icon, color = 'teal' }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            </div>
            <div className={`p-3 bg-${color}-100 rounded-xl`}>
                <Icon className={`w-6 h-6 text-${color}-600`}>{icon}</Icon>
            </div>
        </div>
    </div>
);

// --- PAGE COMPONENTS ---
const PageWrapper = ({ children }) => (
    <div className="h-full">
        {children}
    </div>
);


const Dashboard = ({ setActivePage, history, profile, healthLog, appointment, onMenuClick }) => {
    const latestAnalysis = history.length > 0 ? history[0] : null;
    const userName = profile?.name ? `, ${profile.name}` : '';

    const isAppointmentPast = appointment && appointment.date && appointment.time && new Date(`${appointment.date}T${appointment.time}`) < new Date();


    const getTimeOfDayGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="min-h-full bg-gray-50/50">
            <Header
                title={`${getTimeOfDayGreeting()}${userName}`}
                subtitle="Let's keep your feet healthy together"
                onMenuClick={onMenuClick}
                action={
                    <button
                        onClick={() => setActivePage('analyze')}
                        className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold px-6 py-3 rounded-xl flex items-center space-x-2 hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg shadow-teal-500/25"
                    >
                        <Icon className="w-5 h-5">{ICONS.analyze}</Icon>
                        <span>New Analysis</span>
                    </button>
                }
            />

            <div className="max-w-7xl mx-auto p-4 md:p-6">
                {!profile?.name && (
                    <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-6 md:p-8 mb-6 md:mb-8 text-white">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Welcome to DFU Analyzer</h2>
                                <p className="text-cyan-100">Get started by setting up your health profile for personalized insights.</p>
                            </div>
                            <button
                                onClick={() => setActivePage('profile')}
                                className="bg-white text-teal-600 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors w-full md:w-auto flex-shrink-0"
                            >
                                Set Up Profile
                            </button>
                        </div>
                    </div>
                )}

                {appointment && !isAppointmentPast && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg">
                        <h4 className="font-bold text-amber-800">Upcoming Appointment</h4>
                        <p className="text-amber-700">You have an appointment on {new Date(appointment.date).toLocaleDateString()} at {appointment.time}.</p>
                    </div>
                )}

                {isAppointmentPast && (
                    <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mb-6 rounded-r-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                            <h4 className="font-bold text-gray-800">Follow-Up Needed</h4>
                            <p className="text-gray-700">Your last scheduled appointment has passed. Please schedule a new one.</p>
                        </div>
                        <button
                            onClick={() => setActivePage('healthLog')}
                            className="bg-teal-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors flex-shrink-0"
                        >
                            Schedule Now
                        </button>
                    </div>
                )}


                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                    <StatsCard title="Total Analyses" value={history.length} icon={ICONS.chart} color="teal" />
                    <StatsCard title="Health Logs" value={healthLog.length} icon={ICONS.healthLog} color="amber" />
                    <StatsCard title="Profile Complete" value={profile?.name ? "100%" : "0%"} icon={ICONS.profile} color="violet" />
                    <StatsCard title="Health Score" value="Good" icon={ICONS.shield} color="green" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Analysis</h3>
                            {latestAnalysis ? (
                                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">Latest</span>
                                            <span className="text-sm text-gray-500">{safeFormatDate(latestAnalysis.timestamp)}</span>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">{latestAnalysis.prediction.substring(0, 250)}...</p>
                                        <button onClick={() => setActivePage('history')} className="mt-4 text-teal-600 font-medium hover:text-teal-700 transition-colors">View Full Analysis →</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4">{ICONS.analyze}</Icon>
                                    <p className="text-gray-500 mb-4">No recent analyses found</p>
                                    <button onClick={() => setActivePage('analyze')} className="bg-teal-500 text-white px-6 py-3 rounded-xl hover:bg-teal-600 transition-colors">Start Your First Analysis</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Daily Health Tips</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 rounded-xl border border-green-200"><h4 className="font-semibold text-green-800 mb-2">Daily Inspection</h4><p className="text-sm text-green-700">Check your feet daily for cuts, sores, or swelling.</p></div>
                                <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-200"><h4 className="font-semibold text-cyan-800 mb-2">Proper Hygiene</h4><p className="text-sm text-cyan-700">Wash feet daily with warm water and dry thoroughly.</p></div>
                            </div>
                            <button onClick={() => setActivePage('education')} className="w-full mt-6 bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors">View All Tips</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
const AnalyzeTool = ({ onAnalysisComplete, onMenuClick }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [base64ImageData, setBase64ImageData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [isWebcamOpen, setIsWebcamOpen] = useState(false);
    const [facingMode, setFacingMode] = useState('environment');
    const [dynamicLinks, setDynamicLinks] = useState(null);
    const webcamVideoRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file.');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setError('Image size must be less than 10MB.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                setImageSrc(e.target.result);
                setBase64ImageData(e.target.result.split(',')[1]);
                setPrediction(null);
                setDynamicLinks(null);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const startWebcam = useCallback(async () => {
        if (webcamVideoRef.current && webcamVideoRef.current.srcObject) {
            webcamVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            if (webcamVideoRef.current) {
                webcamVideoRef.current.srcObject = stream;
            }
            setIsWebcamOpen(true);
            setError(null);
        } catch (err) {
            setError("Could not access camera. Please ensure you have granted permission and try again.");
            setIsWebcamOpen(false);
        }
    }, [facingMode]);

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    useEffect(() => {
        if (isWebcamOpen) {
            startWebcam();
        }
    }, [facingMode, isWebcamOpen, startWebcam]);

    const stopWebcam = () => {
        if (webcamVideoRef.current && webcamVideoRef.current.srcObject) {
            webcamVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        setIsWebcamOpen(false);
    };

    const captureFrame = () => {
        const video = webcamVideoRef.current;
        if (!video) return;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImageSrc(dataUrl);
        setBase64ImageData(dataUrl.split(',')[1]);
        setPrediction(null);
        setDynamicLinks(null);
        stopWebcam();
        setError(null);
    };
    
    const clearImage = () => {
        setImageSrc(null);
        setBase64ImageData(null);
        setPrediction(null);
        setDynamicLinks(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const findNearbyDoctors = () => {
        const genericLinks = [
            { name: 'Podiatrist (Foot Specialist)', query: 'podiatrist' },
            { name: 'Wound Care Clinic', query: 'wound+care+clinic' },
            { name: 'Hospital Near Me', query: 'hospital' }
        ];

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const links = genericLinks.map(item => ({
                        name: item.name,
                        mapsLink: `https://www.google.com/maps/search/?api=1&query=${item.query}&ll=${latitude},${longitude}`
                    }));
                    setDynamicLinks(links);
                },
                () => { // Geolocation failed
                    const links = genericLinks.map(item => ({
                        name: item.name,
                        mapsLink: `https://www.google.com/maps/search/?api=1&query=${item.query}`
                    }));
                    setDynamicLinks(links);
                    // Avoid using alert, show a message in UI instead if possible
                    console.warn("Could not access your location. Showing generic search links instead.");
                }
            );
        } else { // Geolocation not supported
            const links = genericLinks.map(item => ({
                name: item.name,
                mapsLink: `https://www.google.com/maps/search/?api=1&query=${item.query}`
            }));
            setDynamicLinks(links);
            console.warn("Geolocation is not supported by your browser. Showing generic search links.");
        }
    };


    const handlePrediction = async () => {
        setIsLoading(true);
        setError(null);
        setPrediction(null);
        setDynamicLinks(null);

        try {
            const prompt = `You are an expert AI assistant specializing in the visual analysis of foot imagery for informational purposes. Your task is to analyze the provided image and give a two-part response.

            1.  **Visual Description:** Provide a neutral, factual description of the foot. Mention skin texture (e.g., smooth, dry, cracked), coloration, and any visible marks. Do not use medical terminology.

            2.  **Conclusion:** Based strictly on the visual evidence, provide one of the following two conclusions:
                * If there is a CLEAR and UNAMBIGUOUS open sore, wound, or significant area of dark discoloration indicative of tissue damage, state: "Conclusion: The image shows visual signs that may warrant a consultation with a healthcare professional."
                * If the skin appears intact and there are no clear open wounds or severe discoloration, state: "Conclusion: The image does not show clear visual signs of a diabetic foot ulcer."

            Your primary directive is to avoid false positives. If you are not highly confident about an abnormality, you must default to the "no clear visual signs" conclusion. This is not a diagnostic tool.`;

            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: base64ImageData } }] }],
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
            };
            
            const apiKey =process.env.REACT_APP_GOOGLE_API_KEY; // Will be replaced by environment
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
            }

            const result = await response.json();

            if (result.promptFeedback && result.promptFeedback.blockReason) {
                throw new Error(`Request was blocked. Reason: ${result.promptFeedback.blockReason}.`);
            }

            if (result.candidates && result.candidates[0].content.parts[0].text) {
                const fullText = result.candidates[0].content.parts[0].text;
                setPrediction(fullText);
                onAnalysisComplete(fullText);

                if (fullText.toLowerCase().includes('warrant a consultation')) {
                    findNearbyDoctors();
                }

            } else {
                throw new Error("The model did not return a valid response.");
            }
        } catch (e) {
            setError(e.message);
            console.error("Prediction Error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageWrapper>
            <Header
                title="AI-Powered Foot Analysis"
                subtitle="Upload or capture an image for instant AI analysis"
                onMenuClick={onMenuClick}
            />

            <div className="max-w-4xl mx-auto p-4 md:p-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-4 md:p-8">
                    {/* Image Upload/Preview Area */}
                    <div className="mb-8">
                        <div className="w-full h-64 md:h-96 bg-gray-200/50 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border-2 border-dashed border-gray-300 hover:border-teal-400 transition-colors">
                            {imageSrc ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <img
                                        src={imageSrc}
                                        alt="Analysis preview"
                                        className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                                    />
                                    <button
                                        onClick={clearImage}
                                        className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                        aria-label="Remove image"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center p-4">
                                    <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4">{ICONS.camera}</Icon>
                                    <p className="text-lg md:text-xl font-semibold text-gray-700 mb-2">Upload or Capture Image</p>
                                    <p className="text-gray-500 text-sm md:text-base">Select a clear, well-lit image of the area of concern</p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <label htmlFor="upload-input" className="cursor-pointer bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center space-x-3 text-center">
                                <Icon className="w-5 h-5">{ICONS.upload}</Icon>
                                <span>Select Image</span>
                            </label>
                            <input ref={fileInputRef} id="upload-input" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />

                            <button
                                onClick={() => setIsWebcamOpen(true)}
                                className="bg-white border-2 border-gray-300 hover:border-teal-400 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center space-x-3"
                            >
                                <Icon className="w-5 h-5">{ICONS.camera}</Icon>
                                <span>Use Camera</span>
                            </button>
                        </div>
                    </div>
                    
                    {imageSrc && (
                        <div className="mt-6">
                            <button
                                onClick={handlePrediction}
                                disabled={!imageSrc || isLoading}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-4 px-8 rounded-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/25 flex items-center justify-center space-x-3"
                            >
                                {isLoading ? <LoadingSpinner text="Analyzing..."/> : <><Icon className="w-5 h-5">{ICONS.analyze}</Icon> <span>Analyze Image</span></>}
                            </button>
                        </div>
                    )}

                    {isLoading && (
                        <div className="bg-teal-50/80 backdrop-blur-sm border border-teal-200 rounded-2xl p-6 mt-6">
                            <div className="text-center">
                                <LoadingSpinner text="" />
                                <h3 className="text-lg font-semibold text-teal-900 mt-4 mb-2">AI Analysis in Progress</h3>
                                <p className="text-teal-700">Our advanced AI is carefully analyzing your image. This may take a few moments...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 mt-6">
                            <div className="flex items-center space-x-3">
                                <Icon className="w-6 h-6 text-red-600">{ICONS.warning}</Icon>
                                <div>
                                    <h3 className="text-lg font-semibold text-red-900">Analysis Error</h3>
                                    <p className="text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {prediction && (
                        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 md:p-8 mt-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                    <Icon className="w-6 h-6 text-white">{ICONS.shield}</Icon>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Analysis Complete</h3>
                                    <p className="text-gray-600">AI-powered diagnostic assessment</p>
                                </div>
                            </div>
                            <div className="bg-white/90 rounded-xl p-6 border border-gray-200">
                                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 font-sans">{prediction}</pre>
                            </div>

                            {dynamicLinks && (
                                <>
                                    <div className="mt-8">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center"><Icon className="w-6 h-6 mr-3 text-red-500">{ICONS.hospital}</Icon>Find a Doctor Nearby</h3>
                                        <div className="bg-amber-50/80 backdrop-blur-sm border-l-4 border-amber-400 p-4 mb-4">
                                            <p className="text-amber-800">Based on your result, a consultation is recommended. Here are some search links for nearby specialists:</p>
                                        </div>
                                        <div className="space-y-4">
                                            {dynamicLinks.map((link, index) => (
                                                <div key={index} className="bg-white/90 border border-gray-200 p-4 rounded-lg flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-bold">{link.name}</h4>
                                                    </div>
                                                    <a href={link.mapsLink} target="_blank" rel="noopener noreferrer" className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors">
                                                        Search
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}


                            <div className="mt-6 p-4 bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-xl">
                                <div className="flex items-start space-x-3">
                                    <Icon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5">{ICONS.warning}</Icon>
                                    <div>
                                        <h4 className="font-semibold text-amber-800">Important Reminder</h4>
                                        <p className="text-sm text-amber-700 mt-1">This AI analysis is for informational purposes only. Always consult with qualified healthcare professionals for proper diagnosis and treatment.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {isWebcamOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900">Camera Capture</h3>
                                <p className="text-gray-600">Position the area of concern clearly in the frame</p>
                            </div>
                            <div className="p-6">
                                <video
                                    ref={webcamVideoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full rounded-xl shadow-lg bg-gray-900"
                                    style={{ maxHeight: 'calc(100vh - 250px)' }}
                                />
                                <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 mt-6">
                                    <button onClick={captureFrame} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 px-6 rounded-xl">Capture Photo</button>
                                    <button onClick={toggleCamera} className="bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl">Switch Camera</button>
                                    <button onClick={stopWebcam} className="bg-red-600 text-white font-semibold py-3 px-6 rounded-xl">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
};

// ... Remaining components need to be updated for responsiveness and to accept onMenuClick prop ...

const HistoryPage = ({ history, clearHistory, setActivePage, deleteHistoryItem, onMenuClick }) => {
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // {id, type} 'item' or 'all'

    const getRiskLevel = (prediction) => {
        const text = prediction.toLowerCase();
        if (text.includes('high') || text.includes('severe') || text.includes('warrant a consultation')) return { level: 'High', color: 'red' };
        if (text.includes('moderate')) return { level: 'Moderate', color: 'amber' };
        return { level: 'Low', color: 'green' };
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) return;
        if (showDeleteConfirm.type === 'item') {
            await deleteHistoryItem(showDeleteConfirm.id);
        } else if (showDeleteConfirm.type === 'all') {
            await clearHistory();
        }
        setShowDeleteConfirm(null);
    };

    const ConfirmModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                <h3 className="text-lg font-bold">Are you sure?</h3>
                <p className="text-gray-600 my-4">This action cannot be undone.</p>
                <div className="flex justify-end gap-4">
                    <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 rounded-lg bg-gray-200">Cancel</button>
                    <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white">Delete</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-full bg-gray-50/50">
            {showDeleteConfirm && <ConfirmModal />}
            <Header
                title="Analysis History"
                subtitle={`${history.length} total analyses recorded`}
                onMenuClick={onMenuClick}
                action={
                    history.length > 0 && (
                        <button
                            onClick={() => setShowDeleteConfirm({ type: 'all' })}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                        >
                            <Icon className="w-4 h-4">{ICONS.trash}</Icon> Clear All
                        </button>
                    )
                }
            />

            <div className="max-w-7xl mx-auto p-4 md:p-6">
                {history.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                        <Icon className="w-20 h-20 text-gray-300 mx-auto mb-6">{ICONS.history}</Icon>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">No History Found</h3>
                        <p className="text-gray-600 mb-8">Start by analyzing an image to build your health history.</p>
                        <button onClick={() => setActivePage('analyze')} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold px-8 py-3 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg">
                            Start First Analysis
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {history.map(item => {
                            const risk = getRiskLevel(item.prediction);
                            return (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col"
                                    onClick={() => setSelectedAnalysis(item)}
                                >
                                    <div className="p-6 relative flex-grow">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm({ id: item.id, type: 'item' }); }}
                                            className="absolute top-4 right-4 w-8 h-8 bg-red-100 text-red-600 rounded-full hover:bg-red-200 flex items-center justify-center transition-colors z-10"
                                            title="Delete this entry"
                                        >
                                            <Icon className="w-4 h-4">{ICONS.trash}</Icon>
                                        </button>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-gray-500">{safeFormatDate(item.timestamp)}</span>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${risk.color}-100 text-${risk.color}-800`}>
                                                {risk.level} Risk
                                            </span>
                                        </div>
                                        <p className="text-gray-700 text-sm line-clamp-4">{item.prediction}</p>
                                    </div>
                                    <div className="p-6 pt-0">
                                        <span className="text-teal-600 font-medium hover:text-teal-700 transition-colors text-sm">
                                            View Full Analysis →
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedAnalysis && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Analysis Details</h3>
                                <p className="text-gray-600">{safeFormatDate(selectedAnalysis.timestamp)}</p>
                            </div>
                            <button
                                onClick={() => setSelectedAnalysis(null)}
                                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="bg-gray-50 rounded-xl p-6">
                                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 font-sans">{selectedAnalysis.prediction}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
const EducationPage = ({ onMenuClick }) => {
    const [activeTab, setActiveTab] = useState('basics');

    const tabs = [
        { id: 'basics', label: 'Basics', icon: ICONS.shield },
        { id: 'prevention', label: 'Prevention', icon: ICONS.chart },
        { id: 'warning-signs', label: 'Warning Signs', icon: ICONS.warning }
    ];

    const content = {
        basics: {
            title: 'Daily Foot Care Routine',
            items: [
                { title: 'Daily Inspection', description: 'Examine your feet every day for red spots, cuts, swelling, and blisters. Use a mirror to check the bottom of your feet if needed.', icon: '🔍' },
                { title: 'Proper Washing', description: 'Wash your feet daily in warm (not hot) water. Test water temperature with your elbow or a thermometer.', icon: '🧼' },
                { title: 'Thorough Drying', description: 'Dry feet completely, especially between the toes. Pat dry instead of rubbing to avoid skin damage.', icon: '🏠' },
                { title: 'Moisturizing', description: 'Apply a thin coat of lotion to the tops and bottoms of your feet, but avoid the areas between toes.', icon: '🧴' }
            ]
        },
        prevention: {
            title: 'Prevention Strategies',
            items: [
                { title: 'Proper Footwear', description: 'Wear well-fitting shoes and clean, dry socks. Check inside shoes before wearing for foreign objects.', icon: '👟' },
                { title: 'Blood Sugar Control', description: 'Maintain good blood glucose control to prevent complications and promote healing.', icon: '📊' },
                { title: 'Regular Exercise', description: 'Engage in regular physical activity to improve circulation and overall foot health.', icon: '🚶' },
                { title: 'Professional Care', description: 'Visit your healthcare provider regularly for comprehensive foot examinations.', icon: '🏥' }
            ]
        },
        'warning-signs': {
            title: 'When to Seek Medical Attention',
            items: [
                { title: 'Open Wounds', description: 'Any cut, sore, or blister that doesn\'t start to heal within 24 hours requires immediate attention.', icon: '🚨' },
                { title: 'Infection Signs', description: 'Red, warm, or painful skin, unusual swelling, or discharge from a wound.', icon: '🦠' },
                { title: 'Color Changes', description: 'Blue, black, or unusually pale areas on your feet that don\'t return to normal quickly.', icon: '🎨' },
                { title: 'Persistent Pain', description: 'Ongoing pain, tingling, or numbness that doesn\'t improve with rest.', icon: '⚡' }
            ]
        }
    };

    return (
        <div className="min-h-full bg-gray-50/50">
            <Header
                title="Foot Care Education"
                subtitle="Essential knowledge for maintaining healthy feet"
                onMenuClick={onMenuClick}
            />

            <div className="max-w-7xl mx-auto p-4 md:p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 mb-8">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-grow sm:flex-grow-0 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className="w-5 h-5">{tab.icon}</Icon>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">{content[activeTab].title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {content[activeTab].items.map((item, index) => (
                            <div key={index} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                                <div className="flex items-start space-x-4">
                                    <div className="text-3xl mt-1">{item.icon}</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                                        <p className="text-gray-700 leading-relaxed">{item.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfilePage = ({ user, profile, setProfile, onMenuClick }) => {
    const [formData, setFormData] = useState({
        name: '', gender: 'Prefer not to say', dob: '', contactNumber: '', address: '',
        diabetesType: 'Type 2', diagnosisYear: '', emergencyContact: '', emergencyPhone: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData(prev => ({ ...prev, ...profile }));
        }
    }, [profile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const profileRef = doc(db, `users/${user.uid}/profile`, 'data');
            await setDoc(profileRef, formData, { merge: true });
            setProfile(formData);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Error saving profile:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-full bg-gray-50/50">
            {showSuccess && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50">
                    Profile saved successfully!
                </div>
            )}
            <Header
                title="Your Health Profile"
                subtitle="Manage your personal and health details"
                onMenuClick={onMenuClick}
            />
            <div className="max-w-4xl mx-auto p-4 md:p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                                <div>
                                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-3" placeholder="First + Last name" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <input type="email" name="email" id="email" value={user.email} readOnly disabled className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-gray-100 cursor-not-allowed" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900">Medical & Emergency</h3>
                                <div>
                                    <label htmlFor="diabetesType" className="block text-sm font-semibold text-gray-700 mb-2">Type of Diabetes</label>
                                    <select id="diabetesType" name="diabetesType" value={formData.diabetesType} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-3">
                                        <option>Type 1</option> <option>Type 2</option> <option>Gestational</option> <option>Pre-diabetes</option> <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="diagnosisYear" className="block text-sm font-semibold text-gray-700 mb-2">Year of Diagnosis</label>
                                    <input type="number" name="diagnosisYear" id="diagnosisYear" value={formData.diagnosisYear} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-3" placeholder="e.g., 2020" min="1950" max={new Date().getFullYear()} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-gray-200 pt-8">
                            <button type="submit" disabled={isSaving} className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold py-4 px-8 rounded-xl disabled:bg-gray-400">
                                {isSaving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const HealthLogPage = ({ user, healthLog, setHealthLog, appointment, setAppointment, deleteAppointment, onMenuClick }) => {
    const [logType, setLogType] = useState('symptom');
    const [painLevel, setPainLevel] = useState(0);
    const [swelling, setSwelling] = useState(false);
    const [redness, setRedness] = useState(false);
    const [notes, setNotes] = useState('');
    const [sugarLevel, setSugarLevel] = useState('');
    const [appointmentDate, setAppointmentDate] = useState(appointment ? appointment.date : '');
    const [appointmentTime, setAppointmentTime] = useState(appointment ? appointment.time : '');
    const [isAppointmentPast, setIsAppointmentPast] = useState(false);

    useEffect(() => {
        if (appointment) {
            setAppointmentDate(appointment.date || '');
            setAppointmentTime(appointment.time || '');
            const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
            setIsAppointmentPast(appointmentDateTime < new Date());
        } else {
            setAppointmentDate('');
            setAppointmentTime('');
            setIsAppointmentPast(false);
        }
    }, [appointment]);

    const handleSaveLog = async () => {
        if (!user) return;
        
        let newLogEntry = { type: logType, timestamp: Timestamp.now() };

        if (logType === 'symptom') {
            newLogEntry = { ...newLogEntry, painLevel, swelling, redness, notes };
        } else if (logType === 'sugar') {
            if (!sugarLevel) { console.warn("Please enter a blood sugar value."); return; }
            newLogEntry = { ...newLogEntry, sugarLevel: Number(sugarLevel) };
        }

        try {
            const docRef = await addDoc(collection(db, `users/${user.uid}/healthLog`), newLogEntry);
            setHealthLog(prev => [{ id: docRef.id, ...newLogEntry }, ...prev]);
            setPainLevel(0); setSwelling(false); setRedness(false); setNotes(''); setSugarLevel('');
        } catch (error) {
            console.error("Error saving health log:", error);
        }
    };

    const handleSaveAppointment = async () => {
        if (!user || !appointmentDate || !appointmentTime) return;
        const newAppointment = { date: appointmentDate, time: appointmentTime };
        try {
            await setDoc(doc(db, `users/${user.uid}/appointment`, 'data'), newAppointment);
            setAppointment(newAppointment);
        } catch (error) {
            console.error("Error saving appointment:", error);
        }
    };

    const handleDeleteAppointment = async () => {
        // Use custom modal instead of confirm
        await deleteAppointment();
        setAppointmentDate('');
        setAppointmentTime('');
    };

    const handleAddToCalendar = () => {
        if (!appointment || !appointment.date || !appointment.time) return;
        const [year, month, day] = appointment.date.split('-');
        const [hours, minutes] = appointment.time.split(':');
        const startTime = new Date(year, month - 1, day, hours, minutes);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour
        const toUTCString = (date) => date.toISOString().replace(/[-:]|\.\d{3}/g, '');
        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Doctor's Appointment (DFU Check-up)")}&dates=${toUTCString(startTime)}/${toUTCString(endTime)}&details=${encodeURIComponent("Generated by DFU Analyzer.")}`;
        window.open(url, '_blank');
    };

    return (
        <div className="min-h-full bg-gray-50/50">
            <Header
                title="Health Log & Reminders"
                subtitle="Track symptoms, blood sugar, and appointments"
                onMenuClick={onMenuClick}
            />
            <div className="max-w-7xl mx-auto p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                         <div className="mb-6 border-b border-gray-200 pb-4">
                             <h3 className="text-2xl font-bold text-gray-900">New Log Entry</h3>
                             <div className="mt-4 flex space-x-2">
                                <button onClick={() => setLogType('symptom')} className={`px-4 py-2 rounded-lg font-medium ${logType === 'symptom' ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Symptom Log</button>
                                <button onClick={() => setLogType('sugar')} className={`px-4 py-2 rounded-lg font-medium ${logType === 'sugar' ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Blood Sugar</button>
                            </div>
                         </div>
                         {/* Forms and save button here... */}
                          {logType === 'symptom' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Pain Level: {painLevel}</label>
                                    <input type="range" min="0" max="10" value={painLevel} onChange={(e) => setPainLevel(e.target.value)} className="w-full" />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center">
                                        <input type="checkbox" checked={swelling} onChange={(e) => setSwelling(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"/>
                                        <span className="ml-2 text-gray-700">Swelling Present</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input type="checkbox" checked={redness} onChange={(e) => setRedness(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"/>
                                        <span className="ml-2 text-gray-700">Redness Present</span>
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Notes</label>
                                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" className="w-full mt-1 rounded-xl border border-gray-300 p-2 focus:ring-teal-500 focus:border-teal-500"></textarea>
                                </div>
                            </div>
                        )}

                        {logType === 'sugar' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Blood Sugar Level (mg/dL)</label>
                                <input type="number" value={sugarLevel} onChange={(e) => setSugarLevel(e.target.value)} className="w-full mt-1 rounded-xl border border-gray-300 p-2 focus:ring-teal-500 focus:border-teal-500" placeholder="e.g., 120" />
                            </div>
                        )}
                          <button onClick={handleSaveLog} className="w-full mt-6 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold py-3 rounded-xl">Save Log Entry</button>
                    </div>

                    <div className="space-y-8">
                       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                           <h3 className="text-2xl font-bold text-gray-900 mb-6">Appointment Reminder</h3>
                           {/* Appointment details and buttons here... */}
                           {appointment && !isAppointmentPast && (
                                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                    <p className="font-semibold text-green-800">Next Appointment:</p>
                                    <p className="text-green-700">{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</p>
                                </div>
                            )}

                            {isAppointmentPast && (
                                <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                                    <p className="font-semibold text-red-800">Appointment Passed</p>
                                    <p className="text-red-700">Your appointment on {new Date(appointment.date).toLocaleDateString()} is over. Please schedule a new one.</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Date</label>
                                    <input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} className="w-full mt-1 rounded-xl border border-gray-300 p-2"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Time</label>
                                    <input type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} className="w-full mt-1 rounded-xl border border-gray-300 p-2"/>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={handleSaveAppointment} className="flex-1 mt-4 bg-amber-500 text-white font-semibold py-3 rounded-xl">Set/Update</button>
                                    {appointment && (
                                        <button onClick={handleDeleteAppointment} className="flex-1 mt-4 bg-red-500 text-white font-semibold py-3 rounded-xl">Delete</button>
                                    )}
                                </div>
                            </div>
                            {appointment && !isAppointmentPast && (
                                <button onClick={handleAddToCalendar} className="w-full mt-2 bg-blue-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2">
                                    <Icon className="w-5 h-5">{ICONS.calendar}</Icon>
                                    <span>Add to Google Calendar</span>
                                </button>
                            )}
                       </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Logs</h3>
                             <div className="space-y-4 max-h-96 overflow-y-auto">
                               {healthLog.slice(0, 5).map(log => (
                                   <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                                       <p className="font-semibold">{log.type === 'symptom' ? 'Symptom Log' : 'Blood Sugar'}</p>
                                       <p className="text-sm text-gray-600">{safeFormatDate(log.timestamp)}</p>
                                       {log.type === 'sugar' && <p>Level: {log.sugarLevel} mg/dL</p>}
                                   </div>
                               ))}
                           </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
            await setPersistence(auth, persistence);
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuest = async () => {
        try {
            await signInAnonymously(auth);
        } catch (err) {
            setError("Could not sign in as guest. Please try again.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
             <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute z-0 w-auto min-w-full min-h-full max-w-none object-cover"
            >
                <source src="https://storage.googleapis.com/static.coinstats.app/videos/background_video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 bg-cyan-50/50"></div>

            <div className="relative w-full max-w-md p-8 space-y-8 bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl z-10">
                <div className="flex flex-col items-center text-center">
                    <div className="flex items-center space-x-3">
                        <img src="logo3.png" className="w-16 h-auto" alt="DFU Logo" />
                        <h1 className="text-3xl font-bold text-gray-900">DFU Analyzer</h1>
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">{isLogin ? 'Sign In' : 'Create Account'}</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Or{' '}
                        <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-teal-600 hover:text-teal-500">
                            {isLogin ? 'create a new account' : 'sign in to your account'}
                        </button>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleAuthAction}>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-teal-500 focus:border-teal-500" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-teal-500 focus:border-teal-500" />

                    {isLogin && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input id="remember-me" name="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded" />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Remember me</label>
                            </div>
                        </div>
                    )}

                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full py-3 px-4 text-white bg-teal-600 rounded-xl hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400">
                        {isLoading ? <LoadingSpinner /> : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>
                <div className="text-center">
                    <button onClick={handleGuest} className="font-medium text-gray-600 hover:text-gray-500">
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Application ---
export default function App() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activePage, setActivePage] = useState('dashboard');
    const [profile, setProfile] = useState(null);
    const [history, setHistory] = useState([]);
    const [healthLog, setHealthLog] = useState([]);
    const [appointment, setAppointment] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);


    const handleSignOut = async () => {
        try {
            await signOut(auth);
            // Reset all state on sign out
            setUser(null);
            setProfile(null);
            setHistory([]);
            setHealthLog([]);
            setAppointment(null);
            setActivePage('dashboard');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const handleSetActivePage = useCallback((page) => {
        if (user && user.isAnonymous && ['dashboard', 'history', 'healthLog', 'profile'].includes(page)) {
            alert("Please create an account to access this feature.");
            return;
        }
        setActivePage(page);
        setIsSidebarOpen(false);
    }, [user]);


    const addAnalysisToHistory = useCallback(async (predictionText) => {
        if (!user) return;
        if (user.isAnonymous) {
            alert("Analysis complete! Please create an account to save this result to your history.");
            return;
        }
        const newHistoryItem = { prediction: predictionText, timestamp: Timestamp.now() };
        const docRef = await addDoc(collection(db, `users/${user.uid}/history`), newHistoryItem);
        setHistory(prev => [{ id: docRef.id, ...newHistoryItem }, ...prev]);
    }, [user]);

    useEffect(() => {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            signInWithCustomToken(auth, __initial_auth_token).catch((error) => {
                console.error("Failed to sign in with custom token:", error);
            });
        }
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setIsLoading(true);
            if (currentUser) {
                setUser(currentUser);
                if (currentUser.isAnonymous) {
                    setActivePage('analyze');
                    setProfile(null);
                    setHistory([]);
                    setHealthLog([]);
                    setAppointment(null);
                } else {
                    const userDocRef = doc(db, `users/${currentUser.uid}`);
                    const profileRef = doc(userDocRef, 'profile', 'data');
                    const historyQuery = query(collection(userDocRef, 'history'), orderBy('timestamp', 'desc'));
                    const logQuery = query(collection(userDocRef, 'healthLog'), orderBy('timestamp', 'desc'));
                    const apptRef = doc(userDocRef, 'appointment', 'data');

                    const [profileSnap, historySnap, logSnap, apptSnap] = await Promise.all([
                        getDoc(profileRef),
                        getDocs(historyQuery),
                        getDocs(logQuery),
                        getDoc(apptRef)
                    ]);
                    
                    setProfile(profileSnap.exists() ? profileSnap.data() : null);
                    setHistory(historySnap.docs.map(d => ({ id: d.id, ...d.data() })));
                    setHealthLog(logSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                    setAppointment(apptSnap.exists() ? apptSnap.data() : null);
                }
            } else {
                setUser(null);
                setProfile(null);
                setHistory([]);
                setHealthLog([]);
                setAppointment(null);
                setActivePage('dashboard');
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const clearHistory = async () => {
        if (!user || user.isAnonymous) return;
        const historyCollectionRef = collection(db, `users/${user.uid}/history`);
        const historySnap = await getDocs(historyCollectionRef);
        const deletePromises = historySnap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
        setHistory([]);
    };

    const deleteHistoryItem = async (itemId) => {
        if (!user || user.isAnonymous) return;
        await deleteDoc(doc(db, `users/${user.uid}/history`, itemId));
        setHistory(prev => prev.filter(item => item.id !== itemId));
    };

    const deleteAppointment = async () => {
        if (!user || user.isAnonymous) return;
        await deleteDoc(doc(db, `users/${user.uid}/appointment`, 'data'));
        setAppointment(null);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><LoadingSpinner text="Loading Application..." /></div>;
    }
    
    if (!user) {
        return <AuthPage />;
    }
        
    const onMenuClick = () => setIsSidebarOpen(true);

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard': return <Dashboard onMenuClick={onMenuClick} setActivePage={handleSetActivePage} history={history} profile={profile} healthLog={healthLog} appointment={appointment} />;
            case 'analyze': return <AnalyzeTool onMenuClick={onMenuClick} onAnalysisComplete={addAnalysisToHistory} />;
            case 'history': return <HistoryPage onMenuClick={onMenuClick} history={history} clearHistory={clearHistory} setActivePage={handleSetActivePage} deleteHistoryItem={deleteHistoryItem} />;
            case 'healthLog': return <HealthLogPage onMenuClick={onMenuClick} user={user} healthLog={healthLog} setHealthLog={setHealthLog} appointment={appointment} setAppointment={setAppointment} deleteAppointment={deleteAppointment} />;
            case 'education': return <EducationPage onMenuClick={onMenuClick} />;
            case 'profile': return <ProfilePage onMenuClick={onMenuClick} user={user} profile={profile} setProfile={setProfile} />;
            default: return <Dashboard onMenuClick={onMenuClick} setActivePage={handleSetActivePage} history={history} profile={profile} healthLog={healthLog} appointment={appointment} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 text-gray-900 font-sans antialiased">
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
            )}
            <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex-shrink-0`}>
                <Sidebar
                    activePage={activePage}
                    setActivePage={handleSetActivePage}
                    handleSignOut={handleSignOut}
                />
            </div>
            <main className="flex-1 flex flex-col overflow-y-auto">
                {renderPage()}
            </main>
        </div>
    );
}

