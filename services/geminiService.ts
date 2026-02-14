
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION_ADVISOR, SYSTEM_INSTRUCTION_TRAINER, SYSTEM_INSTRUCTION_WEEKLY_TIP, SYSTEM_INSTRUCTION_INTELLIGENCE_HUB } from "../constants";
import { ChatMessage, StoredReport, KnowledgeDocument } from "../types";

export const generateAdvisorResponseStream = async (
  history: ChatMessage[], 
  currentMessage: string,
  knowledgeBase: KnowledgeDocument[] = [],
  onChunk: (chunk: string) => void
): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const currentTime = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' });
  
  try {
    const kbContext = knowledgeBase.length > 0 
      ? `KNOWLEDGE ASSETS:\n${knowledgeBase.map(doc => `[${doc.title}]: ${doc.content.substring(0, 1000)}`).join('\n')}`
      : "";

    const conversationContext = history.slice(-10).map(h => `${h.role === 'user' ? 'CEO' : 'AIU'}: ${h.text}`).join('\n');
    
    const fullPrompt = `TIME: ${currentTime}\n${kbContext}\n\nHISTORY:\n${conversationContext}\n\nQUERY: ${currentMessage}`;

    const result = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview', 
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_ADVISOR,
        temperature: 0.7,
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    for await (const chunk of result) {
      if (chunk.text) onChunk(chunk.text);
    }
  } catch (error) {
    console.error("Streaming Error:", error);
    throw error;
  }
};

export const fetchBestPractices = async (topic: string): Promise<{ text: string; sources?: any[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `SEARCH AND ANALYZE: Provide 10 specific intelligence updates regarding: ${topic}. Focus on Nigerian private security regulation (NSCDC), licensing, and global best practices (ISO 18788/ASIS).`,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION_INTELLIGENCE_HUB,
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 1024 }
      },
    });

    const metadata = response.candidates?.[0]?.groundingMetadata;
    const sourcesMap = new Map();
    
    metadata?.groundingChunks?.forEach((chunk: any) => {
      if (chunk.web && chunk.web.uri) {
        sourcesMap.set(chunk.web.uri, { title: chunk.web.title || 'Source Reference', url: chunk.web.uri });
      }
    });

    return { 
      text: response.text || "Intelligence retrieval returned no usable data.", 
      sources: Array.from(sourcesMap.values())
    };
  } catch (error) {
    console.error("Intelligence Hub Error:", error);
    throw error;
  }
};

export const analyzeReport = async (reportText: string, previousReports: StoredReport[] = []): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Audit this log using ISO 18788 and Nigerian security standards. Identify critical risks and CEO action items:\n\n${reportText}`,
    config: { 
      systemInstruction: "You are a Senior Compliance Auditor. Be clinical, authoritative, and focused on operational liability.", 
      temperature: 0.1 
    }
  });
  return response.text || "Audit failed.";
};

export const generateWeeklyTip = async (): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Generate a strategic security tip for the CEO focusing on operational excellence and guard turnout in Nigeria.",
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION_WEEKLY_TIP,
      temperature: 0.7 
    }
  });
  return response.text || "Generation failed.";
};

export const generateTrainingModuleStream = async (role: string, topic: string, week: string, onChunk: (chunk: string) => void): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const result = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: `Translate standard procedures into a training module for Role: ${role} on Topic: ${topic}. 
    This is for ${week} of the training cycle. Tailor the depth and complexity for this stage. Focus on Nigerian site contexts.`,
    config: { systemInstruction: SYSTEM_INSTRUCTION_TRAINER, temperature: 0.5 }
  });
  for await (const chunk of result) {
    if (chunk.text) onChunk(chunk.text);
  }
};

export const generateOperationalInsights = async (reports: StoredReport[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const reportData = reports.map(r => r.content).join('\n---\n');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze these field logs for recurring failures, discipline issues, or emerging site-specific threats:\n\n${reportData}`,
    config: { 
      systemInstruction: "You are a Strategic Risk Analyst. Detect patterns for executive oversight.",
      temperature: 0.3 
    }
  });
  return response.text || "Pattern detection failed.";
};
