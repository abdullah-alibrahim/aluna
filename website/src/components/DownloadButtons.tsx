import { motion } from 'motion/react'
import { APP_STORE_URL, PLAY_STORE_URL } from '../config'

function AppleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.2 3.02-.9.95-2.2 1.66-3.4 1.56-.13-1.1.4-2.25 1.2-3.1.9-.95 2.35-1.65 3.4-1.48zM20.9 17.5c-.55 1.25-.82 1.8-1.53 2.9-.99 1.52-2.38 3.4-4.1 3.42-1.54.02-1.93-.98-4.02-.97-2.1.01-2.53.99-4.06.97-1.72-.02-3.04-1.72-4.03-3.24C1.4 17.5.2 13.3 1.9 10.4c1.1-1.85 2.84-3 4.55-3 1.78-.03 2.9 1.15 4.38 1.15 1.46 0 2.35-1.16 4.4-1.13 1.84.03 3.23 1 4.2 2.45-3.7 2-3.1 7.15.47 8.63z" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.6 2.7c-.3.2-.5.5-.5.9v16.8c0 .4.2.7.5.9l9.6-9.3L3.6 2.7zm11.2 6.5 2.4 1.4 3.5-2-5.9.6zm2.4 4.2-2.4 1.4 5.9.6-3.5-2zm-3.4.1L4.4 21.4c.2 0 .4-.1.6-.2l10.3-5.9-1.5-1.8zM5 2.8l10.8 6.1 1.5-1.8L5.6 2.6C5.4 2.5 5.2 2.6 5 2.8z" />
    </svg>
  )
}

type StoreButtonProps = {
  store: 'apple' | 'google'
  variant?: 'dark' | 'light' | 'gold'
}

export function StoreButton({ store, variant = 'dark' }: StoreButtonProps) {
  const isApple = store === 'apple'
  const href = isApple ? APP_STORE_URL : PLAY_STORE_URL
  const label = isApple ? 'App Store' : 'Google Play'
  const sub = isApple ? 'حمّلي من' : 'احصلي عليه من'

  const styles =
    variant === 'gold'
      ? 'bg-gold text-cream hover:bg-gold-soft shadow-[0_16px_40px_-12px_rgba(181,148,81,0.55)]'
      : variant === 'light'
        ? 'bg-cream text-ink border border-gold/25 hover:border-gold/50'
        : 'bg-ink text-cream hover:bg-ink-soft'

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className={`inline-flex min-w-[190px] items-center gap-3 rounded-2xl px-5 py-3.5 transition-colors ${styles}`}
    >
      <span className="shrink-0 opacity-95">{isApple ? <AppleIcon /> : <PlayIcon />}</span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[11px] font-medium opacity-75">{sub}</span>
        <span className="text-[17px] font-semibold tracking-wide">{label}</span>
      </span>
    </motion.a>
  )
}

export function DownloadGroup({
  variant = 'dark',
  className = '',
}: {
  variant?: 'dark' | 'light' | 'gold'
  className?: string
}) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 sm:justify-start ${className}`}>
      <StoreButton store="apple" variant={variant} />
      <StoreButton store="google" variant={variant} />
    </div>
  )
}
