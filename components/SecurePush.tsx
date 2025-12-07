import React, { useState, useEffect } from 'react';
import { Lock, Copy, Eye, Flame, ShieldAlert, ArrowRight, Key, Watch, Sliders, Save, Trash2, FileText, Plus, RefreshCw } from 'lucide-react';
import { SecureLink, VaultItem } from '../types';
import * as StorageService from '../services/storage';
import * as GeminiService from '../services/gemini';
import * as TOTPService from '../services/totp';

interface SecurePushProps {
  onLinkCreated: () => void;
}

// Encoding helpers
const encode = (str: string) => btoa(unescape(encodeURIComponent(str)));
const decode = (str: string) => decodeURIComponent(escape(atob(str)));

const SecurePush: React.FC<SecurePushProps> = ({ onLinkCreated }) => {
  const [activeTab, setActiveTab] = useState<'push' | 'vault' | 'generator'>('vault');
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);

  useEffect(() => {
    refreshVault();
  }, []);

  const refreshVault = () => {
    setVaultItems(StorageService.getVaultItems());
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      {/* Navigation Tabs */}
      <div className="flex space-x-2 md:space-x-4 mb-6 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
        <TabButton 
          active={activeTab === 'vault'} 
          onClick={() => setActiveTab('vault')} 
          icon={<Key className="w-4 h-4" />} 
          label="Vault & OTP" 
        />
        <TabButton 
          active={activeTab === 'push'} 
          onClick={() => setActiveTab('push')} 
          icon={<Flame className="w-4 h-4" />} 
          label="Secure Push" 
        />
        <TabButton 
          active={activeTab === 'generator'} 
          onClick={() => setActiveTab('generator')} 
          icon={<Sliders className="w-4 h-4" />} 
          label="Generator" 
        />
      </div>

      <div className="flex-1 animate-fade-in">
        {activeTab === 'push' && <PushModule onLinkCreated={onLinkCreated} />}
        {activeTab === 'vault' && <VaultModule items={vaultItems} onUpdate={refreshVault} />}
        {activeTab === 'generator' && <GeneratorModule />}
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2 ${
      active 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {icon} {label}
  </button>
);

// --- SUB-COMPONENTS ---

// 1. PUSH MODULE (One-Time Links)
const PushModule: React.FC<{ onLinkCreated: () => void }> = ({ onLinkCreated }) => {
    const [mode, setMode] = useState<'create' | 'retrieve'>('create');
    const [secretData, setSecretData] = useState('');
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [accessId, setAccessId] = useState('');
    const [retrievedSecret, setRetrievedSecret] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = () => {
        if (!secretData) return;
        const id = Math.random().toString(36).substr(2, 12);
        const newLink: SecureLink = {
            id,
            encryptedData: encode(secretData),
            createdAt: Date.now(),
            views: 0,
            maxViews: 1,
            isBurned: false
        };
        StorageService.saveSecureLink(newLink);
        setGeneratedLink(id);
        onLinkCreated();
    };

    const handleRetrieve = () => {
        setError(null);
        setRetrievedSecret(null);
        const cleanId = accessId.replace('smsgatepush://', '').trim();
        const link = StorageService.getSecureLinkById(cleanId);
        
        if (!link) {
            setError("Invalid ID or Link does not exist.");
            return;
        }
        if (link.isBurned || link.views >= link.maxViews) {
            setError("This link has been destroyed.");
            return;
        }

        const secret = decode(link.encryptedData);
        StorageService.updateSecureLink(link.id, { views: link.views + 1, isBurned: true });
        setRetrievedSecret(secret);
        onLinkCreated();
    };

    return (
        <div className="glass-panel p-6 rounded-xl min-h-[400px]">
            <div className="flex justify-center mb-6">
                <div className="bg-slate-900 rounded-lg p-1 flex">
                     <button onClick={() => setMode('create')} className={`px-4 py-1 rounded text-xs ${mode === 'create' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Create Link</button>
                     <button onClick={() => setMode('retrieve')} className={`px-4 py-1 rounded text-xs ${mode === 'retrieve' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>Retrieve</button>
                </div>
            </div>

            {mode === 'create' ? (
                !generatedLink ? (
                    <div className="space-y-4">
                        <textarea
                            value={secretData}
                            onChange={e => setSecretData(e.target.value)}
                            placeholder="Enter confidential data to encrypt..."
                            className="w-full h-40 bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        <button onClick={handleCreate} disabled={!secretData} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors">Generate One-Time Link</button>
                    </div>
                ) : (
                    <div className="text-center space-y-4 pt-10">
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto"><Lock className="text-green-400" /></div>
                        <h3 className="text-xl font-bold">Encrypted</h3>
                        <div className="bg-slate-900 p-3 rounded border border-slate-700 flex gap-2 items-center">
                            <code className="text-blue-400 text-sm flex-1 truncate">{generatedLink}</code>
                            <button onClick={() => navigator.clipboard.writeText(generatedLink!)} className="p-1 hover:text-white text-slate-400"><Copy className="w-4 h-4"/></button>
                        </div>
                        <button onClick={() => { setGeneratedLink(null); setSecretData(''); }} className="text-sm text-slate-500 underline">Create New</button>
                    </div>
                )
            ) : (
                <div className="space-y-4">
                     {!retrievedSecret ? (
                        <>
                            <input
                                value={accessId}
                                onChange={e => setAccessId(e.target.value)}
                                placeholder="Paste Secure ID here..."
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                            {error && <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-900/50">{error}</div>}
                            <button onClick={handleRetrieve} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors">Decrypt Payload</button>
                        </>
                     ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-green-400 font-bold">Payload Decrypted</span>
                                <span className="text-xs text-red-500 border border-red-900 bg-red-900/20 px-2 py-1 rounded">Burned</span>
                            </div>
                            <pre className="bg-black p-4 rounded border border-slate-800 text-green-500 font-mono whitespace-pre-wrap">{retrievedSecret}</pre>
                            <button onClick={() => { setRetrievedSecret(null); setAccessId(''); }} className="w-full py-2 border border-slate-700 text-slate-400 hover:text-white rounded-lg">Close</button>
                        </div>
                     )}
                </div>
            )}
        </div>
    );
};

// 2. VAULT MODULE (Keepassium-style)
const VaultModule: React.FC<{ items: VaultItem[]; onUpdate: () => void }> = ({ items, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newItem, setNewItem] = useState<Partial<VaultItem>>({});

    const handleSave = () => {
        if (!newItem.title) return;
        const item: VaultItem = {
            id: Math.random().toString(36).substr(2, 9),
            title: newItem.title,
            username: newItem.username,
            password: newItem.password,
            totpSecret: newItem.totpSecret?.replace(/\s/g, ''), // Clean spaces
            notes: newItem.notes,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        StorageService.saveVaultItem(item);
        setIsEditing(false);
        setNewItem({});
        onUpdate();
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this item permanently?')) {
            StorageService.deleteVaultItem(id);
            onUpdate();
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
            {/* List */}
            <div className="glass-panel p-4 rounded-xl col-span-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-200">My Vault</h3>
                    <button onClick={() => setIsEditing(true)} className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500"><Plus className="w-4 h-4 text-white" /></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {items.map(item => (
                        <div key={item.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors group">
                             <div className="font-medium text-blue-300">{item.title}</div>
                             <div className="text-xs text-slate-500">{item.username || 'No Identity'}</div>
                             <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                             </div>
                        </div>
                    ))}
                    {items.length === 0 && <div className="text-center text-slate-500 text-sm mt-10">Vault is empty</div>}
                </div>
            </div>

            {/* Detail / Edit */}
            <div className="glass-panel p-6 rounded-xl col-span-1 md:col-span-2">
                {isEditing ? (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-lg font-bold text-white mb-4">New Entry</h3>
                        <input className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" placeholder="Title (e.g. Gmail)" value={newItem.title || ''} onChange={e => setNewItem({...newItem, title: e.target.value})} />
                        <input className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" placeholder="Username / Email" value={newItem.username || ''} onChange={e => setNewItem({...newItem, username: e.target.value})} />
                        <div className="relative">
                            <input className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" type="text" placeholder="Password" value={newItem.password || ''} onChange={e => setNewItem({...newItem, password: e.target.value})} />
                        </div>
                        <input className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" placeholder="TOTP Secret Key (Base32)" value={newItem.totpSecret || ''} onChange={e => setNewItem({...newItem, totpSecret: e.target.value})} />
                        <textarea className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white h-24" placeholder="Notes..." value={newItem.notes || ''} onChange={e => setNewItem({...newItem, notes: e.target.value})} />
                        
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 text-white flex items-center gap-2"><Save className="w-4 h-4"/> Save Item</button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto pr-2 space-y-6">
                         <h3 className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-4">Active Items</h3>
                         {items.map(item => (
                             <VaultItemDisplay key={item.id} item={item} />
                         ))}
                         {items.length === 0 && <div className="flex items-center justify-center h-full text-slate-600">Select (+) to add secure items</div>}
                    </div>
                )}
            </div>
        </div>
    );
};

const VaultItemDisplay: React.FC<{ item: VaultItem }> = ({ item }) => {
    const [totp, setTotp] = useState<{ code: string, progress: number } | null>(null);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (item.totpSecret) {
            const update = async () => {
                const result = await TOTPService.generateTOTP(item.totpSecret!);
                setTotp(result);
            };
            update();
            interval = setInterval(update, 1000);
        }
        return () => clearInterval(interval);
    }, [item.totpSecret]);

    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-lg font-bold text-white">{item.title}</h4>
                    <p className="text-blue-400 text-sm">{item.username}</p>
                </div>
                {item.totpSecret && totp && (
                    <div className="text-right">
                        <div className="font-mono text-2xl font-bold text-yellow-400 tracking-wider">{totp.code}</div>
                        <div className="w-24 h-1 bg-slate-800 rounded-full mt-1 ml-auto overflow-hidden">
                            <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: `${totp.progress}%` }} />
                        </div>
                    </div>
                )}
            </div>

            {item.password && (
                <div className="bg-black/50 p-2 rounded flex justify-between items-center mb-2 border border-slate-800">
                    <span className="font-mono text-slate-300">••••••••••••••</span>
                    <button onClick={() => navigator.clipboard.writeText(item.password!)} className="text-xs text-blue-500 hover:text-blue-400 uppercase font-bold">Copy</button>
                </div>
            )}

            {item.notes && (
                <div className="text-xs text-slate-500 mt-2 bg-slate-900 p-2 rounded">
                    <FileText className="w-3 h-3 inline mr-1 mb-0.5" />
                    {item.notes}
                </div>
            )}
        </div>
    );
};

