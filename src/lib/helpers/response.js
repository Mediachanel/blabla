import { NextResponse } from "next/server";

export function ok(data, message = "Berhasil") {
  return NextResponse.json({ success: true, message, data });
}

export function fail(message = "Permintaan tidak dapat diproses", status = 400, errors = null) {
  return NextResponse.json({ success: false, message, errors }, { status });
}
