
import React, { useState, useEffect, useRef } from 'react';
import { Menu, Send, Plus, Search, RefreshCw, Download, FileText, ChevronRight, ShieldAlert, BookOpen, Globe, Briefcase, Calendar, ChevronLeft, Save, Trash2, Check, Lightbulb, Printer, Settings as SettingsIcon, MessageCircle, Mail, X, Bell, Database, Upload, Pin, PinOff, BarChart2, Sparkles, Copy, Lock, ShieldCheck, Fingerprint, ExternalLink, SendHorizonal, BrainCircuit, TrendingUp, History, Edit3, Key, Wand2, Clock, Share2, Link, Zap, Target, Radar } from 'lucide-react';
import Navigation from './components/Navigation';
import MarkdownRenderer from './components/MarkdownRenderer';
import ShareButton from './components/ShareButton';
import IncidentChart from './components/IncidentChart';
import { View, ChatMessage, Template, SecurityRole, StoredReport, WeeklyTip, UserProfile, KnowledgeDocument } from './types';
import { STATIC_TEMPLATES } from './constants';
import { generateAdvisorResponseStream, generateTrainingModuleStream, analyzeReport, fetchBestPractices, generateWeeklyTip, generateOperationalInsights } from './services/geminiService';

const AntiRiskLogo = ({ className = "w-24 h-24", light = false }: { className?: string; light?: boolean }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5 L95 85 L5 85 Z" fill={light ? "#1e293b" : "#000000"} />
    <path d="M50 15 L85 80 L15 80 Z" fill={light ? "#334155" : "#000000"} />
    <path d="M5 L85 L25 85 L15 65 Z" fill="#dc2626" />
    <path d="M95 85 L75 85 L85 65 Z" fill="#dc2626" />
    <circle cx="50" cy="55" r="30" fill="white" />
    <text x="50" y="68" fontFamily="Arial, sans-serif" fontSize="38" fontWeight="bold" fill="black" textAnchor="middle">AR</text>
    <rect x="0" y="85" width="100" height="15" fill={light ? "#000000" : "black"} />
    <text x="50" y="96" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold" fill="white" textAnchor="middle">ANTI-RISK SECURITY</text>
  </svg>
);

