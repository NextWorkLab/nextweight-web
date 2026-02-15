// app/clinic/patient/[patient_code]/print/page.tsx
// 인쇄 최적화 환자 리포트

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import type { ReportData } from '@/lib/types';

export default function PatientReportPrint() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);

  const patientCode = params.patient_code as string;
  const clinicId = searchParams.get('clinic_id');
  const token = searchParams.get('token');
  const weeks = searchParams.get('weeks') || '4';

  useEffect(() => {
    if (clinicId && token) {
      fetchReport();
    }
  }, [clinicId, token, patientCode, weeks]);

  async function fetchReport() {
    try {
      const params = new URLSearchParams({
        clinic_id: clinicId!,
        token: token!,
        weeks: weeks,
      });

      const response = await fetch(
        `/api/clinics/${clinicId}/patients/${patientCode}/report?${params.toString()}`
      );
      
      const reportData = await response.json();
      setData(reportData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load report:', err);
      setLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>리포트를 불러오는 중...</p>
      </div>
    );
  }

  const signalColorText = {
    red: '긴급',
    yellow: '주의',
    green: '양호',
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-after: always;
          }
        }
      `}</style>

      <div className="min-h-screen bg-white p-8">
        {/* Print Button - Hidden on Print */}
        <div className="no-print mb-6 flex justify-end">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold"
          >
            인쇄하기
          </button>
        </div>

        {/* Report Content */}
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8 pb-6 border-b-2 border-slate-900">
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              GLP-1 치료 모니터링 리포트
            </h1>
            <div className="flex justify-between text-sm text-slate-600">
              <div>
                <div>환자코드: <strong>{data.patient.patient_code}</strong></div>
                <div>이름: <strong>{data.patient.name_or_initial}</strong></div>
              </div>
              <div className="text-right">
                <div>리포트 기간: 최근 {weeks}주</div>
                <div>생성일: {new Date().toLocaleDateString('ko-KR')}</div>
              </div>
            </div>
          </header>

          {/* Current Status */}
          <section className="mb-8">
            <h2 className="text-xl font-black text-slate-900 mb-4">현재 상태</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border-2 border-slate-900 rounded-lg p-4">
                <div className="text-sm font-semibold text-slate-600 mb-2">신호색</div>
                <div className={`inline-block px-4 py-2 rounded-full text-lg font-black ${
                  data.computed_status.signal_color === 'red' 
                    ? 'bg-red-100 text-red-800 border-2 border-red-500'
                    : data.computed_status.signal_color === 'yellow'
                    ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-500'
                    : 'bg-green-100 text-green-800 border-2 border-green-500'
                }`}>
                  {signalColorText[data.computed_status.signal_color]}
                </div>
                <div className="mt-2 text-sm text-slate-700">
                  {data.computed_status.signal_reasons.join(', ')}
                </div>
              </div>

              <div className="border-2 border-slate-900 rounded-lg p-4">
                <div className="text-sm font-semibold text-slate-600 mb-2">투약 순응률 (7일)</div>
                <div className="text-3xl font-black text-slate-900">
                  {data.computed_status.adherence_rate_7d}%
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  투약 누락: {data.computed_status.missed_medication_7d}회
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="border border-slate-300 rounded-lg p-3">
                <div className="text-xs font-semibold text-slate-600 mb-1">최대 오심 (7일)</div>
                <div className="text-2xl font-black text-slate-900">
                  {data.computed_status.max_nausea_7d}
                </div>
              </div>

              <div className="border border-slate-300 rounded-lg p-3">
                <div className="text-xs font-semibold text-slate-600 mb-1">구토 횟수 (7일)</div>
                <div className="text-2xl font-black text-slate-900">
                  {data.computed_status.vomiting_count_7d}회
                </div>
              </div>

              <div className="border border-slate-300 rounded-lg p-3">
                <div className="text-xs font-semibold text-slate-600 mb-1">체중 변화 ({weeks}주)</div>
                <div className="text-2xl font-black text-slate-900">
                  {data.summary.weight_change !== undefined
                    ? `${data.summary.weight_change > 0 ? '+' : ''}${data.summary.weight_change.toFixed(1)}kg`
                    : '-'
                  }
                </div>
              </div>
            </div>
          </section>

          {/* Summary Statistics */}
          <section className="mb-8">
            <h2 className="text-xl font-black text-slate-900 mb-4">기간 요약 ({weeks}주)</h2>
            
            <table className="w-full border-collapse border border-slate-300">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="p-3 font-semibold bg-slate-50">Daily 응답 수</td>
                  <td className="p-3">{data.summary.total_daily_responses}회</td>
                  <td className="p-3 font-semibold bg-slate-50">Weekly 응답 수</td>
                  <td className="p-3">{data.summary.total_weekly_responses}회</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-3 font-semibold bg-slate-50">평균 오심 수준</td>
                  <td className="p-3">{data.summary.avg_nausea} / 10</td>
                  <td className="p-3 font-semibold bg-slate-50">평균 컨디션</td>
                  <td className="p-3">{data.summary.avg_condition} / 10</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold bg-slate-50">투약 순응률</td>
                  <td className="p-3">{data.summary.adherence_rate}%</td>
                  <td className="p-3 font-semibold bg-slate-50">체중 변화율</td>
                  <td className="p-3">
                    {data.summary.weight_change_percent !== undefined
                      ? `${data.summary.weight_change_percent > 0 ? '+' : ''}${data.summary.weight_change_percent.toFixed(1)}%`
                      : '-'
                    }
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Recent Responses */}
          {data.daily_responses.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-black text-slate-900 mb-4">최근 일일 응답 (최근 7일)</h2>
              
              <table className="w-full border-collapse border border-slate-300 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2 border border-slate-300 text-left">날짜</th>
                    <th className="p-2 border border-slate-300 text-center">투약</th>
                    <th className="p-2 border border-slate-300 text-center">오심</th>
                    <th className="p-2 border border-slate-300 text-center">구토</th>
                    <th className="p-2 border border-slate-300 text-center">컨디션</th>
                  </tr>
                </thead>
                <tbody>
                  {data.daily_responses.slice(-7).reverse().map((response, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border border-slate-300">
                        {new Date(response.timestamp).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        {response.medication_taken ? '✓' : '✗'}
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        {response.nausea_level}
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        {response.vomiting ? '예' : '아니오'}
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        {response.overall_condition}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-slate-300 text-xs text-slate-500">
            <p>
              본 리포트는 환자의 자가 응답 데이터를 기반으로 생성되었습니다.
              임상적 판단은 반드시 담당 의료진의 종합적인 평가를 통해 이루어져야 합니다.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
