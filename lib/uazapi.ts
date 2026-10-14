/**
 * UazapiClient - Cliente oficial de comunicação e ciclo de vida da UAZAPI
 * Implementado com estratégia Highlander (List-First) e suporte a ligações de voz
 */
export class UazapiClient {
  private baseUrl: string;
  private token: string;

  constructor(token: string, baseUrl?: string) {
    this.baseUrl = (baseUrl || process.env.UAZAPI_URL || 'https://swiftsail.uazapi.com').replace(/\/+$/, '');
    this.token = token;
  }

  // Chamada autenticada com token de instância
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        token: this.token,
        ...options.headers,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`UAZAPI Error (${res.status}): ${errText}`);
    }
    return res.json().catch(() => ({}));
  }

  // --- MÉTODOS ESTÁTICOS DE ADMIN (Usam admintoken) ---

  // 1. Listar todas as instâncias (ATENÇÃO: Usar /instance/all)
  static async listInstances(adminToken: string, baseUrl = 'https://swiftsail.uazapi.com') {
    const cleanUrl = (process.env.UAZAPI_URL || baseUrl).replace(/\/+$/, '');
    const url = `${cleanUrl}/instance/all`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        admintoken: adminToken,
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Falha ao listar instâncias: ${errText}`);
    }
    return res.json();
  }

  // 2. Criar nova instância
  static async createInstance(adminToken: string, name: string, baseUrl = 'https://swiftsail.uazapi.com', systemName = 'swiftsail-voice') {
    const cleanUrl = (process.env.UAZAPI_URL || baseUrl).replace(/\/+$/, '');
    const url = `${cleanUrl}/instance/init`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        admintoken: adminToken,
      },
      body: JSON.stringify({
        name,
        systemName,
        fingerprintProfile: 'chrome',
        browser: 'chrome',
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Falha ao criar instância: ${errText}`);
    }
    return res.json();
  }

  // --- MÉTODOS DE INSTÂNCIA (Usam token individual) ---

  // 3. Conectar instância (Sem telefone = QR Code; Com telefone = Pairing Code)
  async connectInstance(phone?: string) {
    const body = phone ? { phone: phone.replace(/\D/g, '') } : {};
    return this.request('/instance/connect', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // 4. Checar status da conexão
  async getInstanceStatus() {
    return this.request('/instance/status', { method: 'GET' });
  }

  // 5. Desconectar instância (Logout)
  async logoutInstance() {
    return this.request('/instance/disconnect', { method: 'POST' });
  }

  // 6. Iniciar chamada de voz WhatsApp via UAZAPI
  async startVoiceCall(number: string) {
    return this.request('/call/make', {
      method: 'POST',
      body: JSON.stringify({
        number: number.replace(/\D/g, ''),
        call_duration: 0,
      }),
    });
  }

  // 7. Rejeitar/Desligar chamada ativa
  // IMPORTANTE: O único endpoint aceito pelo Baileys/UAZAPI é /call/reject
  async rejectCall(callId?: string) {
    return this.request('/call/reject', {
      method: 'POST',
      body: JSON.stringify(callId ? { callId, id: callId } : {}),
    });
  }
}