function App() {
  const [appState, setAppState] = useState<'SPLASH' | 'PIN_ENTRY' | 'PIN_SETUP' | 'READY'>('SPLASH');
  const [pinInput, setPinInput] = useState('');
  const [setupStep, setSetupStep] = useState(1);
  const [tempPin, setTempPin] = useState('');
  const [isPinError, setIsPinError] = useState(false);
  const [splashProgress, setSplashProgress] = useState(0);
  const [storedPin, setStoredPin] = useState<string | null>(() => localStorage.getItem('security_app_vault_pin'));

  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuotaError, setShowQuotaError] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('security_app_profile');
    return saved ? JSON.parse(saved) : { name: 'Executive Director', phoneNumber: '', email: '' };
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('security_app_chat');
    return saved ? JSON.parse(saved) : [{
      id: 'welcome',
      role: 'model',
      text: "Welcome, Director. I am the AntiRisk Strategy Unit. Our protocols are currently aligned with ISO 18788 and Nigerian private security regulations.",
      timestamp: Date.now(),
      isPinned: false
    }];
  });

  const [storedReports, setStoredReports] = useState<StoredReport[]>(() => {
    const saved = localStorage.getItem('security_app_reports');
    return saved ? JSON.parse(saved) : [];
  });

  const [weeklyTips, setWeeklyTips] = useState<WeeklyTip[]>(() => {
    const saved = localStorage.getItem('security_app_weekly_tips');
    return saved ? JSON.parse(saved) : [];
  });

  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeDocument[]>(() => {
    const saved = localStorage.getItem('security_app_kb');
    return saved ? JSON.parse(saved) : [];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isAdvisorThinking, setIsAdvisorThinking] = useState(false);
  const [showKbModal, setShowKbModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [reportText, setReportText] = useState('');
  const [operationalInsights, setOperationalInsights] = useState<string>(() => localStorage.getItem('security_app_insights') || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isTipLoading, setIsTipLoading] = useState(false);

  const [bpSearchQuery, setBpSearchQuery] = useState('');
  const [isBpLoading, setIsBpLoading] = useState(false);
  const [bpResult, setBpResult] = useState<{ text: string, sources?: any[] } | null>(null);

  const [trainingRole, setTrainingRole] = useState<string>(SecurityRole.GUARD);
  const [trainingTopic, setTrainingTopic] = useState('');
  const [trainingWeek, setTrainingWeek] = useState('Week 1');
  const [trainingContent, setTrainingContent] = useState('');
  const [isTrainingLoading, setIsTrainingLoading] = useState(false);

  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem('security_app_profile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem('security_app_chat', JSON.stringify(messages)); chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { localStorage.setItem('security_app_reports', JSON.stringify(storedReports)); }, [storedReports]);
  useEffect(() => { localStorage.setItem('security_app_weekly_tips', JSON.stringify(weeklyTips)); }, [weeklyTips]);
  useEffect(() => { localStorage.setItem('security_app_kb', JSON.stringify(knowledgeBase)); }, [knowledgeBase]);
  useEffect(() => { localStorage.setItem('security_app_insights', operationalInsights); }, [operationalInsights]);

  useEffect(() => {
    if (appState === 'SPLASH') {
      const startTime = Date.now();
      const duration = 1500;
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        setSplashProgress(progress);
        if (progress >= 100) {
          clearInterval(timer);
          setAppState(storedPin ? 'PIN_ENTRY' : 'PIN_SETUP');
        }
      }, 30);
      return () => clearInterval(timer);
    }
  }, [appState, storedPin]);

  const handlePinDigit = (digit: string) => {
    if (pinInput.length >= 4) return;
    const newPin = pinInput + digit;
    setPinInput(newPin);
    setIsPinError(false);
    if (newPin.length === 4) {
      if (appState === 'PIN_ENTRY') {
        if (newPin === storedPin) setAppState('READY');
        else { setIsPinError(true); setTimeout(() => setPinInput(''), 500); }
      } else {
        if (setupStep === 1) { setTempPin(newPin); setSetupStep(2); setPinInput(''); }
        else {
          if (newPin === tempPin) { 
            localStorage.setItem('security_app_vault_pin', newPin); 
            setStoredPin(newPin); 
            setAppState('READY'); 
          } else { 
            setIsPinError(true); 
            setSetupStep(1); 
            setPinInput(''); 
          }
        }
      }
    }
  };

  const checkErrorForQuota = (error: any) => {
    const errorMsg = String(error).toLowerCase();
    if (errorMsg.includes("quota") || errorMsg.includes("429") || errorMsg.includes("limit") || errorMsg.includes("requested entity was not found")) {
      setShowQuotaError(true);
      return true;
    }
    return false;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: inputMessage, timestamp: Date.now(), isPinned: false };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsAdvisorThinking(true);
    const aiMsgId = (Date.now() + 1).toString() + 'ai';
    let fullAiText = "";
    setMessages(prev => [...prev, { id: aiMsgId, role: 'model', text: "", timestamp: Date.now(), isPinned: false }]);
    
    try {
      await generateAdvisorResponseStream(messages, inputMessage, knowledgeBase, (chunk) => {
        setIsAdvisorThinking(false);
        fullAiText += chunk;
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: fullAiText } : m));
      });
    } catch (error) {
      setIsAdvisorThinking(false);
      if (!checkErrorForQuota(error)) {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: "⚠️ Operational failure. Check secure connection." } : m));
      }
    }
  };

  const handleFetchBP = async () => {
    if (!bpSearchQuery.trim()) return;
    setIsBpLoading(true);
    setBpResult(null);
    try {
      const result = await fetchBestPractices(bpSearchQuery);
      setBpResult(result);
    } catch (err) {
      console.error("BP Fetch Error:", err);
      if (!checkErrorForQuota(err)) {
        setBpResult({ text: "⚠️ **SYSTEM ALERT**: Intelligence Hub failed to connect. Ensure your encrypted key is active and the operation domain is supported.", sources: [] });
      }
    } finally {
      setIsBpLoading(false);
    }
  };

  const handleGenerateTraining = async () => {
    if (!trainingTopic.trim()) return;
    setIsTrainingLoading(true);
    setTrainingContent("");
    let fullContent = "";
    try {
      await generateTrainingModuleStream(trainingRole, trainingTopic, trainingWeek, (chunk) => {
        setIsTrainingLoading(false);
        fullContent += chunk;
        setTrainingContent(fullContent);
      });
    } catch (error) {
      setIsTrainingLoading(false);
      checkErrorForQuota(error);
    }
  };

  const handleAnalyzeReport = async () => {
    if (!reportText) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeReport(reportText);
      setStoredReports(prev => [{ id: Date.now().toString(), timestamp: Date.now(), dateStr: new Date().toLocaleDateString(), content: reportText, analysis: result }, ...prev]);
      setReportText(''); 
    } catch (error) {
      checkErrorForQuota(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateWeeklyTip = async () => {
    setIsTipLoading(true);
    try {
      const tipText = await generateWeeklyTip();
      const newTip: WeeklyTip = {
        id: Date.now().toString(),
        weekDate: new Date().toLocaleDateString(),
        topic: "Weekly Strategic Tip",
        content: tipText,
        isAutoGenerated: true,
        timestamp: Date.now()
      };
      setWeeklyTips(prev => [newTip, ...prev]);
    } catch (error) {
      checkErrorForQuota(error);
    } finally {
      setIsTipLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (storedReports.length === 0) return;
    setIsGeneratingInsights(true);
    try {
      const insights = await generateOperationalInsights(storedReports);
      setOperationalInsights(insights);
    } catch (error) {
      checkErrorForQuota(error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const renderReturnToDashboard = () => (
    <button 
      onClick={() => setCurrentView(View.DASHBOARD)}
      className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-all font-bold text-sm uppercase tracking-widest group"
    >
      <div className="w-10 h-10 bg-slate-800/50 rounded-full flex items-center justify-center group-hover:bg-slate-700 transition-all">
        <ChevronLeft size={20} />
      </div>
      Dashboard
    </button>
  );

  const renderDashboard = () => (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500">
      <div className="bg-[#1b2537] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
        <h2 className="text-4xl font-black text-white tracking-tight mb-4">Executive Dashboard</h2>
        <p className="text-slate-400 text-lg">Operational Intelligence for {userProfile.name}</p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button onClick={() => setCurrentView(View.ADVISOR)} className="bg-[#2962ff] p-6 rounded-2xl text-left hover:bg-blue-700 transition-all shadow-xl group">
             <ShieldAlert className="mb-4 text-blue-200 group-hover:scale-110 transition-transform" size={32} />
             <h4 className="text-xl font-bold text-white">Ask Advisor</h4>
             <p className="text-blue-100 text-sm opacity-80">Strategic consultations.</p>
          </button>
          <button onClick={() => setCurrentView(View.BEST_PRACTICES)} className="bg-[#1a2232] border border-slate-700/50 p-6 rounded-2xl text-left hover:bg-slate-800 transition-all shadow-xl group">
             <Globe className="mb-4 text-blue-500 group-hover:scale-110 transition-transform" size={32} />
             <h4 className="text-xl font-bold text-white">Intelligence Hub</h4>
             <p className="text-slate-400 text-sm">Regulatory monitoring.</p>
          </button>
          <button onClick={() => setCurrentView(View.TRAINING)} className="bg-[#1a2232] border border-slate-700/50 p-6 rounded-2xl text-left hover:bg-slate-800 transition-all shadow-xl group">
             <BookOpen className="mb-4 text-emerald-500 group-hover:scale-110 transition-transform" size={32} />
             <h4 className="text-xl font-bold text-white">Training Builder</h4>
             <p className="text-slate-400 text-sm">Deployment modules.</p>
          </button>
          <button onClick={() => setCurrentView(View.REPORT_ANALYZER)} className="bg-[#1a2232] border border-slate-700/50 p-6 rounded-2xl text-left hover:bg-slate-800 transition-all shadow-xl group">
             <FileText className="mb-4 text-amber-500 group-hover:scale-110 transition-transform" size={32} />
             <h4 className="text-xl font-bold text-white">Analyzer</h4>
             <p className="text-slate-400 text-sm">Field log auditing.</p>
          </button>
        </div>
      </div>
      {storedReports.length > 0 && (
        <div className="bg-[#1b2537] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
          <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-widest">
            <BarChart2 size={24} className="text-blue-500" />
            Field Log Trends
          </h3>
          <IncidentChart reports={storedReports} />
        </div>
      )}
    </div>
  );

  const renderBestPractices = () => (
    <div className="max-w-5xl mx-auto space-y-10 pb-24 animate-in fade-in duration-500">
      {renderReturnToDashboard()}
      <div className="bg-[#1b2537] rounded-[2.5rem] p-10 border border-slate-700/50 shadow-2xl">
        <div className="flex items-center gap-6 mb-10">
          <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-500">
            <Globe size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight">Intelligence Hub</h2>
            <p className="text-slate-400 text-lg">Nigerian Compliance & Global Strategic Standards.</p>
          </div>
        </div>

        <div className="flex gap-4">
          <input 
            value={bpSearchQuery} 
            onChange={(e) => setBpSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetchBP()}
            placeholder="Search NSCDC policies, licensing updates, or global tactical shifts..." 
            className="flex-1 bg-slate-950/50 border border-slate-700 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500 transition-all text-lg shadow-inner"
          />
          <button 
            onClick={handleFetchBP}
            disabled={isBpLoading || !bpSearchQuery.trim()}
            className="bg-[#2962ff] hover:bg-blue-700 px-8 rounded-2xl text-white shadow-xl active:scale-95 disabled:opacity-50 font-black uppercase tracking-widest text-sm flex items-center gap-3 transition-all"
          >
            {isBpLoading ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} />}
            {isBpLoading ? "Synthesizing" : "Generate"}
          </button>
        </div>
      </div>

      {isBpLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <RefreshCw className="animate-spin text-blue-500" size={48} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm text-center">Auditing Nigerian Official Sources & Global Repositories...</p>
        </div>
      ) : bpResult && (
        <div className="grid lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#1b2537] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative">
              <div className="absolute top-10 right-10">
                <ShareButton title={`Intelligence Hub: ${bpSearchQuery}`} content={bpResult.text} />
              </div>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-white flex items-center gap-4">
                  <ShieldCheck size={32} className="text-blue-500" />
                  Compliance Briefing
                </h3>
              </div>
              <MarkdownRenderer content={bpResult.text} />
            </div>
          </div>
          <div className="bg-[#1b2537] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl h-fit">
            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3 uppercase tracking-widest">
              <Database size={20} className="text-emerald-500" />
              Verified Feed
            </h3>
            <div className="space-y-4">
              {bpResult.sources && bpResult.sources.map((source, i) => (
                <a key={i} href={source.url} target="_blank" rel="noopener noreferrer" className="block p-4 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-blue-500/50 transition-all group">
                  <p className="text-sm font-bold text-slate-200 line-clamp-2 mb-1 group-hover:text-blue-400">{source.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    <ExternalLink size={10} /> Validated Agency
                  </div>
                </a>
              ))}
              {(!bpResult.sources || bpResult.sources.length === 0) && (
                <div className="text-center py-6 opacity-40">
                  <p className="text-xs font-bold uppercase tracking-widest">Real-time Grounding Active.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAdvisor = () => (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-[#0d1421] rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl max-w-5xl mx-auto w-full">
      <div className="p-5 bg-slate-900/40 border-b border-slate-700 flex justify-between items-center px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentView(View.DASHBOARD)} className="p-2 text-slate-400 hover:text-white transition-colors mr-2">
            <ChevronLeft size={20} />
          </button>
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Strategy Unit Online</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPinnedOnly(!showPinnedOnly)} className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase transition-all ${showPinnedOnly ? 'bg-amber-500/20 text-amber-500 border-amber-500' : 'text-slate-400 border-slate-700'}`}>Pins</button>
          <button onClick={() => setMessages(prev => [prev[0]])} className="px-3 py-1.5 bg-red-600/10 text-red-500 border border-red-600/20 rounded-xl text-[10px] font-black uppercase">Clear</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-12 scrollbar-hide">
        {(showPinnedOnly ? messages.filter(m => m.isPinned) : messages).map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
            <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                {msg.role === 'model' && (
                  <button onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? {...m, isPinned: !m.isPinned} : m))} className={`${msg.isPinned ? 'text-amber-500' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}><Pin size={12} fill={msg.isPinned ? 'currentColor' : 'none'} /></button>
                )}
              </div>
              <div className={`p-6 rounded-3xl shadow-xl border ${msg.role === 'user' ? 'bg-[#2962ff] border-blue-400/20 text-white rounded-tr-none' : 'bg-[#1a2232] border-white/5 text-slate-100 rounded-tl-none'}`}>
                <MarkdownRenderer content={msg.text} />
              </div>
            </div>
          </div>
        ))}
        {isAdvisorThinking && <div className="animate-pulse text-blue-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><RefreshCw className="animate-spin" size={14} /> Synthesizing Advice...</div>}
        <div ref={chatEndRef} />
      </div>
      <div className="p-6 bg-slate-900/60 border-t border-slate-800 flex gap-4 backdrop-blur-2xl">
        <input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask Strategy Engine..." className="flex-1 bg-slate-950/70 border border-slate-700/50 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500 transition-all shadow-inner" />
        <button onClick={handleSendMessage} className="bg-[#2962ff] hover:bg-blue-700 p-4 rounded-2xl text-white shadow-xl active:scale-90 transition-all"><Send size={24} /></button>
      </div>
    </div>
  );

  const renderWeeklyTips = () => (
    <div className="max-w-4xl mx-auto space-y-10 pb-24 animate-in fade-in duration-500">
      {renderReturnToDashboard()}
      <div className="bg-[#1b2537] rounded-[2.5rem] p-10 border border-slate-700/50 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-500">
            <Lightbulb size={40} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Executive Tips</h2>
            <p className="text-slate-400">Weekly Strategic Excellence.</p>
          </div>
        </div>
        <button onClick={handleGenerateWeeklyTip} disabled={isTipLoading} className="bg-amber-500 hover:bg-amber-600 px-8 py-4 rounded-2xl text-[#0d1421] shadow-xl active:scale-95 font-black uppercase tracking-widest text-sm flex items-center gap-3 transition-all whitespace-nowrap">
          {isTipLoading ? <RefreshCw className="animate-spin" size={20} /> : <Wand2 size={20} />} Generate Tip
        </button>
      </div>
      <div className="space-y-8">
        {weeklyTips.map(tip => (
          <div key={tip.id} className="bg-[#1b2537] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8"><ShareButton title={`Weekly Tip: ${tip.weekDate}`} content={tip.content} /></div>
            <div className="flex items-center gap-3 text-amber-500 font-black text-[10px] uppercase tracking-widest mb-4"><Calendar size={12} /> {tip.weekDate}</div>
            <h3 className="text-2xl font-black text-white mb-6 pr-20">{tip.topic}</h3>
            <MarkdownRenderer content={tip.content} />
          </div>
        ))}
      </div>
    </div>
  );

  const renderToolkit = () => (
    <div className="max-w-6xl mx-auto space-y-10 pb-24 animate-in fade-in duration-500">
      {renderReturnToDashboard()}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {STATIC_TEMPLATES.map(template => (
          <div key={template.id} className="bg-[#1b2537] rounded-[2.5rem] p-8 border border-white/5 hover:border-blue-500/50 transition-all shadow-xl flex flex-col h-full">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6"><FileText size={32} /></div>
            <h3 className="text-2xl font-black text-white mb-3">{template.title}</h3>
            <p className="text-slate-400 mb-8 flex-1">{template.description}</p>
            <div className="flex gap-3">
              <button onClick={() => { navigator.clipboard.writeText(template.content); alert('Template copied'); }} className="flex-1 bg-slate-900 border border-slate-800 hover:border-blue-500 px-6 py-3 rounded-xl text-slate-300 font-bold text-sm transition-all flex items-center justify-center gap-2">Copy</button>
              <ShareButton title={template.title} content={template.content} className="flex-1" />
            </div>
          </div>
        ))}
        <div className="bg-[#1b2537] rounded-[2.5rem] p-8 border border-white/5 hover:border-emerald-500/50 transition-all shadow-xl flex flex-col justify-center items-center text-center cursor-pointer group" onClick={() => setShowKbModal(true)}>
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform"><Plus size={40} /></div>
          <h3 className="text-2xl font-black text-white mb-2">Memory Bank</h3>
          <p className="text-slate-500 text-sm">Upload SOPs to ground AI advice.</p>
        </div>
      </div>
    </div>
  );

  if (appState === 'SPLASH') {
    return (
      <div className="fixed inset-0 bg-[#0a0f1a] flex flex-col items-center justify-center p-8 z-[100]">
        <AntiRiskLogo className="w-32 h-32 mb-10 animate-pulse" light={true} />
        <div className="w-full max-w-xs h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-[#2962ff] transition-all duration-300" style={{ width: `${splashProgress}%` }}></div>
        </div>
      </div>
    );
  }

  if (appState === 'PIN_ENTRY' || appState === 'PIN_SETUP') {
    return (
      <div className="fixed inset-0 bg-[#0a0f1a] flex flex-col items-center justify-center p-6 z-[100]">
        <AntiRiskLogo className="w-20 h-20 mb-12 mx-auto" />
        <h2 className="text-3xl font-black text-white mb-8 tracking-tighter">{appState === 'PIN_SETUP' ? 'Initialize PIN' : 'Executive Access'}</h2>
        <div className="flex gap-4 mb-16">
          {[...Array(4)].map((_, i) => <div key={i} className={`w-4 h-4 rounded-full border-2 ${pinInput.length > i ? 'bg-blue-500 border-blue-500' : 'border-slate-800'}`} />)}
        </div>
        <div className="grid grid-cols-3 gap-8 w-full max-w-xs">
          {[1,2,3,4,5,6,7,8,9].map(num => <button key={num} onClick={() => handlePinDigit(num.toString())} className="aspect-square bg-slate-900/50 border border-slate-800 rounded-2xl text-3xl font-black text-white active:scale-90 transition-all">{num}</button>)}
          <div />
          <button onClick={() => handlePinDigit('0')} className="aspect-square bg-slate-900/50 border border-slate-800 rounded-2xl text-3xl font-black text-white active:scale-90 transition-all">0</button>
          <button onClick={() => setPinInput('')} className="text-red-500 font-black text-xs uppercase">Reset</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0f1a] text-slate-100">
      <Navigation currentView={currentView} setView={setCurrentView} isMobileMenuOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} onOpenSettings={() => setShowSettings(true)} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="lg:hidden p-6 border-b border-slate-800/40 flex justify-between items-center bg-[#0d1421]">
          <h1 className="font-black text-2xl tracking-tighter uppercase">AntiRisk</h1>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-3 text-white bg-slate-800/50 rounded-2xl"><Menu size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 lg:p-12 scrollbar-hide">
          {currentView === View.DASHBOARD && renderDashboard()}
          {currentView === View.ADVISOR && renderAdvisor()}
          {currentView === View.BEST_PRACTICES && renderBestPractices()}
          {currentView === View.WEEKLY_TIPS && renderWeeklyTips()}
          {currentView === View.TRAINING && (
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 pb-24 animate-in fade-in duration-500">
              <div className="w-full lg:w-[350px] space-y-4">
                {renderReturnToDashboard()}
                <div className="bg-[#0d1421] border border-slate-700/50 rounded-3xl p-8 h-fit space-y-8">
                  <h3 className="text-xl font-bold flex items-center gap-3"><BookOpen className="text-emerald-500" /> Training Unit</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Subject Area</label>
                      <input value={trainingTopic} onChange={(e) => setTrainingTopic(e.target.value)} placeholder="e.g. Intrusion SOP" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Deployment Week</label>
                      <div className="relative group">
                        <select 
                          value={trainingWeek} 
                          onChange={(e) => setTrainingWeek(e.target.value)} 
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none appearance-none cursor-pointer focus:border-emerald-500 transition-all"
                        >
                          <option value="Week 1">Week 1: Fundamentals</option>
                          <option value="Week 2">Week 2: Advanced Operations</option>
                          <option value="Week 3">Week 3: Command & Oversight</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                          <ChevronRight className="rotate-90" size={16} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Target Role</label>
                      <div className="relative group">
                        <select 
                          value={trainingRole} 
                          onChange={(e) => setTrainingRole(e.target.value)} 
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none appearance-none cursor-pointer focus:border-emerald-500 transition-all"
                        >
                          <option value={SecurityRole.GUARD}>Security Guard</option>
                          <option value={SecurityRole.SUPERVISOR}>Site Supervisor</option>
                          <option value={SecurityRole.GEN_SUPERVISOR}>General Supervisor</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                          <ChevronRight className="rotate-90" size={16} />
                        </div>
                      </div>
                    </div>
                    <button onClick={handleGenerateTraining} disabled={isTrainingLoading || !trainingTopic} className="w-full bg-[#1f2937] hover:bg-slate-700 py-4 rounded-xl font-black text-white transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lg">
                      {isTrainingLoading ? <RefreshCw className="animate-spin" size={16} /> : <Wand2 size={16} />} 
                      {isTrainingLoading ? "Synthesizing" : "Deploy Training"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 bg-[#0d1421] border border-slate-700/50 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden min-h-[500px]">
                {trainingContent ? (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center mb-8">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em]">
                          <Clock size={12} /> {trainingWeek}
                        </div>
                        <h4 className="text-2xl font-black">{trainingTopic}</h4>
                      </div>
                      <ShareButton title={`${trainingWeek}: ${trainingTopic}`} content={trainingContent} />
                    </div>
                    <MarkdownRenderer content={trainingContent} />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20">
                    <BookOpen size={64} />
                    <p className="font-black uppercase tracking-widest text-sm mt-4">Select parameters to deploy curriculum.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {currentView === View.REPORT_ANALYZER && (
            <div className="max-w-6xl mx-auto space-y-4 pb-20 animate-in fade-in duration-500">
              {renderReturnToDashboard()}
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-[#1b2537] p-8 rounded-3xl border border-slate-700/50 h-fit">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><FileText className="text-blue-500" /> Log Ingestion</h3>
                  <textarea value={reportText} onChange={(e) => setReportText(e.target.value)} className="w-full h-64 bg-slate-950/40 border border-slate-700 rounded-2xl p-6 text-white outline-none resize-none mb-6" placeholder="Paste field logs here..." />
                  <button onClick={handleAnalyzeReport} disabled={isAnalyzing || !reportText} className="w-full bg-[#2962ff] hover:bg-blue-700 py-4 rounded-xl font-black text-white flex items-center justify-center gap-2">
                    {isAnalyzing ? <RefreshCw className="animate-spin" /> : <ShieldCheck />} {isAnalyzing ? 'Auditing' : 'Run Audit'}
                  </button>
                </div>
                <div className="lg:col-span-2 space-y-6">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Audit History</h4>
                  {storedReports.map(report => (
                    <div key={report.id} className="bg-[#1b2537] p-8 rounded-[2rem] border border-white/5 shadow-xl animate-in slide-in-from-bottom-2">
                      <div className="flex justify-between items-center mb-6">
                        <span className="bg-blue-600/10 text-blue-400 px-4 py-1 rounded-full text-[10px] font-black">{report.dateStr}</span>
                        <ShareButton title={`Audit: ${report.dateStr}`} content={report.analysis} />
                      </div>
                      <MarkdownRenderer content={report.analysis} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {currentView === View.TOOLKIT && renderToolkit()}
        </div>
      </main>

      {showKbModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-[#0d1421] border border-white/10 rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-white flex items-center gap-4">
                  <Database size={28} className="text-emerald-500" />
                  Knowledge Upload
                </h3>
                <button onClick={() => setShowKbModal(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Asset Title</label>
                  <input value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} placeholder="e.g. Site SOP" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Content</label>
                  <textarea value={newDocContent} onChange={(e) => setNewDocContent(e.target.value)} placeholder="Paste protocol text here..." className="w-full h-48 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none resize-none focus:border-emerald-500 transition-all" />
                </div>
                <button 
                  onClick={() => {
                    if (newDocTitle && newDocContent) {
                      setKnowledgeBase(prev => [{ id: Date.now().toString(), title: newDocTitle, content: newDocContent, dateAdded: new Date().toLocaleDateString() }, ...prev]);
                      setNewDocTitle(''); setNewDocContent(''); setShowKbModal(false);
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 py-4 rounded-xl font-black text-white flex items-center justify-center gap-2 shadow-lg"
                >
                  <Upload size={18} /> Ingest into Strategy Unit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showQuotaError && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="bg-[#111827] border-2 border-red-500/50 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl text-center">
            <ShieldAlert size={48} className="mx-auto mb-6 text-red-500" />
            <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">API Restricted</h2>
            <p className="text-slate-400 mb-8">Switch to a personal API key to restore executive intelligence operations.</p>
            <div className="space-y-4">
              <button onClick={() => { /* @ts-ignore */ window.aistudio.openSelectKey(); setShowQuotaError(false); }} className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-black text-lg text-white flex items-center justify-center gap-3 transition-all">
                <Key size={20} /> Select API Key
              </button>
              <button onClick={() => setShowQuotaError(false)} className="w-full text-slate-500 font-bold uppercase text-sm pt-2">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-[#0d1421] border border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-white flex items-center gap-4">
                  <SettingsIcon size={28} className="text-blue-500" />
                  Alert Settings
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Executive Name</label>
                  <input value={userProfile.name} onChange={(e) => setUserProfile({...userProfile, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" />
                </div>
                <div className="pt-4 border-t border-white/5 flex gap-4">
                  <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="flex-1 border border-red-500/30 text-red-500 hover:bg-red-500/5 py-4 rounded-xl font-black text-xs uppercase tracking-widest">Wipe Data</button>
                  <button onClick={() => setShowSettings(false)} className="flex-1 bg-[#2962ff] hover:bg-blue-700 py-4 rounded-xl font-black text-white text-xs uppercase tracking-widest">Apply</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
