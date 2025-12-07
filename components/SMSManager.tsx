import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Sparkles, RefreshCw, CheckCircle, AlertCircle, Layers, Terminal } from 'lucide-react';
import { SMSMessage, MessageStatus } from '../types';
import * as StorageService from '../services/storage';
import * as GeminiService from '../services/gemini';

interface SMSManagerProps {
  onMessageSent: () => void;
}

const SMSManager: React.FC<SMSManagerProps> = ({ onMessageSent }) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  
  // Single Mode State
  const [recipient, setRecipient] = useState('');
  
  // Bulk Mode State
  const [bulkList, setBulkList] = useState('');
  
  // Shared State
  const [content, setContent] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [consoleLog, setConsoleLog] = useState<string[]>([]);
  
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLog]);

  const loadMessages = () => {
    setMessages(StorageService.getMessages());
  };

  const logToConsole = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setConsoleLog(prev => [...prev, `[${time}] ${msg}`]);
  };

  const handleOptimize = async () => {
    if (!content) return;
    setIsOptimizing(true);
    const optimized = await GeminiService.optimizeSMSContent(content);
    setContent(optimized);
    setIsOptimizing(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    setIsSending(true);
    
    if (mode === 'single') {
        if (!recipient) return;
        await processSingleMessage(recipient, content);
    } else {
        if (!bulkList) return;
        await processBulkMessages(bulkList, content);
    }

    onMessageSent();
    setIsSending(false);
    loadMessages();
  };

  const processSingleMessage = async (to: string, msg: string) => {
    const newMsg: SMSMessage = {
      id: Math.random().toString(36).substr(2, 9),
      recipient: to,
      content: msg,
      status: MessageStatus.QUEUED,
      timestamp: Date.now(),
      aiOptimized: isOptimizing
    };
    
    StorageService.saveMessage(newMsg);
    setRecipient('');
    setContent('');
    
    // Simulation
    await StorageService.simulateDelivery(newMsg.id);
  };

  const processBulkMessages = async (rawList: string, msg: string) => {
    const numbers = rawList.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
    
    if (numbers.length === 0) {
        logToConsole("Error: No valid numbers found.");
        return;
    }

    if (numbers.length > 100) {
        logToConsole("Warning: Batch limited to 100 numbers. Truncating list.");
        numbers.length = 100;
    }

    logToConsole(`Initializing Batch Job: ${numbers.length} recipients.`);
    const batchId = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const messagesToQueue: SMSMessage[] = numbers.map(num => ({
        id: Math.random().toString(36).substr(2, 9),
        recipient: num,
        content: msg,
        status: MessageStatus.QUEUED,
        timestamp: Date.now(),
        batchId: batchId
    }));

    StorageService.saveBulkMessages(messagesToQueue);
    setBulkList('');
    setContent('');

    // Simulate Processing
    logToConsole(`Batch ${batchId} queued successfully.`);
    
    for (let i = 0; i < messagesToQueue.length; i++) {
        // Simulate throttle
        await new Promise(r => setTimeout(r, 200)); 
        logToConsole(`Dispatching to ${messagesToQueue[i].recipient} [${i+1}/${numbers.length}]... OK`);
        // Trigger generic delivery sim in background
        StorageService.simulateDelivery(messagesToQueue[i].id).then(() => {
             // In a real app we would update specific message status here via callback
        });
    }
    
    logToConsole(`Batch ${batchId} processing complete.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Compose Section */}
      <div className="glass-panel p-6 rounded-xl flex flex-col h-fit animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-blue-200">
            <MessageSquare className="w-5 h-5" /> Gateway Dispatch
            </h2>
            <div className="bg-slate-900 rounded-lg p-1 flex">
                <button 
                    onClick={() => setMode('single')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'single' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    Single
                </button>
                <button 
                    onClick={() => setMode('bulk')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'bulk' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    Bulk (Max 100)
                </button>
            </div>
        </div>
        
        <form onSubmit={handleSend} className="space-y-4">
          {mode === 'single' ? (
            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Recipient Number</label>
                <input
                type="tel"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
            </div>
          ) : (
            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Recipient List (CSV or Newline)</label>
                <textarea
                    value={bulkList}
                    onChange={(e) => setBulkList(e.target.value)}
                    placeholder="+15550001111&#10;+15550002222&#10;+15550003333"
                    className="w-full h-24 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono text-sm"
                />
                <div className="text-right text-xs text-slate-500 mt-1">
                    {bulkList.split(/[\n,]+/).filter(s => s.trim().length > 0).length} / 100 Recipients
                </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Message Content</label>
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your secure message here..."
                className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none"
              />
              <button
                type="button"
                onClick={handleOptimize}
                disabled={isOptimizing || !content}
                className="absolute bottom-3 right-3 p-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg transition-colors flex items-center gap-2 text-xs border border-indigo-500/30"
              >
                {isOptimizing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Optimize
              </button>
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>{content.length} chars</span>
              <span>{Math.ceil(content.length / 160)} segment(s)</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSending || (!recipient && !bulkList) || !content}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Send Message
              </>
            )}
          </button>
        </form>

        {mode === 'bulk' && consoleLog.length > 0 && (
            <div className="mt-6 bg-black rounded-lg p-4 font-mono text-xs text-green-400 h-32 overflow-y-auto border border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 mb-2 pb-2 border-b border-slate-800">
                    <Terminal className="w-3 h-3" /> System Console
                </div>
                {consoleLog.map((log, idx) => (
                    <div key={idx} className="mb-1">{log}</div>
                ))}
                <div ref={consoleEndRef} />
            </div>
        )}
      </div>

      {/* Log Section */}
      <div className="glass-panel p-6 rounded-xl flex flex-col h-[600px] overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-blue-200">Transmission Log</h2>
          <button onClick={loadMessages} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 py-10">No messages transmitted yet.</div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="bg-slate-900/40 border border-slate-800 p-4 rounded-lg hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                    <span className="font-mono text-sm text-blue-300">{msg.recipient}</span>
                    {msg.batchId && <span className="text-[10px] text-slate-500 bg-slate-800 px-1 rounded w-fit mt-1">BATCH: {msg.batchId}</span>}
                </div>
                <StatusBadge status={msg.status} />
              </div>
              <p className="text-sm text-slate-300 mb-2 break-words">{msg.content}</p>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>ID: {msg.id.substring(0,6)}...</span>
                <span>{new Date(msg.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: MessageStatus }> = ({ status }) => {
  switch (status) {
    case MessageStatus.SENT:
    case MessageStatus.DELIVERED:
      return <span className="flex items-center gap-1 text-xs text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-900/50"><CheckCircle className="w-3 h-3" /> {status}</span>;
    case MessageStatus.FAILED:
      return <span className="flex items-center gap-1 text-xs text-red-400 bg-red-900/20 px-2 py-0.5 rounded border border-red-900/50"><AlertCircle className="w-3 h-3" /> {status}</span>;
    default:
      return <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-900/20 px-2 py-0.5 rounded border border-yellow-900/50"><RefreshCw className="w-3 h-3 animate-spin" /> {status}</span>;
  }
};

export default SMSManager;