import { SMSMessage, SecureLink, VaultItem, MessageStatus } from '../types';

const STORAGE_KEYS = {
  SMS: 'smsgatepush_sms_v2',
  LINKS: 'smsgatepush_links_v2',
  VAULT: 'smsgatepush_vault_v1'
};

// SMS Methods
export const getMessages = (): SMSMessage[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SMS);
  return data ? JSON.parse(data) : [];
};

export const saveMessage = (msg: SMSMessage): void => {
  const current = getMessages();
  const updated = [msg, ...current];
  localStorage.setItem(STORAGE_KEYS.SMS, JSON.stringify(updated));
};

export const saveBulkMessages = (msgs: SMSMessage[]): void => {
  const current = getMessages();
  const updated = [...msgs, ...current];
  localStorage.setItem(STORAGE_KEYS.SMS, JSON.stringify(updated));
};

// Secure Link Methods
export const getSecureLinks = (): SecureLink[] => {
  const data = localStorage.getItem(STORAGE_KEYS.LINKS);
  return data ? JSON.parse(data) : [];
};

export const saveSecureLink = (link: SecureLink): void => {
  const current = getSecureLinks();
  const updated = [link, ...current];
  localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(updated));
};

export const updateSecureLink = (id: string, updates: Partial<SecureLink>): SecureLink | null => {
  const links = getSecureLinks();
  const index = links.findIndex(l => l.id === id);
  if (index === -1) return null;

  const updatedLink = { ...links[index], ...updates };
  links[index] = updatedLink;
  localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
  return updatedLink;
};

export const getSecureLinkById = (id: string): SecureLink | null => {
  const links = getSecureLinks();
  return links.find(l => l.id === id) || null;
};

// Vault Methods
export const getVaultItems = (): VaultItem[] => {
  const data = localStorage.getItem(STORAGE_KEYS.VAULT);
  return data ? JSON.parse(data) : [];
};

export const saveVaultItem = (item: VaultItem): void => {
  const current = getVaultItems();
  const updated = [item, ...current];
  localStorage.setItem(STORAGE_KEYS.VAULT, JSON.stringify(updated));
};

export const deleteVaultItem = (id: string): void => {
  const current = getVaultItems();
  const updated = current.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.VAULT, JSON.stringify(updated));
};

// Simulate network delay and delivery
export const simulateDelivery = (id: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const messages = getMessages();
      const idx = messages.findIndex(m => m.id === id);
      if (idx !== -1) {
        messages[idx].status = MessageStatus.DELIVERED;
        localStorage.setItem(STORAGE_KEYS.SMS, JSON.stringify(messages));
      }
      resolve();
    }, Math.random() * 2000 + 1000); // Random 1-3s delay
  });
};