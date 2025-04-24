import { encryptData, decryptData } from './cryptoUtils';


export const secureSet = (key, value) => {
  const encrypted = encryptData(value);
  localStorage.setItem(key, encrypted);
};

export const secureGet = (key) => {
  const encrypted = localStorage.getItem(key);
  if (!encrypted) return null;
  return decryptData(encrypted);
}; 

export const secureRemove = (key) => {
  localStorage.removeItem(key);
};
