/**
 * Cliente de infraestructura para el Microservicio backend-simulator.
 * Permite a TelarMonitor comunicarse mediante HTTP REST con el simulador
 * telemétrico (localmente o desplegado en Railway/Render/Docker).
 */

export interface SimulatorHealth {
  status: string;
  uptimeSeconds: number;
  memoryUsageMb: number;
  simulation: {
    isSimulating: boolean;
    intervalMs: number;
    activeHouseholdsCount: number;
    connectedClients: number;
  };
}

export interface SeedResult {
  success: boolean;
  message?: string;
  household?: string;
  hasSolar?: boolean;
  capacityKwp?: number;
  totalRecordsInserted?: number;
  error?: string;
}

export interface CleanResult {
  success: boolean;
  message?: string;
  error?: string;
}

export class SimulatorApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (
      baseUrl ||
      process.env.NEXT_PUBLIC_SIMULATOR_URL ||
      process.env.SIMULATOR_URL ||
      'http://localhost:4000'
    ).replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Comprueba si el microservicio está en línea y saludable.
   * Timeout de 2.5 segundos para no bloquear la interfaz.
   */
  async checkHealth(): Promise<{ online: boolean; data?: SimulatorHealth; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return { online: false, error: `HTTP ${res.status}: ${res.statusText}` };
      }

      const data = await res.json();
      return { online: true, data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo conectar con el microservicio';
      return { online: false, error: msg };
    }
  }

  /**
   * Ordena al microservicio sembrar lecturas históricas para un hogar.
   */
  async seedHistorical(options: {
    days: number;
    cleanBefore?: boolean;
    householdId?: string;
  }): Promise<SeedResult> {
    try {
      const res = await fetch(`${this.baseUrl}/api/simulation/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || `HTTP ${res.status}` };
      }

      return json;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con backend-simulator';
      return { success: false, error: msg };
    }
  }

  /**
   * Ordena al microservicio limpiar lecturas de telemetría.
   */
  async cleanReadings(householdId?: string): Promise<CleanResult> {
    try {
      const res = await fetch(`${this.baseUrl}/api/simulation/clean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(householdId ? { householdId } : {}),
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || `HTTP ${res.status}` };
      }

      return json;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con backend-simulator';
      return { success: false, error: msg };
    }
  }

  /**
   * Inicia la simulación telemétrica continua en vivo.
   */
  async startRealtime(intervalMs?: number): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/simulation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intervalMs ? { intervalMs } : {}),
      });
      return await res.json();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar simulación';
      return { success: false, message: msg };
    }
  }

  /**
   * Pausa la simulación telemétrica continua.
   */
  async stopRealtime(): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/simulation/stop`, {
        method: 'POST',
      });
      return await res.json();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al pausar simulación';
      return { success: false, message: msg };
    }
  }
}
