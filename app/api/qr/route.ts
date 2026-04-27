import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * QR コード生成プロキシ。
 * api.qrserver.com からサーバー側で取得し、PNGバイナリを同一オリジンで返す。
 * ブラウザ側の CORS 制約や `download` 属性の cross-origin 制約を回避する目的。
 *
 * クエリパラメータ:
 *  - data: QR にエンコードする文字列（必須）
 *  - size: 1辺のピクセル数（任意、既定 1024）
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data");
  const sizeParam = searchParams.get("size");
  if (!data) {
    return NextResponse.json({ error: "data is required" }, { status: 400 });
  }
  const size = (() => {
    const n = parseInt(sizeParam ?? "1024", 10);
    if (!Number.isFinite(n)) return 1024;
    return Math.max(64, Math.min(2048, n));
  })();

  const upstream = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    data
  )}&margin=10&color=000000&bgcolor=ffffff&format=png`;

  try {
    const res = await fetch(upstream, { cache: "no-store" });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `upstream ${res.status}: ${txt.slice(0, 200)}` },
        { status: 502 }
      );
    }
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: `fetch failed: ${e?.message ?? "unknown"}` },
      { status: 500 }
    );
  }
}
