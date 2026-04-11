#!/bin/bash
set -e
echo "🔄 ヒョーバンへのリネーム開始..."

# app/layout.tsx
sed -i '' 's/口コミ365 — AI MEO \/ AIO Platform/ヒョーバン — AI MEO \/ AIO Platform/g' app/layout.tsx

# components/layout/Sidebar.tsx
sed -i '' 's/口コミ365/ヒョーバン/g' components/layout/Sidebar.tsx

# package.json
sed -i '' 's/"name": "review365"/"name": "hyoban"/g' package.json

# README.md
sed -i '' 's/口コミ365/ヒョーバン/g' README.md

echo "✅ 全ファイルの置換完了！"
echo ""
echo "変更されたファイル:"
echo "  - app/layout.tsx (ブラウザタブタイトル)"
echo "  - components/layout/Sidebar.tsx (サイドバーロゴ)"
echo "  - package.json (プロジェクト名)"
echo "  - README.md (ドキュメント)"
echo ""
echo "次のステップ: npm run dev を再起動してください"
