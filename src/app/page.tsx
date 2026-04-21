//#region Imports
import { Logo } from "@/components/Logo";
import PreferencesToggle from "@/components/ReusableComponent/PreferencesToggle";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n";
import { getLocale, getTheme } from "@/lib/preferences";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Bot, Check, CreditCard, Package, Phone, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
//#endregion

//#region Landing Page (server component, i18n-aware)
export default async function LandingPage() {
  const [t, theme, locale, authRes] = await Promise.all([
    getDictionary(),
    getTheme(),
    getLocale(),
    auth(),
  ]);
  const isAuthed = !!authRes.userId;

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthed={isAuthed} t={t} theme={theme} locale={locale} />
      <Hero t={t} />
      <HowItWorks t={t} />
      <Features t={t} />
      <Pricing t={t} />
      <Footer t={t} />
    </div>
  );
}
//#endregion

//#region Sections
type T = Awaited<ReturnType<typeof getDictionary>>;

function Header({
  isAuthed,
  t,
  theme,
  locale,
}: {
  isAuthed: boolean;
  t: T;
  theme: "dark" | "light";
  locale: "es" | "en";
}) {
  return (
    <header className="w-full border-b border-border sticky top-0 z-40 bg-background/80 backdrop-blur">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" aria-label="callcito" className="flex items-center">
          <Logo size={36} withWordmark />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#how">{t.landing.navHow}</a>
          <a href="#features">{t.landing.navFeatures}</a>
          <a href="#pricing">{t.landing.navPricing}</a>
        </nav>
        <div className="flex items-center gap-2">
          <PreferencesToggle currentTheme={theme} currentLocale={locale} />
          {isAuthed ? (
            <Button asChild>
              <Link href="/home">{t.common.dashboard}</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/sign-in">{t.common.login}</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-in">{t.common.startFree}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero({ t }: { t: T }) {
  return (
    <section className="container mx-auto px-6 py-20 md:py-32 text-center">
      <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border border-border mb-6">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        {t.landing.badge}
      </div>
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-balance">
        {t.landing.heroTitlePrefix}{" "}
        <span className="text-primary">{t.landing.heroTitleAccent}</span>{" "}
        {t.landing.heroTitleSuffix}
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
        {t.landing.heroDesc}
      </p>
      <div className="flex items-center justify-center gap-3">
        <Button size="lg" asChild>
          <Link href="/sign-in">
            {t.landing.ctaPrimary} <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <a href="#how">{t.landing.ctaSecondary}</a>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-4">{t.landing.ctaSub}</p>
    </section>
  );
}

function HowItWorks({ t }: { t: T }) {
  const icons = [Upload, Bot, Phone, CreditCard];
  return (
    <section id="how" className="container mx-auto px-6 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
        {t.landing.howTitle}
      </h2>
      <p className="text-muted-foreground text-center mb-12">
        {t.landing.howSubtitle}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {t.landing.steps.map((s, i) => {
          const Icon = icons[i] ?? Upload;
          return (
            <div key={i} className="p-6 rounded-xl border border-border">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-mono text-muted-foreground">0{i + 1}</span>
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Features({ t }: { t: T }) {
  const icons = [Package, Bot, CreditCard, Sparkles];
  return (
    <section id="features" className="container mx-auto px-6 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
        {t.landing.featuresTitle}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {t.landing.features.map((f, i) => {
          const Icon = icons[i] ?? Package;
          return (
            <div key={i} className="p-6 rounded-xl border border-border">
              <Icon className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Pricing({ t }: { t: T }) {
  return (
    <section id="pricing" className="container mx-auto px-6 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
        {t.landing.pricingTitle}
      </h2>
      <p className="text-muted-foreground text-center mb-12">
        {t.landing.pricingSubtitle}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto items-stretch">
        {t.landing.plans.map((p) => (
          <div
            key={p.name}
            className={`relative p-6 rounded-xl border flex flex-col h-full ${
              p.popular ? "border-primary shadow-lg" : "border-border"
            }`}
          >
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full bg-primary text-primary-foreground">
                {t.landing.pricingMostPopular}
              </span>
            )}
            <h3 className="font-semibold text-lg mb-1">{p.name}</h3>
            <p className="text-xs text-muted-foreground mb-5 min-h-[2.5rem]">{p.pitch}</p>
            <p className="text-3xl font-bold mb-1">
              {p.priceLabel}
              {!p.enterprise && p.priceLabel !== t.landing.plans[0].priceLabel && (
                <span className="text-sm font-normal text-muted-foreground">
                  {t.landing.pricingPerMonth}
                </span>
              )}
            </p>
            <div className="h-px bg-border my-5" />
            <ul className="text-sm space-y-2.5 mb-6 text-muted-foreground">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full mt-auto"
              variant={p.popular ? "default" : "outline"}
              asChild
            >
              <Link href="/sign-in">
                {p.enterprise ? t.landing.pricingContact : t.landing.pricingCta}
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer({ t }: { t: T }) {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Logo size={20} /> callcito — {new Date().getFullYear()}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">{t.common.login}</Link>
          <a href="mailto:hola@callcito.app">{t.common.contact}</a>
        </div>
      </div>
    </footer>
  );
}
//#endregion
