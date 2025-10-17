import type { ApiResult } from "@/lib/api";

type MainCampusCredentials = {
  username: string;
  password: string;
};

export async function fetchMainCampusScores(credentials: MainCampusCredentials): Promise<ApiResult> {
  const { username, password } = credentials;
  const url = `/api/iaaa?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`本部成绩接口返回异常（${response.status}）`);
  }

  return (await response.json()) as ApiResult;
}
