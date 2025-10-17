import { NextRequest } from "next/server";

function parseCookies(response: Response) {
  const raw = response.headers.get("set-cookie");
  if (raw === null) {
    return "";
  }

  return raw
    .split(", ")
    .map((entry) => {
      const parts = entry.split(";");
      return parts[0];
    })
    .join("; ");
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username");
  const password = url.searchParams.get("password");

  if (!username || !password) {
    return new Response(null, { status: 400 });
  }

  const iaaaParams = new URLSearchParams();
  iaaaParams.set("appid", "portalPublicQuery");
  iaaaParams.set("userName", username);
  iaaaParams.set("password", password);

  const MOD_ID = "myScore";
  const REDIR_URL = `https://portal.pku.edu.cn/publicQuery/ssoLogin.do?moduleID=${MOD_ID}`;
  iaaaParams.set("redirUrl", REDIR_URL);

  const loginResponse = await fetch(
    "https://iaaa.pku.edu.cn/iaaa/oauthlogin.do",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: iaaaParams.toString(),
    },
  );

  const loginJson = await loginResponse.json();

  if (!loginJson.success) {
    return Response.json(
      {
        success: false,
        errMsg: loginJson.errors?.msg ?? "IAAA 登录失败",
      },
      { status: 403 },
    );
  }

  const portalResponse = await fetch(
    `${REDIR_URL}?moduleID=${MOD_ID}&token=${loginJson.token}`,
    {
      redirect: "manual",
    },
  );
  const cookie = parseCookies(portalResponse);

  if (!cookie) {
    return Response.json(
      {
        success: false,
        errMsg: "Portal login 未返回 cookie",
      },
      { status: 503 },
    );
  }

  const scoresResponse = await fetch(
    "https://portal.pku.edu.cn/publicQuery/ctrl/topic/myScore/retrScores.do",
    {
      headers: {
        cookie,
      },
    },
  );

  const rawText = await scoresResponse.text();

  try {
    const result = JSON.parse(rawText);
    if (
      result?.cjxx &&
      Array.isArray(result.cjxx) &&
      result.cjxx.every((item: unknown) => typeof item === "object" && item)
    ) {
      if (result.cjxx.some((item: { list?: unknown }) => Array.isArray(item.list))) {
        result.cjxx = result.cjxx.flatMap((item: { list?: unknown[] }) =>
          Array.isArray(item.list) ? item.list : [],
        );
      }
    }

    return Response.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        {
          success: false,
          errMsg: `Portal respond with non-JSON content: ${rawText}`,
        },
        { status: 502 },
      );
    }
    return Response.json(
      {
        success: false,
        errMsg: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
