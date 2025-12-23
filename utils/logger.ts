import { createLogger, format, transports } from 'winston';

const { combine, label, timestamp } = format;

export const setupLogger = (opts: {label: string}) => {
    const level = process.env.LOG_LEVEL || 'info';
    const isProduction = process.env.NODE_ENV === 'production';

    const formBackendFormat = format.printf((fOpts) => {
        return `${fOpts.timestamp} [${fOpts.label}] ${fOpts.level.toLocaleUpperCase()}: ${fOpts.message}`;
    });

    const formatOpts = combine(
        timestamp(),
        label({ label: opts.label }),
        formBackendFormat
    );

    return createLogger({
        level,
        format: formatOpts,
        transports: [new transports.Console({forceConsole: !isProduction})]
    });
};
