import { redirect } from "next/navigation";

// 루트 접속 시 로그인 화면으로 리다이렉트
export default function Home() {
  redirect("/login");
}
