import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { DownloadGroup } from './DownloadButtons'

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const glowY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const logoScale = useTransform(scrollYProgress, [0, 1], [1, 0.92])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0.35])

  return (
    <section
      ref={ref}
      className="relative flex min-h-dvh flex-col overflow-hidden"
      aria-label="مقدمة ألونا"
    >
      {/* Atmospheric plane */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(201,173,110,0.28),transparent_55%),radial-gradient(ellipse_at_80%_70%,rgba(181,148,81,0.18),transparent_50%),linear-gradient(165deg,#FBF6EC_0%,#F9F5EB_45%,#EFE4CF_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E")`,
            mixBlendMode: 'multiply',
          }}
        />
        <motion.div
          style={{ y: glowY }}
          className="absolute left-1/2 top-[18%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(181,148,81,0.35)_0%,transparent_70%)] blur-2xl"
          animate={{ opacity: [0.45, 0.75, 0.45], scale: [0.95, 1.08, 0.95] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <header className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-10 lg:px-16">
        <motion.a
          href="#top"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-2xl font-semibold tracking-[0.04em] text-ink"
        >
          Aluna
        </motion.a>
        <motion.a
          href="#download"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-full border border-gold/30 bg-cream/60 px-4 py-2 text-sm font-medium text-ink-soft backdrop-blur-sm transition hover:border-gold/60 hover:text-ink"
        >
          حمّلي التطبيق
        </motion.a>
      </header>

      <motion.div
        style={{ opacity: contentOpacity }}
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-16 pt-4 text-center sm:px-10"
      >
        <motion.div style={{ scale: logoScale }} className="mb-2">
          <motion.img
            src="/logo.png?v=2"
            alt="ألونا"
            className="mx-auto h-auto max-h-[min(38vh,260px)] w-auto object-contain drop-shadow-[0_24px_60px_rgba(181,148,81,0.25)]"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 110, damping: 16, delay: 0.15 }}
          />
        </motion.div>

        <motion.div
          className="mb-5 flex items-center gap-3"
          initial={{ opacity: 0, scaleX: 0.4 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="h-px w-12 bg-gradient-to-l from-gold to-transparent sm:w-16" />
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          <span className="h-px w-12 bg-gradient-to-r from-gold to-transparent sm:w-16" />
        </motion.div>

        <motion.h1
          className="font-display max-w-3xl text-[clamp(2.6rem,7vw,5rem)] leading-[1.05] font-semibold tracking-tight text-ink"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          ألونا
        </motion.h1>

        <motion.p
          className="mt-4 max-w-md text-lg font-light text-muted sm:text-xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          الجمال بلمسة هادئة — احجزي صالونك في سوريا من مكان واحد.
        </motion.p>

        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <DownloadGroup variant="dark" />
        </motion.div>

        <motion.p
          className="mt-6 text-sm text-muted/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          متوفر لأجهزة iPhone و Android
        </motion.p>
      </motion.div>

      <motion.div
        className="relative z-10 flex justify-center pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
      >
        <a
          href="#experience"
          className="group flex flex-col items-center gap-2 text-xs tracking-widest text-muted uppercase"
        >
          <span>اكتشفي</span>
          <span className="h-8 w-px origin-top bg-gold/50 transition group-hover:scale-y-125" />
        </a>
      </motion.div>
    </section>
  )
}
