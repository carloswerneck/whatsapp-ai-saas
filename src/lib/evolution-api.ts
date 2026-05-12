const EVO_BASE = process.env.EVOLUTION_API_URL!;
const EVO_KEY = process.env.EVOLUTION_API_KEY!;

async function evoFetch(path: string, options?: RequestInit) {
  return fetch(`${EVO_BASE}${path}`, {
    ...options,
    headers: {
      apikey: EVO_KEY,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}

export const EvolutionAPI = {
  async createInstance(instanceName: string) {
    return evoFetch("/instance/create", {
      method: "POST",
      body: JSON.stringify({
        instanceName,
        webhook: {
          enabled: true,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook/${instanceName}`,
        },
      }),
    });
  },

  async connect(instanceName: string) {
    return evoFetch(`/instance/connect/${instanceName}`, {
      method: "POST",
    });
  },

  async getQR(instanceName: string) {
    const res = await evoFetch(`/instance/connect/${instanceName}`);
    return res.json();
  },

  async getStatus(instanceName: string) {
    const res = await evoFetch(
      `/instance/connectionState/${instanceName}`
    );
    return res.json();
  },

  async sendMessage(instanceName: string, number: string, text: string) {
    return evoFetch(`/message/sendText/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({ number, text }),
    });
  },

  async logout(instanceName: string) {
    return evoFetch(`/instance/logout/${instanceName}`, {
      method: "DELETE",
    });
  },

  async deleteInstance(instanceName: string) {
    return evoFetch(`/instance/delete/${instanceName}`, {
      method: "DELETE",
    });
  },
};