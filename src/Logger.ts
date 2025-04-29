export class Logger {
  private logLevel: LogLevel;

  constructor(logLevel: LogLevel = LogLevel.Info) {
    this.logLevel = logLevel;
  }

  setVerbosity(level: LogLevel) {
    this.logLevel = level;
  }

  debug(message: string, ...optionalParams: any[]) {
    if (this.logLevel >= LogLevel.Debug) {
      console.debug(message, ...optionalParams);
    }
  }

  warn(message: string, ...optionalParams: any[]) {
    if (this.logLevel >= LogLevel.Warn) {
      console.warn(message, ...optionalParams);
    }
  }

  log(message: string, ...optionalParams: any[]) {
    if (this.logLevel >= LogLevel.Info) {
      console.log(message, ...optionalParams);
    }
  }

  error(message: string, ...optionalParams: any[]) {
    console.error(message, ...optionalParams);
  }
}

export enum LogLevel {
  Error = 0,
  Warn = 1,
  Info = 2,
  Debug = 3,
}
