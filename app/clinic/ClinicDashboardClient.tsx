'use client';

// app/clinic/ClinicDashboardClient.tsx
// 병원 대시보드 - 환자 목록 및 상태 모니터링

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { DashboardPatient } from '@/lib/types';

interface DashboardData {
  clinic_id: string;
  patients: DashboardPatient[];
  total: number;
  summary: {
    red: number;
    yellow: number;
    green: number;
    active: number;
    paused: number;
    discharged: number;
  };
}

export default function ClinicDashboardClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  const [colorFilter, setColorFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const clinicId = searchParams.get('clinic_id');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!clinicId || !token) {
      setError('인증 정보가 없습니다. URL에 clinic_id와 token을 포함해주세요.');
      setLoading(false);
      return;
    }

    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId, token, colorFilter, statusFilter]);

  async function fetchDashboard() {
    try {
      setLoading(true);
      setError(null);

      const qs = new URLSearchParams({
        clinic_id: clinicId!,
        token: token!,
        weeks: '4',
      });

      if (colorFilter) qs.set('color', colorFilter);
      if (statusFilter) qs.set('status', statusFilter);

      const response = await fetch(`/api/clinics/${clinicId}/dashboard?${qs.toString()}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        let msg = '데이터를 불러올 수 없습니다.';
        try {
          const errorData = await response.json();
          msg = errorData?.error || msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      const dashboardData: DashboardData = await response.json();
      setData(dashboardData);
    } catch (err: any) {
      setError(err?.message || '오류가 발생했습니다.');
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

  function handlePatientClick(patientCode: string) {
    if (!clinicId || !token) return;
    router.push(`/clinic/patient/${patientCode}?clinic_id=${encodeURIComponent(clinicId)}&token=${encodeURIComponent(token)}`);
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <h2 className="text-lg font-bold text-red-600 mb-2">오류</h2>
          <p className="text-slate-700">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">병원 대시보드</h1>
          {data && (
            <p className="mt-1 text-sm text-slate-600">
              병원 코드: {data.clinic_id} | 환자 {data.total}명
            </p>
          )}
        </header>

        {data && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
            <div className="bg-white rounded-xl border border-red-200 p-4">
              <div className="text-xs font-semibold text-red-600 mb-1">긴급</div>
              <div className="text-2xl font-black text-red-700">{data.summary.red}</div>
            </div>
            <div className="bg-white rounded-xl border border-yellow-200 p-4">
              <div className="text-xs font-semibold text-yellow-600 mb-1">주의</div>
              <div className="text-2xl font-black text-yellow-700">{data.summary.yellow}</div>
            </div>
            <div className="bg-white rounded-xl border border-green-200 p-4">
              <div className="text-xs font-semibold text-green-600 mb-1">양호</div>
              <div className="text-2xl font-black text-green-700">{data.summary.green}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs font-semibold text-slate-600 mb-1">활성</div>
              <div className="text-2xl font-black text-slate-900">{data.summary.active}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs font-semibold text-slate-600 mb-1">중단</div>
              <div className="text-2xl font-black text-slate-700">{data.summary.paused}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs font-semibold text-slate-600 mb-1">종료</div>
              <div className="text-2xl font-black text-slate-500">{data.summary.discharged}</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-2">신호색</label>
              <select
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">전체</option>
                <option value="red">긴급 (빨강)</option>
                <option value="yellow">주의 (노랑)</option>
                <option value="green">양호 (초록)</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-2">상태</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">전체</option>
                <option value="active">활성</option>
                <option value="paused">중단</option>
                <option value="discharged">종료</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-600">데이터를 불러오는 중...</p>
          </div>
        ) : data && data.patients.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">신호</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">환자코드</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">이름</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">마지막 Daily</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">마지막 Weekly</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">투약누락(7일)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">오심 max</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.patients.map((patient) => (
                    <tr
                      key={patient.patient_code}
                      onClick={() => handlePatientClick(patient.patient_code)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-bold border ${getColorBadge(
                            patient.computed_status.signal_color
                          )}`}
                        >
                          {patient.computed_status.signal_color === 'red'
                            ? '긴급'
                            : patient.computed_status.signal_color === 'yellow'
                              ? '주의'
                              : '양호'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{patient.patient_code}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{patient.name_or_initial}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {patient.computed_status.days_since_last_daily !== undefined
                          ? `${patient.computed_status.days_since_last_daily}일 전`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {patient.computed_status.days_since_last_weekly !== undefined
                          ? `${patient.computed_status.days_since_last_weekly}일 전`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                        {patient.computed_status.missed_medication_7d}회
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                        {patient.computed_status.max_nausea_7d}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{patient.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-600">환자 데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </main>
  );
}
