import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Upload, XCircle, Zap, Loader2, CheckCircle, Shield, MessageCircle, Send, Globe } from 'lucide-react';

// Mock data for recommendations spanning Intern to Senior Architect levels
const MOCK_RECOMMENDATIONS = [
    "1. Software Development Intern (Python/Database)",
    "2. Junior Backend Developer (SQL/MongoDB)",
    "3. Mid-Level Python Software Engineer",
    "4. Data Engineer (Database & ETL Focus)",
    "5. Senior Backend Engineer (Distributed Systems)",
    "6. Database Architect (MongoDB/SQL Optimization)"
];

const MOCK_SKILLS_FROM_RESUME = "Python, SQL, MongoDB, Database Management, CRUD application logic, Teamwork, Communication.";

const App = () => {
    // --- Recommendation State ---
    const [skillsText, setSkillsText] = useState('');
    const [resumeFile, setResumeFile] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [skillsUsed, setSkillsUsed] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Chatbot State ---
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState([
        { role: 'model', text: 'Hello! I\'m Job Match AI\'s assistant. Ask me anything about career paths, job roles, or resume tips.' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Scroll to the latest message in the chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // --- API Configuration ---
    const API_KEY = ""; // Canvas will inject key
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;
    
    // --- Gemini Chat Function ---
    const sendMessageToGemini = useCallback(async (message) => {
        if (!message.trim()) return;

        const newChatHistory = [...chatHistory, { role: 'user', text: message }];
        setChatHistory(newChatHistory);
        setChatInput('');
        setIsChatLoading(true);

        const systemInstruction = "You are a helpful career guidance chatbot embedded in a Job Match AI application. You assist users with questions about their resume analysis, job roles, and career development. Be concise and use Google Search for up-to-date, real-time information.";

        try {
            const payload = {
                contents: newChatHistory.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] })),
                tools: [{ "google_search": {} }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }

            const result = await response.json();
            const candidate = result.candidates?.[0];
            let responseText = "Sorry, I couldn't get a clear response.";
            let sources = [];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                responseText = candidate.content.parts[0].text;
                
                // Extract grounding sources
                const groundingMetadata = candidate.groundingMetadata;
                if (groundingMetadata && groundingMetadata.groundingAttributions) {
                    sources = groundingMetadata.groundingAttributions
                        .map(attribution => ({
                            uri: attribution.web?.uri,
                            title: attribution.web?.title,
                        }))
                        .filter(source => source.uri && source.title);
                }
            }
            
            // Format response text with sources
            let fullResponse = responseText;
            if (sources.length > 0) {
                fullResponse += '\n\n**Sources:**\n' + sources.map((s, i) => `[${i + 1}] ${s.title} (${new URL(s.uri).hostname})`).join('\n');
            }

            setChatHistory(prev => [...prev, { role: 'model', text: fullResponse, sources: sources }]);

        } catch (error) {
            console.error('Gemini API Error:', error);
            setChatHistory(prev => [...prev, { role: 'model', text: 'Sorry, I hit an error connecting to the intelligence engine. Please try again.' }]);
        } finally {
            setIsChatLoading(false);
        }
    }, [chatHistory, API_URL]);

    const handleChatSubmit = (e) => {
        e.preventDefault();
        sendMessageToGemini(chatInput);
    };

    // --- Recommendation Logic (Remains unchanged) ---
    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0];
        setResumeFile(file || null);
    }, []);

    const handleRemoveFile = useCallback(() => {
        setResumeFile(null);
        const inputElement = document.getElementById('resume_file');
        if (inputElement) { inputElement.value = ''; }
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setError(null);
        setRecommendations([]);
        setSkillsUsed('');

        if (!skillsText.trim() && !resumeFile) {
            setError('Please enter skills or select a file to begin the analysis.');
            return;
        }

        setIsLoading(true);

        try {
            // --- MOCK API CALL & RESPONSE SIMULATION ---
            await new Promise(resolve => setTimeout(resolve, 2000)); 

            let combinedSkills = MOCK_SKILLS_FROM_RESUME;
            if (skillsText.trim()) {
                combinedSkills = `[From Textbox: ${skillsText.trim()}] + [From Resume: ${MOCK_SKILLS_FROM_RESUME}]`;
            }
            
            setRecommendations(MOCK_RECOMMENDATIONS);
            setSkillsUsed(combinedSkills);

        } catch (err) {
            console.error('Processing error:', err);
            setError('An error occurred during the simulated analysis. Check console for details.');
        } finally {
            setIsLoading(false);
        }
    }, [skillsText, resumeFile]);

    const fileName = useMemo(() => resumeFile ? resumeFile.name : 'No file selected.', [resumeFile]);
    const fileCtaText = useMemo(() => resumeFile ? 'File Selected' : 'Click to Select File', [resumeFile]);

    // --- Component JSX Structure ---
    return (
        <div className="p-4 sm:p-8 min-h-screen flex items-center justify-center relative" style={{
            fontFamily: 'Inter, sans-serif',
            background: '#f8f9fa',
            backgroundImage: 'radial-gradient(circle at top left, #eef2ff 0%, transparent 50%), radial-gradient(circle at bottom right, #e0f2fe 0%, transparent 50%)',
            backgroundBlendMode: 'multiply'
        }}>
            
            {/* Main Content Card */}
            <div className="bg-white p-6 sm:p-10 rounded-3xl w-full max-w-xl shadow-2xl transition duration-300 hover:shadow-3xl border border-gray-200">
                
                {/* Header */}
                <div className="flex flex-col items-center justify-center mb-8">
                    <Zap className="w-16 h-16 text-indigo-500 mb-3" />
                    <h1 className="text-4xl font-extrabold text-gray-900">Job Match AI</h1>
                    <h2 className="text-lg text-indigo-600 font-medium mt-1">Smart Career Path Prediction</h2>
                </div>
                <p className="text-center text-gray-600 mb-8 leading-relaxed">
                    Unleash your potential. Upload your **resume** or list your skills, and let our intelligent engine predict your ideal career trajectory.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Skills Text Input */}
                    <div>
                        <label htmlFor="skills" className="block text-sm font-extrabold text-gray-700 mb-2">Key Skills (Optional)</label>
                        <textarea 
                            id="skills" 
                            name="skills" 
                            rows={3} 
                            className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-inner" 
                            placeholder="E.g., Python, SQL, AWS, React, Project Management..."
                            value={skillsText}
                            onChange={(e) => setSkillsText(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex-grow h-px bg-gray-300"></div>
                        <span className="text-sm font-extrabold text-gray-500">OR UPLOAD PROFILE</span>
                        <div className="flex-grow h-px bg-gray-300"></div>
                    </div>

                    {/* Resume File Upload Input */}
                    <div className="flex flex-col items-center space-y-3 p-6 border-4 border-dashed border-indigo-200 rounded-xl bg-indigo-50/50 hover:bg-indigo-100/50 transition duration-300">
                        <label htmlFor="resume_file" className="text-lg font-bold text-gray-700 flex items-center">
                            <Upload className="w-5 h-5 mr-2 text-indigo-600" />
                            Upload Resume (.pdf file)
                        </label>
                        <input 
                            type="file" 
                            id="resume_file" 
                            name="resume_file" 
                            accept=".pdf" 
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isLoading}
                        />
                        
                        <div className="flex flex-col items-center space-y-2">
                            <label htmlFor="resume_file" className="cursor-pointer py-3 px-6 rounded-xl border-2 border-dashed border-indigo-300 bg-gray-50 text-base font-bold text-gray-700 hover:shadow-lg hover:bg-white transition active:scale-95">
                                <span>{fileCtaText}</span>
                            </label>
                            <p className="text-sm text-indigo-600 italic mt-1 font-medium">{fileName}</p>
                            
                            {resumeFile && (
                                <button type="button" onClick={handleRemoveFile} className="text-sm text-gray-500 font-semibold flex items-center mt-2 hover:text-red-500 transition duration-200">
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Remove File
                                </button>
                            )}
                        </div>

                        <p className="text-xs text-red-500 mt-1">We recommend PDF format for full resume analysis.</p>
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        className={`w-full text-white font-extrabold py-4 rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 transform active:scale-95 ${isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900'}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <Loader2 className="animate-spin w-5 h-5 mr-2" />
                                Analyzing...
                            </div>
                        ) : (
                            'Predict My Career Path'
                        )}
                    </button>
                </form>

                {/* Results Display */}
                {error && (
                    <div className="mt-8 p-4 bg-red-100 border-l-4 border-red-500 rounded-lg text-sm text-red-800 shadow-md">
                        <p>Error: {error}</p>
                    </div>
                )}

                {recommendations.length > 0 && (
                    <div className="mt-8 border-t-4 border-indigo-400 pt-6 rounded-t-lg">
                        <h2 className="text-2xl font-extrabold text-gray-800 mb-4 flex items-center">
                            <Shield className="w-6 h-6 text-indigo-600 mr-2" />
                            Your Recommended Roles
                        </h2>
                        <ul className="space-y-3">
                            {recommendations.map((role, index) => (
                                <li key={index} className="p-4 rounded-xl text-gray-900 font-semibold shadow-md flex items-center transition duration-200 hover:bg-indigo-50 bg-blue-50">
                                    <span className="w-7 h-7 flex items-center justify-center bg-indigo-500 text-white rounded-full mr-3 text-sm font-extrabold">{role.split('.')[0]}</span>
                                    <span>{role.substring(role.indexOf('.') + 2)}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-lg text-sm text-gray-700 shadow-inner">
                            <span className="font-extrabold text-gray-800">Input Analyzed:</span> {skillsUsed}
                        </div>
                    </div>
                )}

            </div>

            {/* --- Chatbot Widget --- */}
            <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isChatOpen ? 'w-full max-w-sm h-3/4 max-h-[500px]' : 'w-16 h-16'}`}>
                
                {/* Chat Window */}
                {isChatOpen && (
                    <div className="bg-white rounded-xl shadow-2xl flex flex-col h-full border border-gray-200">
                        {/* Chat Header */}
                        <div className="bg-indigo-600 text-white p-4 flex justify-between items-center rounded-t-xl">
                            <h3 className="text-lg font-bold flex items-center">
                                <MessageCircle className="w-5 h-5 mr-2" />
                                Career Assistant
                            </h3>
                            <button onClick={() => setIsChatOpen(false)} className="p-1 rounded-full hover:bg-indigo-700 transition">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        
                        {/* Message Area */}
                        <div className="flex-grow p-4 space-y-4 overflow-y-auto custom-scrollbar">
                            {chatHistory.map((message, index) => (
                                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-xl shadow ${message.role === 'user' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                                        <p className="whitespace-pre-wrap">{message.text}</p>
                                        {/* Display Sources */}
                                        {message.sources && message.sources.length > 0 && (
                                            <div className="mt-2 text-xs text-gray-500 border-t border-gray-300 pt-1">
                                                <div className="flex items-center font-bold mb-1 text-gray-600"><Globe className='w-3 h-3 mr-1'/> Sources:</div>
                                                {message.sources.map((source, i) => (
                                                    <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="block hover:underline text-indigo-500 truncate">
                                                        [{i+1}] {source.title}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 text-gray-800 p-3 rounded-xl rounded-tl-none flex items-center shadow">
                                        <Loader2 className="animate-spin w-4 h-4 mr-2 text-indigo-500" />
                                        <span className="text-sm">Typing...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        
                        {/* Input Area */}
                        <form onSubmit={handleChatSubmit} className="p-3 border-t border-gray-200 flex bg-white rounded-b-xl">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                className="flex-grow p-3 border border-gray-300 rounded-full focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner"
                                placeholder="Ask a career question..."
                                disabled={isChatLoading}
                            />
                            <button
                                type="submit"
                                className={`ml-2 p-3 rounded-full text-white transition duration-200 flex items-center justify-center ${
                                    isChatLoading || !chatInput.trim() 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                                disabled={isChatLoading || !chatInput.trim()}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                )}

                {/* Chat Button (Toggles Chat) */}
                {!isChatOpen && (
                    <button 
                        onClick={() => setIsChatOpen(true)} 
                        className="w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 transition duration-300 flex items-center justify-center transform hover:scale-105"
                        title="Open Career Assistant"
                    >
                        <MessageCircle className="w-8 h-8" />
                    </button>
                )}
            </div>

            {/* Custom Scrollbar Styles for the Chat Window */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #bdbdbd;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
            `}</style>
        </div>
    );
};

export default App;
