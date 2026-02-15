export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 text-slate-700">
      <h1 className="text-xl font-bold text-slate-900">개인정보 처리방침</h1>

      <p className="mt-6 text-sm leading-6">
        NextWeight는 회원가입 없이 이용 가능한 익명 기반 서비스입니다.
        본 서비스는 사용자의 체중, 목표체중, 투약 상태 등 건강 관련 정보를
        주간 리포트 생성을 위한 목적에 한해 일시적으로 처리합니다.
      </p>

      <h2 className="mt-6 text-sm font-semibold text-slate-900">1. 수집하는 정보</h2>
      <ul className="mt-2 list-disc pl-5 text-sm leading-6">
        <li>체중, 목표 체중, 투약 상태, 투약 기간, 주차 정보</li>
        <li>근육량·운동·예산 선택 정보</li>
      </ul>

      <h2 className="mt-6 text-sm font-semibold text-slate-900">2. 정보의 이용 목적</h2>
      <p className="mt-2 text-sm leading-6">
        입력된 정보는 주간 코칭 리포트 생성 외의 용도로 사용되지 않으며,
        서버에 장기 저장되지 않습니다.
      </p>

      <h2 className="mt-6 text-sm font-semibold text-slate-900">3. 보관 및 파기</h2>
      <p className="mt-2 text-sm leading-6">
        사용자의 입력 정보는 브라우저 localStorage에 임시 저장되며,
        브라우저 데이터를 삭제하면 즉시 제거됩니다.
      </p>

      <h2 className="mt-6 text-sm font-semibold text-slate-900">4. 제3자 제공</h2>
      <p className="mt-2 text-sm leading-6">
        NextWeight는 어떠한 정보도 외부에 제공하거나 판매하지 않습니다.
      </p>

      <h2 className="mt-6 text-sm font-semibold text-slate-900">5. 문의</h2>
      <p className="mt-2 text-sm leading-6">
        개인정보 관련 문의는 nextweight.service@gmail.com 으로 연락해 주세요.
      </p>
    </main>
  );
}
