import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Menu, X, Presentation, Send, Twitter, Github, Linkedin, 
  Upload, FileText, Sparkles, Download, RefreshCw, AlertCircle, 
  MonitorPlay, Image as ImageIcon, Zap, Brain, Check,
  LayoutDashboard, Users, Activity, Settings, LogOut, TrendingUp, 
  DollarSign, Server, Search, MoreVertical, CheckCircle, XCircle, 
  Bell, Lock, ArrowRight, FileBox, Star, Trash2, Edit
} from 'lucide-react';

// ==========================================
// TYPES
// ==========================================

export interface NavItem {
  label: string;
  href: string;
}

export interface Slide {
  title: string;
  content: string[];
  speakerNotes?: string;
  imageDescription?: string;
  imageUrl?: string;
}

export interface PdfState {
  file: File | null;
  base64: string | null;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'Free' | 'Pro' | 'Team';
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  status: 'Success' | 'Failed';
}

export interface Template {
  id: string;
  name: string;
  type: 'Free' | 'Pro';
  thumbnail: string;
  downloads: number;
}

declare global {
  interface Window {
    PptxGenJS: any;
  }
}

// ==========================================
// SERVICE (Gemini)
// ==========================================

// Helper to get client instance
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

const generateSlidesFromPdf = async (
  pdfBase64: string,
  instruction: string = ""
): Promise<Slide[]> => {
  const ai = getAiClient();
  
  const prompt = `
    You are an expert presentation designer. 
    Analyze the attached PDF document and create a structured PowerPoint presentation.
    
    Extract the key information and organize it into logical slides.
    For each slide, provide:
    1. A clear, catchy title.
    2. A list of bullet points (3-5 points per slide) summarizing the content.
    3. Speaker notes to help present the slide.
    4. A detailed 'imageDescription'. Look at the specific page in the PDF. If there is a chart, graph, or photo, describe it visually in detail so it can be recreated. If there is no specific image, describe a relevant professional stock photo concept that fits the content.
    
    ${instruction ? `Additional Instructions: ${instruction}` : ''}
    
    Ensure the flow is narrative and engaging. 
    The output must be a JSON array of slide objects.
  `;

  const commonConfig = {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.ARRAY, items: { type: Type.STRING } },
          speakerNotes: { type: Type.STRING },
          imageDescription: { type: Type.STRING },
        },
        required: ["title", "content"],
      },
    },
  };

  const userContent = {
    parts: [
      {
        inlineData: {
          data: pdfBase64,
          mimeType: 'application/pdf',
        },
      },
      {
        text: prompt,
      },
    ],
  };

  try {
    // Attempt 1: Gemini 3 Pro
    console.log("Attempting generation with gemini-3-pro-preview...");
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: userContent,
      config: commonConfig,
    });

    if (response.text) {
      return JSON.parse(response.text) as Slide[];
    }
    throw new Error("No content generated from Pro model.");

  } catch (error: any) {
    console.warn("Gemini 3 Pro failed, retrying with Flash...", error);
    
    // Attempt 2: Gemini 2.5 Flash (Fallback)
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userContent,
        config: commonConfig,
      });

      if (response.text) {
        return JSON.parse(response.text) as Slide[];
      }
      throw new Error("No content generated from Flash model.");
    } catch (fallbackError: any) {
      console.error("Gemini API Error (Both models failed):", fallbackError);
      // Throw the original error if it was an API key issue, otherwise the fallback error
      if (error.message?.includes("API key")) throw error;
      throw fallbackError;
    }
  }
};

const generateSlideImage = async (prompt: string): Promise<string | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });

    for (const cand of response.candidates || []) {
      for (const part of cand.content.parts) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini API Error (Image):", error);
    return null;
  }
};

// ==========================================
// COMPONENTS
// ==========================================

// --- Header ---
const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: 'Converter', href: '#' },
    { label: 'How it Works', href: '#features' },
    { label: 'Examples', href: '#gallery' },
    { label: 'Pricing', href: '#pricing' },
  ];

  const handleScroll = (e: React.MouseEvent<HTMLElement>, href: string) => {
    e.preventDefault();
    if (href === '#' || href === '') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const targetId = href.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={(e) => handleScroll(e, '#')}>
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-lg text-white">
              <Presentation size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">
              Pdf<span className="text-orange-600">ToolsHub</span>
            </span>
          </div>

          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleScroll(e, item.href)}
                className="text-slate-600 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center">
            <button onClick={(e) => handleScroll(e, '#')} className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-orange-500/20">
              Convert PDF
            </button>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 hover:text-slate-900 focus:outline-none p-2">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-xl">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="text-slate-600 hover:text-orange-600 hover:bg-slate-50 block px-3 py-2 rounded-md text-base font-medium cursor-pointer" onClick={(e) => handleScroll(e, item.href)}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

