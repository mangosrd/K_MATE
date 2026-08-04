import { NextResponse } from "next/server";

export async function PUT() {
  return NextResponse.json(
    { success: false, message: "This development billing endpoint is disabled." },
    { status: 410 },
  );
}
