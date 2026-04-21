"use client";

import { useState, useEffect } from "react";
import {
  Card, CardHeader, CardTitle, CardBody,
  Button, Badge, PageHeader,
} from "@/components/ui";
import { Check, Loader2, Plus, X } from "lucide-react";
import { useStore } from "@/lib/store-context";

const CATEGORY_OPTIONS = [
  { value: "beauty", label: "美容室・サロン" },
  { value: "restaurant", label: "飲食店" },
  { value: "clinic", label: "クリニック・医院" },
  { value: "other", label: "その他" },
];

export default function SettingsPage() {
  const { currentStoreId } = useStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [dataSource, setDataSource] = useState<"db" | "mock">("mock");
  const [loading, setLoading] = useState(true);

  // フォーム状態
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("beauty");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [menuOptions, setMenuOptions] = useState<string[]>([]);
  const [newMenu, setNewMenu] = useState("");
  const [gbpPlaceId, setGbpPlaceId] = useState("");

  useEffect(() => {
    if (!currentStoreId) return;
    setLoading(true);
    setEditing(false);
    const ctrl = new AbortController();
    fetch(`/api/settings?storeId=${encodeURIComponent(currentStoreId)}`, {
      cache: "no-store",
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        const s = data.store;
        setName(s.name ?? "");
        setArea(s.area ?? "");
        setCategory(s.category ?? "beauty");
        setKeywords(s.keywords ?? []);
        setMenuOptions(Array.isArray(s.menu_options) ? s.menu_options : []);
        setGbpPlaceId(s.gbp_place_id ?? "");
        setDataSource(data.source ?? "mock");
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [currentStoreId]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/settings?storeId=${encodeURIComponent(currentStoreId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          area,
          category,
          keywords,
          menu_options: menuOptions,
          gbp_place_id: gbpPlaceId.trim() || null,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setEditing(false);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const err = await res.json();
        setSaveError(err.error ?? "保存に失敗しました");
      }
    } catch {
      setSaveError("DB未接続のためローカルのみ反映されます");
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (kw: string) => setKeywords(keywords.filter((k) => k !== kw));

  const addMenu = () => {
    const m = newMenu.trim();
    if (m && !menuOptions.includes(m)) {
      setMenuOptions([...menuOptions, m]);
      setNewMenu("");
    }
  };
  const removeMenu = (m: string) => setMenuOptions(menuOptions.filter((x) => x !== m));

  // 業種ごとのメニュー欄ラベル
  const menuLabel =
    category === "restaurant"
      ? "メニュー（料理・ドリンク）"
      : category === "beauty"
      ? "メニュー（カット・カラー等）"
      : "メニュー";
  const menuPlaceholder =
    category === "restaurant"
      ? "例：パスタ / ピザ / ワイン"
      : category === "beauty"
      ? "例：カット / カラー / 縮毛矯正"
      : "例：メニュー名";

  if (loading) {
    return (
      <div className="animate-slide-up flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
        <p style={{ color: "var(--muted)" }}>店舗情報を取得中...</p>
      </div>
    );
  }

  return (
    <div className="animate-slide-up max-w-2xl">
      <PageHeader
        title="設定"
        subtitle="店舗情報・API設定・プラン管理"
        badge={dataSource === "db" ? "Supabase" : "デモデータ"}
      />

      <div className="space-y-5">
        {/* ── 店舗情報 ── */}
        <Card>
          <CardHeader>
            <CardTitle>店舗情報</CardTitle>
            <div className="flex items-center gap-2">
              {saved && <span className="text-[12px]" style={{ color: "var(--green)" }}>✓ 保存しました</span>}
              {saveError && <span className="text-[11px]" style={{ color: "var(--amber)" }}>{saveError}</span>}
              <Badge variant={dataSource === "db" ? "green" : "amber"}>
                {dataSource === "db" ? "DB連携済" : "デモ"}
              </Badge>
              {!editing ? (
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>編集する</Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <><Loader2 size={12} className="animate-spin" /> 保存中...</> : <><Check size={12} /> 保存</>}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>キャンセル</Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* 店舗名 */}
            <div>
              <label className="block text-[12px] mb-1" style={{ color: "var(--muted2)" }}>店舗名</label>
              {editing ? (
                <input className="input-base" value={name} onChange={(e) => setName(e.target.value)} />
              ) : (
                <div className="input-base" style={{ color: "#f1f5f9", cursor: "default" }}>{name}</div>
              )}
            </div>

            {/* エリア */}
            <div>
              <label className="block text-[12px] mb-1" style={{ color: "var(--muted2)" }}>エリア</label>
              {editing ? (
                <input className="input-base" value={area} onChange={(e) => setArea(e.target.value)} placeholder="例：銀座" />
              ) : (
                <div className="input-base" style={{ color: "#f1f5f9", cursor: "default" }}>{area}</div>
              )}
            </div>

            {/* 業種 */}
            <div>
              <label className="block text-[12px] mb-1" style={{ color: "var(--muted2)" }}>業種</label>
              {editing ? (
                <select className="input-base" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <div className="input-base" style={{ color: "#f1f5f9", cursor: "default" }}>
                  {CATEGORY_OPTIONS.find((o) => o.value === category)?.label ?? category}
                </div>
              )}
            </div>

            {/* 対策キーワード */}
            <div>
              <label className="block text-[12px] mb-2" style={{ color: "var(--muted2)" }}>
                対策キーワード <span style={{ color: "var(--muted)" }}>（AIが口コミ・投稿に使用）</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px]"
                    style={{
                      background: "rgba(59,130,246,0.1)",
                      border: "1px solid rgba(59,130,246,0.3)",
                      color: "var(--accent)",
                    }}
                  >
                    {kw}
                    {editing && (
                      <button
                        onClick={() => removeKeyword(kw)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", lineHeight: 1 }}
                      >
                        <X size={11} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {editing && (
                <div className="flex gap-2">
                  <input
                    className="input-base flex-1"
                    placeholder="新しいキーワードを追加..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                  />
                  <Button size="sm" onClick={addKeyword}>
                    <Plus size={13} /> 追加
                  </Button>
                </div>
              )}
            </div>

            {/* メニュー選択肢（アンケートで使用） */}
            <div>
              <label className="block text-[12px] mb-2" style={{ color: "var(--muted2)" }}>
                {menuLabel} <span style={{ color: "var(--muted)" }}>（アンケートの選択肢として表示）</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {menuOptions.length === 0 && !editing && (
                  <span className="text-[12px]" style={{ color: "var(--muted)" }}>
                    未登録（業種テンプレの既定値を使用）
                  </span>
                )}
                {menuOptions.map((m) => (
                  <span
                    key={m}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px]"
                    style={{
                      background: "rgba(16,185,129,0.1)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      color: "#10b981",
                    }}
                  >
                    {m}
                    {editing && (
                      <button
                        onClick={() => removeMenu(m)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", lineHeight: 1 }}
                      >
                        <X size={11} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {editing && (
                <div className="flex gap-2">
                  <input
                    className="input-base flex-1"
                    placeholder={menuPlaceholder}
                    value={newMenu}
                    onChange={(e) => setNewMenu(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addMenu()}
                  />
                  <Button size="sm" onClick={addMenu}>
                    <Plus size={13} /> 追加
                  </Button>
                </div>
              )}
            </div>

            {/* Google Business Profile（Place ID） */}
            <div>
              <label className="block text-[12px] mb-1" style={{ color: "var(--muted2)" }}>
                Google Business Profile — Place ID{" "}
                <span style={{ color: "var(--muted)" }}>
                  （登録するとQR口コミ投稿時に正しいGoogle口コミ画面へ直接遷移）
                </span>
              </label>
              {editing ? (
                <input
                  className="input-base"
                  value={gbpPlaceId}
                  onChange={(e) => setGbpPlaceId(e.target.value)}
                  placeholder="例：ChIJN1t_tDeuEmsRUsoyG83frY4"
                />
              ) : (
                <div className="input-base" style={{ color: "#f1f5f9", cursor: "default" }}>
                  {gbpPlaceId || "（未設定）"}
                </div>
              )}
              <p className="text-[11px] mt-1.5" style={{ color: "var(--muted)" }}>
                取得方法:{" "}
                <a
                  href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--accent)", textDecoration: "underline" }}
                >
                  Place ID Finder
                </a>{" "}
                で店舗名を検索
              </p>
            </div>
          </CardBody>
        </Card>

        {/* ── API設定 ── */}
        <Card>
          <CardHeader>
            <CardTitle>Anthropic API設定</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="mb-4">
              <label className="block text-[12px] mb-1.5" style={{ color: "var(--muted2)" }}>APIキー</label>
              <input
                type="password"
                className="input-base"
                placeholder="sk-ant-..."
                defaultValue="sk-ant-***************************"
              />
              <p className="text-[11px] mt-1.5" style={{ color: "var(--muted)" }}>
                .env.local の ANTHROPIC_API_KEY に設定してください
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-[12px] mb-1.5" style={{ color: "var(--muted2)" }}>Supabase URL</label>
              <input
                type="text"
                className="input-base"
                placeholder="https://xxxx.supabase.co"
                defaultValue={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}
              />
            </div>
            <Button size="sm">保存する</Button>
          </CardBody>
        </Card>

        {/* ── プラン ── */}
        <Card>
          <CardHeader>
            <CardTitle>現在のプラン</CardTitle>
            <Badge variant="amber">運用代行プラン</Badge>
          </CardHeader>
          <CardBody>
            <div className="font-mono text-2xl font-semibold mb-1">
              ¥30,000{" "}
              <span className="text-sm font-normal" style={{ color: "var(--muted)" }}>/ 月（税別）</span>
            </div>
            <div className="text-[13px] space-y-1 mt-3" style={{ color: "var(--muted2)" }}>
              <div>✓ GBP連携・アンケート作成</div>
              <div>✓ 最新情報投稿（週2回）</div>
              <div>✓ 口コミ返信（週3回）</div>
              <div>✓ キーワード設定・管理</div>
            </div>
            <Button className="mt-4" size="sm">総合コンサルプランにアップグレード</Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
