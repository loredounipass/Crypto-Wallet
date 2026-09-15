// Declaración global para evitar requerir @types/node completo cuando no está instalado/detectado por el IDE
declare global {
  const process: {
    env: Record<string, string | undefined>;
    cwd: () => string;
  };
}

export {};
