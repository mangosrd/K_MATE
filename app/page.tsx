import { redirect } from "next/navigation";
import { cookies } from "next/headers";

// Keep a signed-in visitor in the app instead of showing the login screen again on every launch.
export default async function Home() {
  const cookieStore = await cookies();
  redirect(cookieStore.get("kmate_uid")?.value ? "/map" : "/login");
}
