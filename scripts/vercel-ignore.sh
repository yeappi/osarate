#!/usr/bin/env bash
# Vercel の Ignored Build Step。exit 0 = ビルドしない / exit 1 = ビルドする
# デプロイ回数の上限を消費しないため、次の場合はビルドしない：
#   - main 以外のブランチ
#   - アプリに関係するファイルが変わっていない（ドキュメント・DB・テストだけの変更）

if [ "$VERCEL_GIT_COMMIT_REF" != "main" ]; then
  echo "skip: branch $VERCEL_GIT_COMMIT_REF is not main"
  exit 0
fi

BASE="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"
APP_PATHS="src public package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs vercel.json scripts/vercel-ignore.sh"

# 比較できない場合（履歴が足りない等）は安全側に倒してビルドする
if ! git cat-file -e "$BASE" 2>/dev/null; then
  echo "build: cannot find $BASE"
  exit 1
fi

if git diff --quiet "$BASE" HEAD -- $APP_PATHS; then
  echo "skip: no app changes since $BASE"
  exit 0
fi

echo "build: app files changed"
exit 1
