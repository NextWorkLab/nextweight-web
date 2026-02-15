export default async function ReportLockedPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <section className="rounded-2xl bg-white shadow-sm border p-6">
          <div className="text-xl text-slate-900">PDF 리포트는 1회 무료입니다</div>
          <div className="mt-2 text-slate-700">
            다음 리포트부터는 기록 보관을 위해 로그인이 필요합니다.
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-white"
              href="/auth/signin"
            >
              로그인하고 계속하기
            </a>
            <a
              className="inline-flex items-center rounded-xl border px-4 py-2 text-slate-900"
              href="/results"
            >
              결과로 돌아가기
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
