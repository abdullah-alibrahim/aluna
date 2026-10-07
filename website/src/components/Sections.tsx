import { FadeRise } from './FadeRise'
import { DownloadGroup } from './DownloadButtons'

const steps = [
  {
    n: '٠١',
    title: 'اختاري الصالون',
    text: 'تصفّحي أفضل الصالونات ومراكز التجميل قربك، مع التقييمات والخدمات والأسعار بالليرة السورية.',
  },
  {
    n: '٠٢',
    title: 'احجزي موعدك',
    text: 'اختاري الخدمة والمختص والوقت المناسب — واحصلي على تأكيد فوري على هاتفك.',
  },
  {
    n: '٠٣',
    title: 'ادفعي براحتك',
    text: 'نقداً في الصالون أو إلكترونياً. كوبونات وعروض تظهر داخل التطبيق مباشرة.',
  },
]

const features = [
  {
    title: 'صالونات موثوقة',
    text: 'اختيارات منتقاة ومراكز تجميل حقيقية في سوريا، مع تفاصيل واضحة قبل الحجز.',
  },
  {
    title: 'مواعيد تناسبك',
    text: 'شوفي الأوقات المتاحة واحجزي بضغطة — بدون مكالمات أو انتظار.',
  },
  {
    title: 'أسعار بالليرة',
    text: 'كل الأسعار والخدمات معروضة بالليرة السورية، بدون مفاجآت عند الدفع.',
  },
  {
    title: 'تذكيرات ذكية',
    text: 'تنبيهات قبل الموعد حتى توصلي مرتاحة وفي الوقت.',
  },
  {
    title: 'عروض وكوبونات',
    text: 'استفيدي من التخفيضات الحصرية داخل التطبيق عند الحجز.',
  },
  {
    title: 'تجربة أنيقة',
    text: 'واجهة هادئة بلمسة ذهبية — سهلة، سريعة، ومصممة لكِ.',
  },
]

const audience = [
  {
    title: 'للباحثات عن أناقة يومية',
    text: 'تسريحة، عناية، أو جلسة سريعة — احجزي أقرب صالون بخطوات بسيطة.',
  },
  {
    title: 'للمناسبات الخاصة',
    text: 'قبل فرح أو سهرة: اختاري الخدمة والمختص مسبقاً ووفّري وقتك.',
  },
  {
    title: 'لمن تحب التفاصيل',
    text: 'شوفي الخدمات والأسعار والتقييمات قبل ما تقرري — كل شيء واضح.',
  },
]