// --- Footer ---
const Footer: React.FC = () => {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href === '#admin') {
      window.location.hash = 'admin';
      return; 
    }
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Presentation size={24} className="text-orange-400" />
              <span className="font-bold text-xl">PdfToolsHub</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Transforming your documents into professional presentations.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Github size={20} /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Linkedin size={20} /></a>
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" onClick={(e) => handleScroll(e, '#features')} className="hover:text-orange-400 cursor-pointer">Features</a></li>
              <li><a href="#pricing" onClick={(e) => handleScroll(e, '#pricing')} className="hover:text-orange-400 cursor-pointer">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#admin" onClick={(e) => handleScroll(e, '#admin')} className="hover:text-orange-400 cursor-pointer">Admin Login</a></li>
            </ul>
          </div>
          <div>
             <h3 className="text-white font-semibold mb-4">Newsletter</h3>
             <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="Email" className="bg-slate-800 rounded px-4 py-2 text-sm text-white" />
                <button className="bg-orange-600 text-white rounded px-4 py-2 text-sm flex items-center justify-center gap-2">Subscribe <Send size={14}/></button>
             </form>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} PdfToolsHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// --- Converter (ImageEditor) ---
const Converter: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<PdfState>({ file: null, base64: null });
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [instruction, setInstruction] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      setErrorMessage("Please upload a valid PDF file.");
      return;
    }
    setSlides(null);
    setStatus(AppStatus.IDLE);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setPdfFile({ file, base64: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleGenerate = async () => {
    if (!pdfFile.base64) return;
    
    // Preliminary check
    if (!process.env.API_KEY) {
        setErrorMessage("API Key is missing from environment. Please configure GEMINI_API_KEY.");
        return;
    }

    setStatus(AppStatus.LOADING);
    setErrorMessage(null);

    try {
      const generatedSlides = await generateSlidesFromPdf(pdfFile.base64, instruction);
      setSlides(generatedSlides);
      
      setStatus(AppStatus.GENERATING_IMAGES);
      const slidesWithImages = await Promise.all(
        generatedSlides.map(async (slide) => {
          if (slide.imageDescription) {
            const imageUrl = await generateSlideImage(slide.imageDescription);
            return { ...slide, imageUrl: imageUrl || undefined };
          }
          return slide;
        })
      );

      setSlides(slidesWithImages);
      setStatus(AppStatus.SUCCESS);
    } catch (error: any) {
      console.error(error);
      setStatus(AppStatus.ERROR);
      // More descriptive error message
      const msg = error.message || "Unknown error";
      if (msg.includes("API key")) {
        setErrorMessage("Invalid API Key. Please check your configuration.");
      } else if (msg.includes("400")) {
         setErrorMessage("The PDF content could not be processed. It might be too large or corrupted.");
      } else if (msg.includes("503") || msg.includes("500")) {
         setErrorMessage("Gemini service is temporarily unavailable. Please try again later.");
      } else {
         setErrorMessage(`Generation failed: ${msg}`);
      }
    }
  };

  const handleDownload = () => {
    if (!slides || !window.PptxGenJS) return;
    try {
      const pres = new window.PptxGenJS();
      const titleSlide = pres.addSlide();
      titleSlide.addText("Generated Presentation", { x: 1, y: 1, w: '80%', fontSize: 36, align: 'center', bold: true });
      titleSlide.addText("Created with PdfToolsHub", { x: 1, y: 2.5, w: '80%', fontSize: 18, align: 'center' });

      slides.forEach((slideData) => {
        const slide = pres.addSlide();
        slide.addText(slideData.title, { x: 0.5, y: 0.5, w: '90%', h: 0.8, fontSize: 32, bold: true });
        const bulletPoints = slideData.content.map(point => ({ text: point, options: { fontSize: 16, bullet: true, breakLine: true } }));
        
        if (slideData.imageUrl) {
            slide.addText(bulletPoints, { x: 0.5, y: 1.5, w: '45%', h: 4 });
            slide.addImage({ data: slideData.imageUrl, x: 5.5, y: 1.5, w: 4, h: 2.25 });
        } else {
            slide.addText(bulletPoints, { x: 0.5, y: 1.5, w: '90%', h: 4 });
        }
        if (slideData.speakerNotes) slide.addNotes(slideData.speakerNotes);
      });
      pres.writeFile({ fileName: `PdfToolsHub-${Date.now()}.pptx` });
    } catch (e) {
      setErrorMessage("Failed to generate PPTX file.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
      <div className="p-8 md:p-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">PDF to PowerPoint Converter</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Upload your PDF. Gemini will analyze it and create a presentation with visuals.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
              Upload PDF
            </h3>
            {!pdfFile.file ? (
              <div 
                className="border-2 border-dashed border-slate-300 rounded-2xl h-80 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/pdf" />
                <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform"><Upload className="text-orange-600 w-8 h-8" /></div>
                <p className="text-slate-900 font-medium mb-1">Click to upload or drag & drop</p>
              </div>
            ) : (
              <div className="relative rounded-2xl border border-slate-200 h-80 bg-slate-100 flex flex-col items-center justify-center p-8 text-center">
                <FileText size={64} className="text-orange-500 mb-4" />
                <h4 className="font-semibold text-slate-900 truncate w-full">{pdfFile.file.name}</h4>
                <button onClick={() => { setPdfFile({ file: null, base64: null }); setSlides(null); setStatus(AppStatus.IDLE); }} className="absolute top-4 right-4 bg-slate-200 p-2 rounded-full"><X size={20} /></button>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                 <span className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                 Instructions
              </h3>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="E.g., 'Focus on financial data'..."
                className="w-full border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 outline-none resize-none h-24 text-slate-700"
                disabled={status === AppStatus.LOADING || status === AppStatus.GENERATING_IMAGES}
              />
              <button
                onClick={handleGenerate}
                disabled={!pdfFile.base64 || status === AppStatus.LOADING || status === AppStatus.GENERATING_IMAGES}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
                  !pdfFile.base64 || status === AppStatus.LOADING || status === AppStatus.GENERATING_IMAGES ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:scale-[1.01]'
                }`}
              >
                {status === AppStatus.LOADING ? (
                   <>
                    <RefreshCw className="animate-spin" size={20} />
                    Analyzing...
                   </>
                ) : status === AppStatus.GENERATING_IMAGES ? (
                   <>
                    <ImageIcon className="animate-pulse" size={20} />
                    Creating Visuals...
                   </>
                ) : (
                   <>
                    <Sparkles size={20} />
                    Generate Presentation
                   </>
                )}
              </button>
              {errorMessage && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2"><AlertCircle size={16} />{errorMessage}</div>}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
              Preview & Download
            </h3>
            <div className={`h-[680px] rounded-2xl border-2 border-slate-100 bg-slate-50 relative overflow-hidden flex flex-col ${slides ? 'bg-white' : ''}`}>
              {!slides ? (
                <div className="flex-grow flex items-center justify-center p-8 text-center text-slate-400">
                    <div><MonitorPlay size={48} className="mx-auto mb-4" /> Your slides will appear here</div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                     {slides.map((slide, index) => (
                       <div key={index} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                         <span className="text-xs font-bold text-orange-600 uppercase mb-2 block">Slide {index + 1}</span>
                         <h4 className="text-xl font-bold text-slate-900 mb-3">{slide.title}</h4>
                         <div className="flex flex-col md:flex-row gap-4">
                             <ul className="flex-1 list-disc ml-5 space-y-2 text-sm text-slate-600">
                                {slide.content.map((point, idx) => <li key={idx}>{point}</li>)}
                             </ul>
                             {slide.imageUrl && <img src={slide.imageUrl} alt="Slide visual" className="w-full md:w-40 h-28 object-cover rounded bg-slate-100" />}
                         </div>
                       </div>
                     ))}
                  </div>
                  <div className="p-4 bg-white border-t border-slate-100">
                    <button onClick={handleDownload} disabled={status !== AppStatus.SUCCESS} className={`w-full px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 ${status !== AppStatus.SUCCESS ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white'}`}>
                      <Download size={20} /> Download PowerPoint
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Admin Panel ---
const initialUsers: User[] = [
  { id: '1', name: 'Alex Johnson', email: 'alex@example.com', plan: 'Pro', status: 'Active', lastLogin: '2 mins ago' },
  { id: '2', name: 'Sarah Williams', email: 'sarah@design.co', plan: 'Team', status: 'Active', lastLogin: '1 hour ago' },
];

const mockLogs: ActivityLog[] = [
  { id: '101', user: 'Alex Johnson', action: 'Converted Annual_Report_2024.pdf', timestamp: '10:42 AM', status: 'Success' },
];

const initialTemplates: Template[] = [
  { id: '1', name: 'Corporate Minimal', type: 'Free', thumbnail: 'bg-slate-200', downloads: 1240 },
  { id: '2', name: 'Creative Pitch', type: 'Pro', thumbnail: 'bg-orange-100', downloads: 850 },
];

const AdminPanel: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [currentView, setCurrentView] = useState('dashboard');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8 text-center border border-slate-100">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-orange-600 mb-4"><Lock size={24} /></div>
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin Login</h1>
          <form onSubmit={(e) => { e.preventDefault(); if(username==='admin' && password==='admin123') setIsAuthenticated(true); }} className="space-y-4">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Username" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Password" />
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl">Sign In</button>
          </form>
          <button onClick={() => window.location.hash = ''} className="mt-4 text-sm text-slate-400">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:block p-6">
        <div className="font-bold text-xl mb-8 flex items-center gap-2"><Settings size={20} /> Admin</div>
        <nav className="space-y-2 mb-8">
           <button onClick={() => setCurrentView('dashboard')} className={`w-full text-left px-4 py-2 rounded-lg ${currentView === 'dashboard' ? 'bg-slate-100 font-bold' : 'text-slate-600'}`}>Dashboard</button>
           <button onClick={() => setCurrentView('users')} className={`w-full text-left px-4 py-2 rounded-lg ${currentView === 'users' ? 'bg-slate-100 font-bold' : 'text-slate-600'}`}>Users</button>
        </nav>
        <button onClick={() => { setIsAuthenticated(false); window.location.hash = ''; }} className="text-red-600 flex items-center gap-2 text-sm"><LogOut size={16} /> Logout</button>
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 capitalize">{currentView}</h1>
        {currentView === 'dashboard' && (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
               <div className="text-slate-500 text-sm">Total Users</div>
               <div className="text-2xl font-bold">2,850</div>
             </div>
             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
               <div className="text-slate-500 text-sm">Revenue</div>
               <div className="text-2xl font-bold">$45,200</div>
             </div>
           </div>
        )}
        {currentView === 'users' && (
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50">
                 <tr><th className="p-4">Name</th><th className="p-4">Plan</th><th className="p-4">Status</th></tr>
               </thead>
               <tbody>
                 {users.map(u => (
                   <tr key={u.id} className="border-t border-slate-100">
                     <td className="p-4 font-medium">{u.name}</td>
                     <td className="p-4">{u.plan}</td>
                     <td className="p-4 text-green-600">{u.status}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </main>
    </div>
  );
};

// ==========================================
// MAIN APP
// ==========================================

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setCurrentPath(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (currentPath === '#admin') return <AdminPanel />;

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      <Header />
      <main className="flex-grow">
        <section className="relative overflow-hidden bg-white pt-20 pb-32">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-700 text-sm font-medium mb-8 border border-orange-100">
              <Sparkles size={16} /> Powered by ProtoolsHUb
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
              Turn PDFs into Presentations <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">in Seconds</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500 mb-12">
              Stop manually copy-pasting. Upload any PDF document, and let our AI summarize, structure, and design a PowerPoint deck for you instantly.
            </p>
            <Converter />
          </div>
        </section>

        <section id="features" className="py-24 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
             <h2 className="text-3xl font-bold text-slate-900 mb-12">Why choose PdfToolsHub?</h2>
             <div className="grid md:grid-cols-3 gap-12 text-left">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                   <Zap className="text-red-600 mb-4" size={32} />
                   <h3 className="text-xl font-bold mb-2">Instant Conversion</h3>
                   <p className="text-slate-600">Turn a 50-page report into a concise deck in under a minute.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                   <Brain className="text-orange-600 mb-4" size={32} />
                   <h3 className="text-xl font-bold mb-2">Smart Summarization</h3>
                   <p className="text-slate-600">Gemini identifies the most critical points automatically.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                   <FileText className="text-yellow-600 mb-4" size={32} />
                   <h3 className="text-xl font-bold mb-2">Speaker Notes Included</h3>
                   <p className="text-slate-600">Get auto-generated scripts for every slide.</p>
                </div>
             </div>
          </div>
        </section>
        
        <section id="pricing" className="py-24 bg-white border-t border-slate-200">
           <div className="max-w-7xl mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-12">Simple Pricing</h2>
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                 <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
                    <h3 className="font-bold text-xl">Starter</h3>
                    <div className="text-4xl font-bold my-4">$0</div>
                    <button className="w-full py-2 border-2 border-slate-900 rounded-lg font-bold">Get Started</button>
                 </div>
                 <div className="bg-slate-900 p-8 rounded-2xl text-white transform scale-105 shadow-xl relative">
                    <div className="absolute top-0 right-0 bg-orange-500 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">POPULAR</div>
                    <h3 className="font-bold text-xl">Pro</h3>
                    <div className="text-4xl font-bold my-4">$19</div>
                    <button className="w-full py-2 bg-orange-600 rounded-lg font-bold">Upgrade Now</button>
                 </div>
                 <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
                    <h3 className="font-bold text-xl">Team</h3>
                    <div className="text-4xl font-bold my-4">$49</div>
                    <button className="w-full py-2 border-2 border-slate-900 rounded-lg font-bold">Contact Sales</button>
                 </div>
              </div>
           </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default App;
