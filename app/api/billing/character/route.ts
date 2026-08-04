import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, message: "This development billing endpoint is disabled." },
    { status: 410 },
  );
}
