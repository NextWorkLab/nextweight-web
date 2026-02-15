// lib/auth.ts
// 간단한 토큰 기반 인증 (MVP용)

import { NextRequest } from 'next/server';

export interface AuthResult {
  authenticated: boolean;
  clinic_id?: string;
  error?: string;
}

/**
 * 요청에서 clinic_id와 토큰을 검증
 * MVP는 토큰 방식 사용
 */
export function authenticateRequest(request: NextRequest, requiredClinicId?: string): AuthResult {
  const authMode = process.env.AUTH_MODE || 'token';

  if (authMode === 'token') {
    return authenticateWithToken(request, requiredClinicId);
  }

  // 추후 확장: email, basic 등
  return {
    authenticated: false,
    error: 'Unsupported auth mode',
  };
}

/**
 * 토큰 기반 인증
 * URL 파라미터 또는 Authorization 헤더에서 토큰 확인
 */
function authenticateWithToken(request: NextRequest, requiredClinicId?: string): AuthResult {
  // 1. URL 파라미터에서 토큰 확인
  const { searchParams } = new URL(request.url);
  let token = searchParams.get('token');
  let clinicId = searchParams.get('clinic_id');

  // 2. Authorization 헤더에서 확인
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token || !clinicId) {
    return {
      authenticated: false,
      error: 'Missing token or clinic_id',
    };
  }

  // 3. 토큰 매핑 확인
  const tokenMapJson = process.env.CLINIC_TOKEN_MAP;
  if (!tokenMapJson) {
    return {
      authenticated: false,
      error: 'Token map not configured',
    };
  }

  let tokenMap: Record<string, string>;
  try {
    tokenMap = JSON.parse(tokenMapJson);
  } catch (error) {
    return {
      authenticated: false,
      error: 'Invalid token map configuration',
    };
  }

  // 4. 토큰 검증
  const expectedToken = tokenMap[clinicId];
  if (!expectedToken || expectedToken !== token) {
    return {
      authenticated: false,
      error: 'Invalid token for clinic',
    };
  }

  // 5. clinic_id 일치 확인 (URL 파라미터로 받은 경우)
  if (requiredClinicId && requiredClinicId !== clinicId) {
    return {
      authenticated: false,
      error: 'Clinic ID mismatch',
    };
  }

  return {
    authenticated: true,
    clinic_id: clinicId,
  };
}

/**
 * 간단한 인증 응답 헬퍼
 */
export function unauthorizedResponse(error: string = 'Unauthorized') {
  return new Response(
    JSON.stringify({ error }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * 서버 컴포넌트용 인증 (쿠키 기반)
 * MVP에서는 URL 파라미터 방식 사용 권장
 */
export function getClinicIdFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const clinicCookie = cookies.find(c => c.startsWith('clinic_id='));
  
  if (!clinicCookie) return null;
  
  return clinicCookie.split('=')[1];
}
