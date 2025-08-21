/* global __firebase_config, __app_id */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    signInAnonymously
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "AIzaSyC2AILVWciRLUp1xI9Hj0DU1kt5Am22CqU",
    authDomain: "dfu-analyzer-app.firebaseapp.com",
    projectId: "dfu-analyzer-app",
    storageBucket: "dfu-analyzer-app.appspot.com",
    messagingSenderId: "525736393577",
    appId: "1:525736393577:web:5459df0d86c118e5909bf8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Professional Icons ---
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
    email: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />,
    info: <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
};

// --- Helper Components ---
const LoadingSpinner = ({ text }) => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        {text && <span className="text-gray-600">{text}</span>}
    </div>
);

const Header = ({ title, subtitle, action }) => (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    </div>
);

const Tooltip = ({ text, children }) => (
    <div className="relative flex items-center group">
        {children}
        <div className="absolute bottom-0 flex-col items-center hidden mb-6 group-hover:flex w-64">
            <span className="relative z-10 p-2 text-xs leading-none text-white whitespace-no-wrap bg-black shadow-lg rounded-md">{text}</span>
            <div className="w-3 h-3 -mt-2 rotate-45 bg-black"></div>
        </div>
    </div>
);


// --- Page Components ---
const Sidebar = ({ activePage, setActivePage, handleSignOut }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard },
        { id: 'analyze', label: 'AI Analysis', icon: ICONS.analyze },
        { id: 'history', label: 'History', icon: ICONS.history },
        { id: 'education', label: 'Education', icon: ICONS.education },
        { id: 'profile', label: 'Profile', icon: ICONS.profile },
    ];

    return (
        <aside className="w-72 bg-white shadow-lg border-r border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white">{ICONS.shield}</Icon>
                    </div>
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
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                                activePage === item.id
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
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

const StatsCard = ({ title, value, icon }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
                <Icon className="w-6 h-6 text-blue-600">{icon}</Icon>
            </div>
        </div>
    </div>
);

const Dashboard = ({ setActivePage, history, profile }) => {
    const latestAnalysis = history.length > 0 ? history[0] : null;
    const userName = profile?.name ? `, ${profile.name}` : '';

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeOfDayGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header 
                title={`${getTimeOfDayGreeting()}${userName}`}
                subtitle="Let's keep your feet healthy together"
                action={
                    <button 
                        onClick={() => setActivePage('analyze')}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-xl flex items-center space-x-2 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
                    >
                        <Icon className="w-5 h-5">{ICONS.analyze}</Icon>
                        <span>New Analysis</span>
                    </button>
                }
            />

            <div className="max-w-7xl mx-auto p-6">
                {!profile?.name && (
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Welcome to DFU Analyzer</h2>
                                <p className="text-blue-100">Get started by setting up your health profile for personalized insights and better care management.</p>
                            </div>
                            <button 
                                onClick={() => setActivePage('profile')}
                                className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                Set Up Profile
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard title="Total Analyses" value={history.length} icon={ICONS.chart} />
                    <StatsCard title="This Month" value={history.filter(item => {
                        const date = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
                        return date && new Date(date).getMonth() === new Date().getMonth();
                    }).length} icon={ICONS.analyze} />
                    <StatsCard title="Profile Complete" value={profile?.name ? "100%" : "0%"} icon={ICONS.profile} />
                    <StatsCard title="Health Score" value="Good" icon={ICONS.shield} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Analysis</h3>
                            {latestAnalysis ? (
                                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Latest</span>
                                            <span className="text-sm text-gray-500">{formatDate(latestAnalysis.timestamp)}</span>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">{latestAnalysis.prediction.substring(0, 250)}...</p>
                                        <button onClick={() => setActivePage('history')} className="mt-4 text-blue-600 font-medium hover:text-blue-700 transition-colors">View Full Analysis →</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4">{ICONS.analyze}</Icon>
                                    <p className="text-gray-500 mb-4">No recent analyses found</p>
                                    <button onClick={() => setActivePage('analyze')} className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">Start Your First Analysis</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Daily Health Tips</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 rounded-xl border border-green-200"><h4 className="font-semibold text-green-800 mb-2">Daily Inspection</h4><p className="text-sm text-green-700">Check your feet daily for cuts, sores, or swelling.</p></div>
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200"><h4 className="font-semibold text-blue-800 mb-2">Proper Hygiene</h4><p className="text-sm text-blue-700">Wash feet daily with warm water and dry thoroughly.</p></div>
                            </div>
                            <button onClick={() => setActivePage('education')} className="w-full mt-6 bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors">View All Tips</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AnalyzeTool = ({ onAnalysisComplete, user, setTempAnalysis }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [base64ImageData, setBase64ImageData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [isWebcamOpen, setIsWebcamOpen] = useState(false);
    const [facingMode, setFacingMode] = useState('environment');
    const webcamVideoRef = useRef(null);

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
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImageSrc(dataUrl);
        setBase64ImageData(dataUrl.split(',')[1]);
        stopWebcam();
        setError(null);
    };

    const handlePrediction = async () => {
        setIsLoading(true);
        setError(null);
        setPrediction(null);
        
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
            
            const apiKey = "AIzaSyAR6QbvZl_g4L44A0DfiZ6JHSG3rqLEbXs";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                if (response.status === 403) throw new Error(`Authentication Failed (Error 403). Ensure API key is valid.`);
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
        <div className="min-h-screen bg-gray-50">
            <Header 
                title="AI-Powered Foot Analysis"
                subtitle="Upload or capture an image for instant AI analysis"
            />

            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    {/* Image Upload/Preview Area */}
                    <div className="mb-8">
                        <div className="w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mb-6 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                            {imageSrc ? (
                                <div className="relative">
                                    <img 
                                        src={imageSrc} 
                                        alt="Analysis preview" 
                                        className="max-w-full max-h-96 object-contain rounded-xl shadow-lg"
                                    />
                                    <button 
                                        onClick={() => {setImageSrc(null); setBase64ImageData(null); setPrediction(null);}}
                                        className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4">{ICONS.camera}</Icon>
                                    <p className="text-xl font-semibold text-gray-700 mb-2">Upload or Capture Image</p>
                                    <p className="text-gray-500">Select a clear, well-lit image of the area of concern</p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <label htmlFor="upload-input" className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-3">
                                <Icon className="w-5 h-5">{ICONS.upload}</Icon>
                                <span>Select Image</span>
                            </label>
                            <input id="upload-input" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            
                            <button 
                                onClick={() => setIsWebcamOpen(true)} 
                                className="bg-white border-2 border-gray-300 hover:border-blue-400 text-gray-700 font-semibold py-4 px-8 rounded-xl transition-all flex items-center justify-center space-x-3"
                            >
                                <Icon className="w-5 h-5">{ICONS.camera}</Icon>
                                <span>Use Camera</span>
                            </button>

                            <button 
                                onClick={handlePrediction} 
                                disabled={!imageSrc || isLoading} 
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 px-8 rounded-xl disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/25 flex items-center justify-center space-x-3"
                            >
                                {isLoading ? <LoadingSpinner size="sm" text="" /> : <Icon className="w-5 h-5">{ICONS.analyze}</Icon>}
                                <span>{isLoading ? "Analyzing..." : "Analyze Image"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 mb-6">
                            <div className="text-center">
                                <LoadingSpinner size="lg" text="" />
                                <h3 className="text-lg font-semibold text-blue-900 mt-4 mb-2">AI Analysis in Progress</h3>
                                <p className="text-blue-700">Our advanced AI is carefully analyzing your image. This may take a few moments...</p>
                                <div className="mt-4 bg-blue-100 rounded-full h-2">
                                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
                            <div className="flex items-center space-x-3">
                                <Icon className="w-6 h-6 text-red-600">{ICONS.warning}</Icon>
                                <div>
                                    <h3 className="text-lg font-semibold text-red-900">Analysis Error</h3>
                                    <p className="text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {prediction && (
                        <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-8">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                    <Icon className="w-6 h-6 text-white">{ICONS.shield}</Icon>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Analysis Complete</h3>
                                    <p className="text-gray-600">AI-powered diagnostic assessment</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 font-mono">{prediction}</pre>
                            </div>
                            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
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

                {/* Camera Modal */}
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
                                    className="w-full rounded-xl shadow-lg"
                                    style={{maxHeight: '400px'}}
                                />
                                <div className="flex justify-center space-x-4 mt-6">
                                    <button 
                                        onClick={captureFrame} 
                                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg"
                                    >
                                        Capture Photo
                                    </button>
                                    <button 
                                        onClick={toggleCamera} 
                                        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
                                    >
                                        Switch Camera
                                    </button>
                                    <button 
                                        onClick={stopWebcam} 
                                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const HistoryPage = ({ history, clearHistory, setActivePage }) => {
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRiskLevel = (prediction) => {
        const text = prediction.toLowerCase();
        if (text.includes('high') || text.includes('severe') || text.includes('warrant a consultation')) return { level: 'High', color: 'red' };
        if (text.includes('moderate')) return { level: 'Moderate', color: 'yellow' };
        return { level: 'Low', color: 'green' };
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header 
                title="Analysis History"
                subtitle={`${history.length} total analyses recorded`}
                action={
                    history.length > 0 && (
                        <button 
                            onClick={clearHistory} 
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-all"
                        >
                            Clear All History
                        </button>
                    )
                }
            />

            <div className="max-w-7xl mx-auto p-6">
                {history.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                        <Icon className="w-20 h-20 text-gray-300 mx-auto mb-6">{ICONS.history}</Icon>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">No History Found</h3>
                        <p className="text-gray-600 mb-8">Start by analyzing your first foot image to build your health history.</p>
                        <button onClick={() => setActivePage('analyze')} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg">
                            Start First Analysis
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {history.map(item => {
                            const risk = getRiskLevel(item.prediction);
                            return (
                                <div 
                                    key={item.id} 
                                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                                    onClick={() => setSelectedAnalysis(item)}
                                >
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-gray-500">{formatDate(item.timestamp)}</span>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                risk.color === 'red' ? 'bg-red-100 text-red-800' :
                                                risk.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {risk.level} Risk
                                            </span>
                                        </div>
                                        <p className="text-gray-700 text-sm line-clamp-3">{item.prediction.substring(0, 150)}...</p>
                                        <button className="mt-4 text-blue-600 font-medium hover:text-blue-700 transition-colors text-sm">
                                            View Full Analysis →
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Analysis Detail Modal */}
            {selectedAnalysis && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Analysis Details</h3>
                                <p className="text-gray-600">{formatDate(selectedAnalysis.timestamp)}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedAnalysis(null)}
                                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <div className="bg-gray-50 rounded-xl p-6">
                                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 font-mono">{selectedAnalysis.prediction}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const EducationPage = () => {
    const [activeTab, setActiveTab] = useState('basics');

    const tabs = [
        { id: 'basics', label: 'Foot Care Basics', icon: ICONS.shield },
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
        <div className="min-h-screen bg-gray-50">
            <Header 
                title="Diabetic Foot Care Education"
                subtitle="Essential knowledge for maintaining healthy feet"
            />

            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 mb-8">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all font-medium ${
                                    activeTab === tab.id
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <Icon className="w-5 h-5">{tab.icon}</Icon>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">{content[activeTab].title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {content[activeTab].items.map((item, index) => (
                            <div key={index} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                                <div className="flex items-start space-x-4">
                                    <div className="text-3xl">{item.icon}</div>
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

const ProfilePage = ({ user, profile, setProfile }) => {
    const [formData, setFormData] = useState({ 
        name: '', age: '', diabetesType: 'Type 2', diagnosisYear: '', 
        medications: '', allergies: '', emergencyContact: '', emergencyPhone: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '', age: profile.age || '',
                diabetesType: profile.diabetesType || 'Type 2', diagnosisYear: profile.diagnosisYear || '',
                medications: profile.medications || '', allergies: profile.allergies || '',
                emergencyContact: profile.emergencyContact || '', emergencyPhone: profile.emergencyPhone || ''
            });
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
            const successDiv = document.createElement('div');
            successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50';
            successDiv.textContent = 'Profile saved successfully!';
            document.body.appendChild(successDiv);
            setTimeout(() => document.body.removeChild(successDiv), 3000);
        } catch (error) {
            console.error("Error saving profile:", error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg z-50';
            errorDiv.textContent = 'Failed to save profile. Please try again.';
            document.body.appendChild(errorDiv);
            setTimeout(() => document.body.removeChild(errorDiv), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header 
                title="Your Health Profile"
                subtitle="Manage your personal information and health details"
            />

            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h3>
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter your full name" />
                                </div>
                                <div>
                                    <label htmlFor="age" className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                                    <input type="number" name="age" id="age" value={formData.age} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter your age" min="1" max="120" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Medical Information</h3>
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="diabetesType" className="block text-sm font-semibold text-gray-700 mb-2">Type of Diabetes</label>
                                    <select id="diabetesType" name="diabetesType" value={formData.diabetesType} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                                        <option>Type 1</option> <option>Type 2</option> <option>Gestational</option> <option>Pre-diabetes</option> <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="diagnosisYear" className="block text-sm font-semibold text-gray-700 mb-2">Year of Diagnosis</label>
                                    <input type="number" name="diagnosisYear" id="diagnosisYear" value={formData.diagnosisYear} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="e.g., 2020" min="1950" max={new Date().getFullYear()} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 border-t border-gray-200 pt-8">
                        <button onClick={handleSave} disabled={isSaving} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-8 rounded-xl disabled:bg-gray-400 transition-all shadow-lg shadow-blue-500/25">
                            {isSaving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </div>
             
            </div>
          
               <p>

    &nbsp;  &nbsp;  &nbsp;<b>Type 1 Diabetes:</b> This is an autoimmune condition where the body's immune system attacks and destroys the insulin-producing cells in the pancreas. People with Type 1  &nbsp;  &nbsp;  &nbsp;   &nbsp;  &nbsp;diabetes need to take insulin every day to live. It's usually diagnosed in children and young adults.
<br></br>
<br></br>
 &nbsp;  &nbsp;  &nbsp;<b>Type 2 Diabetes:</b> This is the most common type. With Type 2, your body either doesn’t use insulin properly or can't make enough to keep your blood sugar at normal&nbsp;  &nbsp;  &nbsp;   &nbsp;  &nbsp;   &nbsp;  &nbsp;  &nbsp;levels. It's often linked to lifestyle factors and genetics and is typically diagnosed in adults.
<br></br><br></br>
 &nbsp;  &nbsp;  &nbsp;<b>Gestational Diabetes:</b> This type develops in some women during pregnancy and usually goes away after the baby is born. However, having it increases the risk of  &nbsp;  &nbsp;  &nbsp;   &nbsp;  &nbsp;  &nbsp;  &nbsp;  &nbsp;   &nbsp;  &nbsp;developing Type 2 diabetes later in life.
<br></br><br></br>
 &nbsp;  &nbsp;  &nbsp;<b>Pre-diabetes:</b> This is a condition where blood sugar levels are higher than normal but not yet high enough to be diagnosed as Type 2 diabetes. It's a critical warning sign,&nbsp;  &nbsp;  &nbsp;  &nbsp;  &nbsp;and with lifestyle changes, it's often possible to prevent it from progressing to full-blown diabetes.
<br></br><br></br>
 &nbsp;  &nbsp;  &nbsp;<b>Other: </b>This is a catch-all category for less common types of diabetes, such as those caused by specific genetic syndromes or certain medications.
<br></br></p><br></br>
        </div>
    );
};


// --- Authentication Components ---
const AuthPage = ({ setTempAnalysis }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
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
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-8 bg-white shadow-lg rounded-2xl">
                <div>
                    <h2 className="text-3xl font-bold text-center text-gray-900">{isLogin ? 'Sign In' : 'Create Account'}</h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-blue-600 hover:text-blue-500">
                            {isLogin ? 'create a new account' : 'sign in to your account'}
                        </button>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleAuthAction}>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500" />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full py-3 px-4 text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400">
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
    const [tempAnalysis, setTempAnalysis] = useState(null); // For guest analysis

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser && !currentUser.isAnonymous) {
                // Fetch data for logged-in users
                const userDocRef = doc(db, `users/${currentUser.uid}`);
                const profileRef = doc(userDocRef, 'profile', 'data');
                const profileSnap = await getDoc(profileRef);
                if (profileSnap.exists()) setProfile(profileSnap.data());

                const historyQuery = query(collection(userDocRef, 'history'), orderBy('timestamp', 'desc'));
                const historySnap = await getDocs(historyQuery);
                setHistory(historySnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // If there's a temporary analysis, save it now
                if (tempAnalysis) {
                    await addAnalysisToHistory(tempAnalysis.prediction, currentUser);
                    setTempAnalysis(null); // Clear it after saving
                }
            } else {
                setProfile(null);
                setHistory([]);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [tempAnalysis]);

    const handleSignOut = async () => {
        await signOut(auth);
    };
    
    const addAnalysisToHistory = async (predictionText, targetUser = user) => {
        const newHistoryItem = { prediction: predictionText, timestamp: new Date() };
        
        if (targetUser && !targetUser.isAnonymous) {
            const docRef = await addDoc(collection(db, `users/${targetUser.uid}/history`), newHistoryItem);
            setHistory(prev => [{ id: docRef.id, ...newHistoryItem }, ...prev]);
        } else {
            // It's a guest, store it temporarily
            setTempAnalysis(newHistoryItem);
            alert("Create an account to save this analysis and view your history!");
         
        }
    };
    
    const clearHistory = async () => {
        if (!user || user.isAnonymous) return;
        const historyCollectionRef = collection(db, `users/${user.uid}/history`);
        const historySnap = await getDocs(historyCollectionRef);
        const deletePromises = historySnap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
        setHistory([]);
    };

    if (isLoading) return <div className="flex items-center justify-center h-screen"><LoadingSpinner text="Loading Application..." /></div>;
    
    if (!user) return <AuthPage setTempAnalysis={setTempAnalysis} />;

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard': return <Dashboard setActivePage={setActivePage} history={history} profile={profile} />;
            case 'analyze': return <AnalyzeTool onAnalysisComplete={addAnalysisToHistory} user={user} setTempAnalysis={setTempAnalysis} />;
            case 'history': return <HistoryPage history={history} clearHistory={clearHistory} setActivePage={setActivePage}/>;
            case 'education': return <EducationPage />;
            case 'profile': return <ProfilePage user={user} profile={profile} setProfile={setProfile} />;
            default: return <Dashboard setActivePage={setActivePage} history={history} profile={profile} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
            <Sidebar activePage={activePage} setActivePage={setActivePage} handleSignOut={handleSignOut} />
            <main className="flex-1 overflow-y-auto">
                {renderPage()}
            </main>
        </div>
    );
}
