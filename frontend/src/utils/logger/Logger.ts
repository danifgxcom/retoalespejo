/**
 * Production-safe logging utility
 * Provides debug logging that can be disabled in production builds
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.log(`🐛 [DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.log(`ℹ️ [INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`❌ [ERROR] ${message}`, ...args);
    }
  }

  // Game-specific debug methods
  piece(message: string, piece?: any): void {
    this.debug(`🧩 ${message}`, piece);
  }

  geometry(message: string, ...args: any[]): void {
    this.debug(`📐 ${message}`, ...args);
  }

  canvas(message: string, ...args: any[]): void {
    this.debug(`🖼️ ${message}`, ...args);
  }

  challenge(message: string, ...args: any[]): void {
    this.debug(`🎯 ${message}`, ...args);
  }

  validation(message: string, ...args: any[]): void {
    this.debug(`🔍 ${message}`, ...args);
  }

  control(message: string, ...args: any[]): void {
    this.debug(`🎮 ${message}`, ...args);
  }

  mirror(message: string, ...args: any[]): void {
    this.debug(`🪞 ${message}`, ...args);
  }

  snapshot(message: string, ...args: any[]): void {
    this.debug(`📸 ${message}`, ...args);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const log = {
  debug: (message: string, ...args: any[]) => logger.debug(message, ...args),
  info: (message: string, ...args: any[]) => logger.info(message, ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, ...args),
  error: (message: string, ...args: any[]) => logger.error(message, ...args),
  piece: (message: string, piece?: any) => logger.piece(message, piece),
  geometry: (message: string, ...args: any[]) => logger.geometry(message, ...args),
  canvas: (message: string, ...args: any[]) => logger.canvas(message, ...args),
  challenge: (message: string, ...args: any[]) => logger.challenge(message, ...args),
  validation: (message: string, ...args: any[]) => logger.validation(message, ...args),
  control: (message: string, ...args: any[]) => logger.control(message, ...args),
  mirror: (message: string, ...args: any[]) => logger.mirror(message, ...args),
  snapshot: (message: string, ...args: any[]) => logger.snapshot(message, ...args)
};