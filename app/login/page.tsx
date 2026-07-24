import type { Metadata } from "next";
import LoginView from "./LoginView";

export const metadata: Metadata = {
  title: "로그인 — K-MATE",
  description: "K-MATE에 로그인하고 AI 메이트와 함께 한국어 여행을 시작하세요.",
};

export default function LoginPage() {
  return <LoginView />;
}
