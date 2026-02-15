// app/clinic/patient/[patient_code]/page.tsx
// 환자별 상세 리포트

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ReportData } from '@/lib/types';

export default function PatientReport() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportData | null>(null);
  const [weeks, setWeeks] = useState(4);

  const patientCode = params.patient_code as string;
  const clinicId = searchParams.get('clinic_id');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!clinicId || !token) {
      setError('인증 정보가 없습니다.');
      setLoading(false);
      return;
    }

    fetchReport();
  }, [clinicId, token, patientCode, weeks]);

  async function fetchReport() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        clinic_id: clinicId!,
        token: token!,
        weeks: weeks.toString(),
      });

      const response = await fetch(
        `/api/clinics/${clinicId}/patients/${patientCode}/report?${params.toString()}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '리포트를 불러올 수 없습니다.');
      }

      const reportData = await response.json();
      setData(reportData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getColorBadge(color: string) {
    const colors = {
      red: 'bg-red-100 text-red-800 border-red-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      green: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[color as keyof typeof colors] || colors.green;
  }

  function handlePrint() {
    router.push(`/clinic/patient/${patientCode}/print?clinic_id=${clinicId}&token=${token}&weeks=${weeks}`);
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <h2 className="text-lg font-bold text-red-600 mb-2">오류</h2>
          <p className="text-slate-700">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm"
          >
            돌아가기
          </button>
        </div>
      </main>
    );
  }

  if (loading || !data) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">리포트를 불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">
              환자 리포트
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {data.patient.patient_code} | {data.patient.name_or_initial}
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value={2}>최근 2주</option>
              <option value={4}>최근 4주</option>
              <option value={8}>최근 8주</option>
            </select>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800"
            >
              인쇄
            </button>
          </div>
        </header>

        {/* Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-black text-slate-900 mb-4">현재 상태</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-600 mb-2">신호색</div>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold border ${getColorBadge(data.computed_status.signal_color)}`}>
                {data.computed_status.signal_color === 'red' ? '긴급' : 
                 data.computed_status.signal_color === 'yellow' ? '주의' : '양호'}
              </span>
              <div className="mt-2 text-xs text-slate-600">
                {data.computed_status.signal_reasons.join(', ')}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-600 mb-2">7일 순응률</div>
              <div className="text-2xl font-black text-slate-900">
                {data.computed_status.adherence_rate_7d}%
              </div>
              <div className="mt-1 text-xs text-slate-600">
                투약 누락: {data.computed_status.missed_medication_7d}회
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-600 mb-2">증상</div>
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="text-slate-600">최대 오심:</span>{' '}
                  <span className="font-bold text-slate-900">{data.computed_status.max_nausea_7d}</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-600">구토:</span>{' '}
                  <span className="font-bold text-slate-900">{data.computed_status.vomiting_count_7d}회</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-600 mb-2">체중 변화</div>
              {data.summary.weight_change !== undefined ? (
                <>
                  <div className="text-2xl font-black text-slate-900">
                    {data.summary.weight_change > 0 ? '+' : ''}
                    {data.summary.weight_change.toFixed(1)}kg
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {data.summary.weight_change_percent !== undefined &&
                      `${data.summary.weight_change_percent > 0 ? '+' : ''}${data.summary.weight_change_percent.toFixed(1)}%`
                    }
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-500">데이터 없음</div>
              )}
            </div>
          </div>
        </div>

        {/* Daily Chart */}
        {data.daily_chart_data.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-black text-slate-900 mb-4">일일 증상 추이</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.daily_chart_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="nausea_level" stroke="#EF4444" name="오심" strokeWidth={2} />
                <Line type="monotone" dataKey="overall_condition" stroke="#10B981" name="컨디션" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Weekly Chart */}
        {data.weekly_chart_data.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-black text-slate-900 mb-4">주간 체중 추이</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.weekly_chart_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="weight_kg" stroke="#3B82F6" name="체중 (kg)" strokeWidth={2} />
                {data.weekly_chart_data.some(d => d.body_fat_percent !== undefined) && (
                  <Line type="monotone" dataKey="body_fat_percent" stroke="#F59E0B" name="체지방 (%)" strokeWidth={2} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary Stats */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-black text-slate-900 mb-4">기간 요약 ({weeks}주)</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-xs font-semibold text-slate-600 mb-1">Daily 응답</div>
              <div className="text-2xl font-black text-slate-900">{data.summary.total_daily_responses}</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-xs font-semibold text-slate-600 mb-1">Weekly 응답</div>
              <div className="text-2xl font-black text-slate-900">{data.summary.total_weekly_responses}</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-xs font-semibold text-slate-600 mb-1">평균 오심</div>
              <div className="text-2xl font-black text-slate-900">{data.summary.avg_nausea}</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-xs font-semibold text-slate-600 mb-1">평균 컨디션</div>
              <div className="text-2xl font-black text-slate-900">{data.summary.avg_condition}</div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <button
            onClick={() => router.push(`/clinic?clinic_id=${clinicId}&token=${token}`)}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    </main>
  );
}
