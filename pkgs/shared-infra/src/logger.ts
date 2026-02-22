import pino, { type Logger, type LoggerOptions } from "pino";

export interface LoggerConfig {
  name: string;
  level?: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
}

/**
 * アプリケーション用のpinoロガーを生成する
 *
 * @param cfg ロガー構成（name必須）
 * @returns pinoロガー
 */
export function createAppLogger(cfg: LoggerConfig): Logger {
  const options: LoggerOptions = {
    level: cfg.level ?? process.env.LOG_LEVEL ?? "info",
    base: { name: cfg.name, env: process.env.NODE_ENV ?? "development" },
    messageKey: "msg",
    timestamp: pino.stdTimeFunctions.isoTime,
  };
  return pino(options);
}
