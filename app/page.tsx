// app/page.tsx
// Public landing page for NextWeight Korea

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NextWeight Korea | Bariatric Surgery Review",
  description:
    "A structured medical review pathway for comparing bariatric surgery with long-term GLP-1 treatment.",
};

const primaryCta =
  "mailto:snm@dyphi.com?subject=NextWeight%20Korea%20medical%20review";

const evidenceCards = [
  {
    value: "28.3%",
    label: "Mean weight loss after bariatric surgery",
    detail:
      "Compared with 10.3% in the intensive medical lifestyle arm of a recent randomized study.",
  },
  {
    value: "$11,689",
    label: "Estimated 2-year GLP-1 drug cost",
    detail:
      "Ongoing medication cost is often a central factor when patients compare treatment paths.",
  },
  {
    value: "~2/3",
    label: "Weight regain after stopping semaglutide",
    detail:
      "Long-term planning matters because regain is common once treatment is discontinued.",
  },
];

const pathwaySteps = [
  "Submit your medical background and treatment goals",
  "Receive a structured review from the coordination team",
  "Compare surgery, GLP-1 continuation, and non-surgical alternatives",
  "Plan the hospital consultation and follow-up support",
];

const audience = [
  "Patients currently using or considering GLP-1 medications",
  "Patients weighing long-term medication cost against a definitive surgical option",
  "Anyone who wants a specialist hospital review before deciding",
  "Families seeking a structured second opinion rather than promotional claims",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#17231f]">
      <header className="sticky top-0 z-30 border-b border-[#ded3bf] bg-[#f6f1e8]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" aria-label="NextWeight Korea home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-[#50615a] md:flex">
            <Link href="#results" className="transition hover:text-[#0d3b38]">
              Evidence
            </Link>
            <Link href="#pathway" className="transition hover:text-[#0d3b38]">
              Pathway
            </Link>
            <Link href="#review" className="transition hover:text-[#0d3b38]">
              Review
            </Link>
          </nav>
          <a
            href={primaryCta}
            className="rounded-full bg-[#0d3b38] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#092b29]"
          >
            Request review
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:pb-28 lg:pt-24">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c9b894] bg-[#fffaf1] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#8b5e34]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8b5e34]" />
            Bariatric surgery review
          </p>
          <h1 className="max-w-4xl font-serif text-5xl font-medium leading-[1.03] tracking-[-0.025em] text-[#10221f] sm:text-6xl lg:text-[4.35rem]">
            Compare GLP-1 treatment with a surgical pathway.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#4b5b55]">
            NextWeight Korea helps you organize a structured medical review
            before deciding whether to continue medication, consider bariatric
            surgery, or seek a second opinion from specialists.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={primaryCta}
              className="inline-flex items-center justify-center rounded-full bg-[#0d3b38] px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#092b29]"
            >
              Request medical review
            </a>
            <Link
              href="#results"
              className="inline-flex items-center justify-center rounded-full border border-[#b6a989] bg-[#fffaf1] px-7 py-3.5 text-sm font-semibold text-[#0d3b38] transition hover:border-[#0d3b38]"
            >
              See comparison evidence
            </Link>
          </div>
          <p className="mt-6 max-w-2xl text-xs leading-6 text-[#6f7a75]">
            This service provides coordination and information support only.
            Final diagnosis, treatment eligibility, and surgical decisions must
            be made by licensed physicians after formal consultation.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[#ded3bf] bg-[#fffaf1] p-4 shadow-[0_24px_80px_rgba(33,45,38,0.10)]">
          <div className="rounded-[1.5rem] bg-[#10221f] p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d7bf83]">
              Decision brief
            </p>
            <h2 className="mt-5 font-serif text-3xl font-medium tracking-[-0.02em]">
              A calmer way to make a high-stakes decision.
            </h2>
            <div className="mt-8 space-y-4">
              <BriefRow
                title="Clinical question"
                text="Is surgery appropriate, or should medication-based management continue?"
              />
              <BriefRow
                title="Financial question"
                text="How does long-term GLP-1 cost compare with a surgical pathway?"
              />
              <BriefRow
                title="Care question"
                text="What would the hospital consultation, recovery, and follow-up look like?"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Evidence */}
      <section
        id="results"
        className="border-y border-[#ded3bf] bg-[#fffaf1] py-20"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <Eyebrow index="01">Evidence snapshot</Eyebrow>
            <h2 className="mt-5 font-serif text-4xl font-medium tracking-[-0.02em] text-[#10221f] sm:text-5xl">
              Make the comparison visible before the consultation.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#596760]">
              The purpose of this page is not to push one treatment. It is to
              organize the numbers patients most often need to weigh: weight-loss
              effect, long-term cost, and the possibility of regain after
              stopping medication.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {evidenceCards.map((card) => (
              <article
                key={card.label}
                className="rounded-[1.5rem] border border-[#ded3bf] bg-[#f6f1e8] p-7"
              >
                <p className="font-serif text-5xl font-medium tracking-[-0.03em] text-[#0d3b38]">
                  {card.value}
                </p>
                <h3 className="mt-5 text-lg font-semibold text-[#17231f]">
                  {card.label}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#5c6a64]">
                  {card.detail}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-xs leading-6 text-[#7b827e]">
            Figures shown here are simplified for patient discussion and should
            be reviewed against source papers and physician guidance before any
            treatment decision.
          </p>
        </div>
      </section>

      {/* Audience */}
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Eyebrow index="02">Who this is for</Eyebrow>
          <h2 className="mt-5 font-serif text-4xl font-medium tracking-[-0.02em] text-[#10221f]">
            For patients who need a structured second opinion.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {audience.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[#ded3bf] bg-[#fffaf1] p-5 text-sm leading-6 text-[#4f5d57]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* Pathway */}
      <section id="pathway" className="bg-[#10221f] py-20 text-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <Eyebrow index="03" tone="dark">
                Review pathway
              </Eyebrow>
              <h2 className="mt-5 font-serif text-4xl font-medium tracking-[-0.02em] sm:text-5xl">
                From online review to hospital visit, without scattered
                decisions.
              </h2>
              <p className="mt-5 text-base leading-7 text-[#cbd8d2]">
                A clear pathway helps patients avoid comparing isolated prices,
                promotional claims, and unrelated clinic recommendations.
              </p>
            </div>
            <div className="space-y-4">
              {pathwaySteps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-5 rounded-2xl border border-white/10 bg-white/[0.06] p-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d7bf83] text-sm font-semibold text-[#10221f]">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-base leading-7 text-[#eef4f1]">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Review CTA */}
      <section id="review" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="rounded-[2rem] border border-[#ded3bf] bg-[#fffaf1] p-8 sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <Eyebrow index="04">Start with a review</Eyebrow>
            <h2 className="mt-5 font-serif text-4xl font-medium tracking-[-0.02em] text-[#10221f]">
              Send the basic information first. Decide after the medical review.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#596760]">
              Share your current BMI, medication history, medical conditions,
              treatment goal, and preferred timeline. We will help organize the
              next step of the review.
            </p>
          </div>
          <div className="mt-8 flex shrink-0 flex-col gap-3 lg:mt-0">
            <a
              href={primaryCta}
              className="inline-flex items-center justify-center rounded-full bg-[#0d3b38] px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#092b29]"
            >
              Request medical review
            </a>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center rounded-full border border-[#b6a989] px-7 py-3.5 text-sm font-semibold text-[#0d3b38] transition hover:border-[#0d3b38]"
            >
              Patient record app
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#ded3bf] px-5 py-10 text-sm text-[#67736e] sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <Logo tone="muted" />
          <p className="order-last text-xs md:order-none">
            NextWeight Korea · Operated by DYPHI
          </p>
          <div className="flex gap-5">
            <Link href="/legal/privacy" className="transition hover:text-[#0d3b38]">
              Privacy
            </Link>
            <Link href="/legal/terms" className="transition hover:text-[#0d3b38]">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Logo({ tone = "default" }: { tone?: "default" | "muted" }) {
  const wordColor = tone === "muted" ? "text-[#3f4f49]" : "text-[#0d3b38]";
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="flex items-baseline gap-1.5">
        <span
          className={`font-serif text-[1.35rem] font-medium leading-none tracking-[-0.01em] ${wordColor}`}
        >
          NextWeight
        </span>
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-[#8b5e34]">
          Korea
        </span>
      </span>
    </span>
  );
}

function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="8" fill="#0d3b38" />
      <path
        d="M8 10H13V15.5H18V21H21"
        stroke="#e7cf8f"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="23.4" cy="21" r="2.4" fill="#e7cf8f" />
    </svg>
  );
}

function Eyebrow({
  index,
  children,
  tone = "light",
}: {
  index: string;
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  const accent = tone === "dark" ? "text-[#d7bf83]" : "text-[#8b5e34]";
  const rule = tone === "dark" ? "bg-[#d7bf83]/40" : "bg-[#c9b894]";
  return (
    <p
      className={`flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] ${accent}`}
    >
      <span className="tabular-nums">{index}</span>
      <span className={`h-px w-8 ${rule}`} />
      <span>{children}</span>
    </p>
  );
}

function BriefRow({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
      <p className="text-sm font-semibold text-[#d7bf83]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#dbe7e1]">{text}</p>
    </div>
  );
}
