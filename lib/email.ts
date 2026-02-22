// lib/email.ts
// 이메일 발송 유틸리티 — Resend API 사용 (server-only)
// EMAIL_PROVIDER_API_KEY 미설정 시 개발 모드(콘솔 출력)로 동작

const DEFAULT_FROM = "NextWeight <noreply@nextweight.co.kr>";

interface SendOptions {
  to: string;
  token: string;
  code: string;
  baseUrl: string;
}

function buildHtml(magicUrl: string, code: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NextWeight 로그인 링크</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">

          <!-- 헤더 -->
          <tr>
            <td style="background:#1d4ed8;padding:24px 32px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                Next<span style="color:#93c5fd;">Weight</span>
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#bfdbfe;">환자 자가관리 플랫폼</p>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0f172a;">로그인 요청이 도착했습니다</p>
              <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
                아래 버튼을 클릭하거나 인증 코드를 입력하여 NextWeight에 로그인하세요.<br />
                본인이 요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.
              </p>

              <!-- 로그인 버튼 -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="border-radius:8px;background:#1d4ed8;">
                    <a href="${magicUrl}"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:-0.2px;">
                      이메일로 로그인하기 →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- 구분선 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="border-top:1px solid #e2e8f0;"></td>
                  <td style="padding:0 12px;white-space:nowrap;font-size:12px;color:#94a3b8;">또는 아래 인증 코드 입력</td>
                  <td style="border-top:1px solid #e2e8f0;"></td>
                </tr>
              </table>

              <!-- 인증 코드 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center" style="background:#f1f5f9;border-radius:10px;padding:20px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#64748b;letter-spacing:1px;text-transform:uppercase;">인증 코드</p>
                    <p style="margin:0;font-size:36px;font-weight:700;color:#0f172a;letter-spacing:8px;font-variant-numeric:tabular-nums;">${code}</p>
                  </td>
                </tr>
              </table>

              <!-- 유효기간 안내 -->
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;">
                ⏱ 이 링크와 코드는 <strong>10분 후 만료</strong>됩니다.<br />
                만료 후에는 다시 로그인을 요청해 주세요.
              </p>
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;">
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                본인이 이 인증을 요청하지 않으셨다면, 이 메일을 무시해 주세요. 계정에는 별도 변경이 없습니다.<br />
                NextWeight — 의료용 체중 자가관리 서비스
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildText(magicUrl: string, code: string): string {
  return [
    "NextWeight 로그인",
    "",
    "아래 링크를 클릭하여 로그인하세요:",
    magicUrl,
    "",
    "또는 인증 코드를 입력하세요:",
    code,
    "",
    "이 링크와 코드는 10분 후 만료됩니다.",
    "",
    "본인이 요청하지 않으셨다면 이 메일을 무시하세요.",
  ].join("\n");
}

export async function sendMagicLinkEmail(opts: SendOptions): Promise<void> {
  const { to, token, code, baseUrl } = opts;
  const magicUrl = `${baseUrl}/auth/verify?token=${token}`;

  // 개발 모드: API 키 없으면 콘솔 출력
  if (!process.env.EMAIL_PROVIDER_API_KEY) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[NextWeight DEV] 이메일 발송 시뮬레이션");
    console.log(`  수신자  : ${to}`);
    console.log(`  매직링크: ${magicUrl}`);
    console.log(`  인증코드: ${code}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return;
  }

  const from = process.env.EMAIL_FROM_ADDRESS || DEFAULT_FROM;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.EMAIL_PROVIDER_API_KEY}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "NextWeight 로그인 링크",
      html: buildHtml(magicUrl, code),
      text: buildText(magicUrl, code),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`이메일 발송 실패 (${res.status}): ${body}`);
  }
}
