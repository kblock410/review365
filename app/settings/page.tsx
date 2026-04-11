"use client";

import {
  Card, CardHeader, CardTitle, CardBody,
  Button, Badge, PageHeader,
} from "@/components/ui";
import { MOCK_STORE } from "@/lib/utils";

export default function SettingsPage() {
  return (
    <div className="animate-slide-up max-w-2xl">
      <PageHeader title="設定" subtitle="店舗情報・API設定・プラン管理" />

      <div className="space-y-5">
        {/* Store info */}
        <Card>
          <CardHeader>
            <CardTitle>店舗情報</CardTitle>
            <Badge variant="green">登録済</Badge>
          </CardHeader>
          <CardBody className="space-y-4">
            {[
              { label: "店舗名", value: MOCK_STORE.name },
              { label: "エリア", value: MOCK_STORE.area },
              { label: "業種", value: "美容室" },
              { label: "対策キーワード", value: MOCK_STORE.keywords.join("　/　") },
            ].map((item) => (
              <div key={item.label}>
                <label className="block text-[12px] mb-1" style={{ color: "var(--muted2)" }}>
                  {item.label}
                </label>
                <div
                  className="input-base"
                  style={{ color: "#f1f5f9", cursor: "default" }}
                >
                  {item.value}
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm">編集する</Button>
          </CardBody>
        </Card>

        {/* API key */}
        <Card>
          <CardHeader>
            <CardTitle>Anthropic API設定</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="mb-4">
              <label className="block text-[12px] mb-1.5" style={{ color: "var(--muted2)" }}>
                APIキー
              </label>
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
            <Button size="sm">保存する</Button>
          </CardBody>
        </Card>

        {/* Plan */}
        <Card>
          <CardHeader>
            <CardTitle>現在のプラン</CardTitle>
            <Badge variant="amber">運用代行プラン</Badge>
          </CardHeader>
          <CardBody>
            <div className="font-mono text-2xl font-semibold mb-1">¥30,000 <span className="text-sm font-normal" style={{ color: "var(--muted)" }}>/ 月（税別）</span></div>
            <div className="text-[13px] space-y-1 mt-3" style={{ color: "var(--muted2)" }}>
              <div>✓ GBP連携・アンケート作成</div>
              <div>✓ 最新情報投稿（週2回）</div>
              <div>✓ 口コミ返信（週3回）</div>
            </div>
            <Button className="mt-4" size="sm">総合コンサルプランにアップグレード</Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

