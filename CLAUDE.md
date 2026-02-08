# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

logifai は、開発コマンドの出力を自動キャプチャし、Claude Code から検索・分析できる CLI ツール。Node.js/TypeScript で実装する。

**コア機能**: `npm run dev 2>&1 | logifai` でログをパイプキャプチャし、NDJSON 形式で永続保存。Claude Code Skill 経由で AI がログを検索・分析する。

## 技術スタック

- **言語**: TypeScript (Node.js)
- **依存関係**: 最小（標準ライブラリ中心）
- **ストレージ**: NDJSON ファイル（Phase 1）、SQLite FTS5（Phase 3）
- **AI統合**: Claude Code Skill（Phase 1-3）、MCP サーバー（Phase 4）

## アーキテクチャ

### 段階的実装（4フェーズ）

- **Phase 1（最小MVP）**: パイプキャプチャ (`logifai`) + NDJSON 保存 + 正規化エンジン + リダクション + Web UI + Claude Code Skill + `show` コマンド（ログ行参照解決） + `cleanup` コマンド（保持ポリシーによるセッション削除） + 設定管理（`settings.json`）
- **Phase 2**: 子プロセス対応 (`logifai exec`) + TTY伝播 + シグナル転送
- **Phase 3**: SQLite FTS5 インデックス + `.logifai.toml` 設定ファイル + `logifai start`
- **Phase 4**: MCP サーバー + セマンティック検索 + 異常検知

### ストレージ（XDG Base Directory 準拠）

```
~/.local/state/logifai/logs/     # ログ本体（NDJSON）
~/.local/share/logifai/          # SQLite インデックス（Phase 3）
~/.config/logifai/               # 設定ファイル
~/.cache/logifai/                # キャッシュ
```

### NDJSON スキーマ

各ログ行は以下のフィールドを持つ JSON オブジェクト：

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `timestamp` | string | ISO 8601 形式 |
| `level` | string | `ERROR` / `WARN` / `INFO` / `DEBUG` |
| `message` | string | ログメッセージ本文 |
| `source` | string | キャプチャ元コマンド |
| `project` | string | プロジェクトパス |
| `session_id` | string | セッション識別子（UUID 先頭8文字） |
| `git_branch` | string\|null | Git ブランチ |
| `git_commit` | string\|null | Git コミットハッシュ（短縮形） |
| `pid` | number | プロセス ID |
| `raw` | boolean | 非構造化ログの場合 `true` |
| `stack` | string\|null | スタックトレース |
| `_original` | object\|null | 元の JSON フィールド（JSON 入力の場合） |

### 正規化エンジン

stdin を1行ずつ処理し、JSON 自動検出 → 非構造化ログのレベル推論（ERROR/WARN/INFO/DEBUG）→ スタックトレース検出 → 共通フォーマット（CLF, Syslog）パースを行い、統一 NDJSON スキーマで保存する。

### セキュリティ

ログに混入する秘密情報（API キー、トークン、DB 接続文字列等）を正規表現パターンで自動リダクション。ファイルパーミッション 700/600。デフォルトでローカルオンリー。

## 設計ドキュメント

詳細な技術仕様・競合分析・ロードマップは `doc.md` を参照。