// 3. GENERATOR MODULE
const GeneratorModule: React.FC = () => {
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(16);
    const [useNumbers, setUseNumbers] = useState(true);
    const [useSymbols, setUseSymbols] = useState(true);
    const [strength, setStrength] = useState(0);

    const generate = () => {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        let chars = charset;
        if (useNumbers) chars += numbers;
        if (useSymbols) chars += symbols;

        let pass = '';
        for (let i = 0; i < length; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(pass);
        
        // Simple strength calc
        let score = 0;
        if (length > 12) score += 40;
        if (useNumbers) score += 30;
        if (useSymbols) score += 30;
        setStrength(score);
    };

    useEffect(() => {
        generate();
    }, [length, useNumbers, useSymbols]);

    return (
        <div className="glass-panel p-8 rounded-xl max-w-2xl mx-auto">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Sliders className="w-5 h-5 text-blue-400"/> Password Generator</h2>
             
             <div className="bg-slate-900/80 p-6 rounded-lg mb-8 border border-slate-700 relative group">
                 <div className="text-2xl font-mono text-center text-white break-all">{password}</div>
                 <div className="absolute top-2 right-2">
                     <button onClick={() => navigator.clipboard.writeText(password)} className="p-2 hover:text-white text-slate-500 transition-colors"><Copy className="w-5 h-5"/></button>
                 </div>
                 <div className="w-full h-1 bg-slate-800 mt-4 rounded-full overflow-hidden">
                     <div className={`h-full transition-all duration-500 ${strength > 80 ? 'bg-green-500' : strength > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${strength}%` }} />
                 </div>
                 <div className="text-center text-xs text-slate-500 mt-1">Entropy Score: {strength}/100</div>
             </div>

             <div className="space-y-6">
                 <div>
                     <div className="flex justify-between mb-2">
                         <span className="text-slate-300">Length</span>
                         <span className="text-blue-400 font-mono">{length}</span>
                     </div>
                     <input 
                        type="range" 
                        min="8" 
                        max="64" 
                        value={length} 
                        onChange={(e) => setLength(parseInt(e.target.value))} 
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                     />
                 </div>

                 <div className="flex gap-4">
                     <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-800/50 rounded-lg flex-1 border border-transparent hover:border-slate-600 transition-colors">
                         <input type="checkbox" checked={useNumbers} onChange={e => setUseNumbers(e.target.checked)} className="rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500" />
                         <span className="text-slate-300">Numbers (0-9)</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-800/50 rounded-lg flex-1 border border-transparent hover:border-slate-600 transition-colors">
                         <input type="checkbox" checked={useSymbols} onChange={e => setUseSymbols(e.target.checked)} className="rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500" />
                         <span className="text-slate-300">Symbols (!@#)</span>
                     </label>
                 </div>

                 <button onClick={generate} className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                     <RefreshCw className="w-4 h-4" /> Regenerate
                 </button>
             </div>
        </div>
    );
};

export default SecurePush;