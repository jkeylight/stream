export interface PayloadArmor {
  category: 'clean_media' | 'clean_archive' | 'malicious_executable' | 'unknown_document' | 'gated_page';
  isSafe: boolean;
  threatScore: string;
  threatReason: string;
  recommendedAction: string;
}

export interface ProbeResult {
  url: string;
  finalUrl: string;
  status: number;
  statusText: string;
  methodUsed?: string;
  headers: Record<string, string>;
  filename: string;
  fileSize: number;
  formattedSize: string;
  payloadArmor: PayloadArmor;
  diagnosis: string;
  redirectCount: number;
  timestamp?: string;
}

export interface ScriptFile {
  name: string;
  title: string;
  description: string;
  content: string;
  size: number;
  lines: number;
}

export interface GeneratedCommands {
  curl: string;
  wget: string;
  ytdlp: string;
  aria2c: string;
  powershell: string;
  ublock: string;
  devtools: string;
  filename: string;
  domain: string;
}

export interface HashCheckResult {
  sha256: string;
  md5: string;
  bytesSampled?: number;
  virustotalUrl: string;
}

export interface BatchItem {
  id: string;
  url: string;
  status?: number;
  filename?: string;
  formattedSize?: string;
  category?: string;
  isSafe?: boolean;
  loading: boolean;
  error?: string;
}