export function Experience() {
  return (
    <section id="experience" className="relative bg-cream px-5 py-24 sm:px-10 lg:px-16 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold/40 to-transparent" />

      <div className="mx-auto max-w-5xl">
        <FadeRise className="mb-16 max-w-xl">
          <p className="mb-3 text-sm font-medium tracking-[0.2em] text-gold">التجربة</p>
          <h2 className="font-display text-4xl leading-tight font-semibold text-ink sm:text-5xl">
            حجز أنيق… بدون تعقيد
          </h2>
          <p className="mt-4 text-lg font-light text-muted">
            تطبيق ألونا يقرّب الصالون منك: اختيار واضح، موعد مؤكد، ومتابعة من هاتفك.
          </p>
        </FadeRise>

        <div className="grid gap-12 md:grid-cols-3 md:gap-8">
          {steps.map((step, i) => (
            <FadeRise key={step.n} delay={0.1 * i}>
              <div className="relative">
                <span className="font-display text-5xl text-gold/35">{step.n}</span>
                <h3 className="mt-3 text-xl font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-base leading-relaxed font-light text-muted">{step.text}</p>
              </div>
            </FadeRise>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Features() {
  return (
    <section id="features" className="relative bg-cream-deep px-5 py-24 sm:px-10 lg:px-16 lg:py-28">
      <div className="mx-auto max-w-5xl">
        <FadeRise className="mb-14 max-w-2xl">
          <p className="mb-3 text-sm font-medium tracking-[0.2em] text-gold">المزايا</p>
          <h2 className="font-display text-4xl leading-tight font-semibold text-ink sm:text-5xl">
            كل ما تحتاجينه… في تطبيق واحد
          </h2>
          <p className="mt-4 text-lg font-light text-muted">
            من اكتشاف الصالون حتى تأكيد الموعد — ألونا ترتّب التفاصيل بهدوء وأناقة.
          </p>
        </FadeRise>

        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FadeRise key={f.title} delay={0.06 * i}>
              <div className="border-t border-gold/25 pt-5">
                <h3 className="text-lg font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-base leading-relaxed font-light text-muted">{f.text}</p>
              </div>
            </FadeRise>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ForYou() {
  return (
    <section id="for-you" className="relative bg-cream px-5 py-24 sm:px-10 lg:px-16 lg:py-28">
      <div className="mx-auto max-w-5xl">
        <FadeRise className="mb-14 text-center">
          <p className="mb-3 text-sm font-medium tracking-[0.2em] text-gold">لمن صُمّم</p>
          <h2 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
            ألونا… لكِ
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg font-light text-muted">
            سواء موعد سريع أو استعداد لمناسبة — التطبيق يسهّل عليكِ الوصول لجمالك.
          </p>
        </FadeRise>

        <div className="grid gap-10 md:grid-cols-3">
          {audience.map((item, i) => (
            <FadeRise key={item.title} delay={0.08 * i} className="text-center md:text-right">
              <div className="mx-auto mb-4 h-px w-12 bg-gold/50 md:mx-0" />
              <h3 className="text-xl font-semibold text-ink">{item.title}</h3>
              <p className="mt-3 text-base leading-relaxed font-light text-muted">{item.text}</p>
            </FadeRise>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Atmosphere() {
  return (
    <section className="relative overflow-hidden px-5 py-24 sm:px-10 lg:px-16 lg:py-28">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#1C1812_0%,#2A241C_50%,#14110A_100%)]" />
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute -right-16 -bottom-20 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        <FadeRise className="max-w-lg text-center lg:text-right">
          <p className="mb-3 text-sm font-medium tracking-[0.2em] text-gold-soft">لماذا ألونا</p>
          <h2 className="font-display text-4xl leading-tight font-semibold text-cream sm:text-5xl">
            لمسة فخامة في جيبك
          </h2>
          <p className="mt-4 text-lg font-light text-cream/70">
            واجهة هادئة، ألوان دافئة، وتجربة حجز صُمّمت للمرأة التي تحب التفاصيل الجميلة — من دمشق إلى كل سوريا.
          </p>
          <ul className="mt-8 space-y-3 text-right text-cream/80">
            {[
              'حجز سريع بخطوات واضحة',
              'متابعة مواعيدك من مكان واحد',
              'دعم اللغة العربية بالكامل',
            ].map((line) => (
              <li key={line} className="flex items-center justify-end gap-3">
                <span className="font-light">{line}</span>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              </li>
            ))}
          </ul>
        </FadeRise>

        <FadeRise delay={0.15} className="relative">
          <div className="relative mx-auto w-[min(70vw,240px)]">
            <div className="absolute -inset-8 rounded-full bg-gold/20 blur-3xl" />
            <img
              src="/logo.png?v=2"
              alt="شعار ألونا"
              className="relative mx-auto h-auto max-h-56 w-auto object-contain drop-shadow-[0_20px_50px_rgba(181,148,81,0.35)]"
            />
          </div>
        </FadeRise>
      </div>
    </section>
  )
}

export function SyriaNote() {
  return (
    <section className="relative bg-cream px-5 py-20 sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold/30 to-transparent" />
      <FadeRise className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-sm font-medium tracking-[0.2em] text-gold">سوريا</p>
        <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          صُنع لسوقنا… وبلغتنا
        </h2>
        <p className="mt-4 text-lg leading-relaxed font-light text-muted">
          ألونا تطبيق حجز صالونات مصمّم للواقع السوري: واجهة عربية، أسعار بالليرة، وتجربة تناسب يومكِ —
          من اكتشاف الصالون حتى الوصول إليه بثقة.
        </p>
      </FadeRise>
    </section>
  )
}

export function DownloadBand() {
  return (
    <section
      id="download"
      className="relative bg-cream-deep px-5 py-24 sm:px-10 lg:px-16 lg:py-28"
    >
      <div className="mx-auto max-w-3xl text-center">
        <FadeRise>
          <h2 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
            ابدئي رحلتك مع ألونا
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg font-light text-muted">
            حمّلي تطبيق المستخدم الآن واحجزي موعدك القادم بخطوات معدودة.
          </p>
        </FadeRise>
        <FadeRise delay={0.12} className="mt-10 flex justify-center">
          <DownloadGroup variant="gold" className="justify-center" />
        </FadeRise>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-gold/15 bg-cream px-5 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="text-center sm:text-right">
          <p className="font-display text-xl text-ink">Aluna · ألونا</p>
          <p className="mt-1 text-sm text-muted">الجمال بلمسة هادئة</p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted">
          <a href="#experience" className="transition hover:text-ink">
            التجربة
          </a>
          <a href="#features" className="transition hover:text-ink">
            المزايا
          </a>
          <a href="#for-you" className="transition hover:text-ink">
            لمن صُمّم
          </a>
          <a href="#download" className="transition hover:text-ink">
            التحميل
          </a>
        </nav>
        <p className="text-sm text-muted">© {new Date().getFullYear()} ألونا</p>
      </div>
    </footer>
  )
}
